'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X, Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { getAppCheckToken } from '@/lib/firebase/appCheckClient';

interface ImageUploaderProps {
  images: string[];
  onChangeImages: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({
  images,
  onChangeImages,
  maxImages = 3,
}: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    
    // Validar tipo de archivo estricto (solo fotos reales, excluyendo SVG/vectores)
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const hasInvalidFile = files.some((file) => !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()));
    if (hasInvalidFile) {
      setError('Solo se permiten fotos reales (JPEG, PNG, WEBP, HEIC). Los gráficos vectoriales como SVG no están permitidos.');
      return;
    }
    
    // Validar cantidad máxima total
    if (images.length + files.length > maxImages) {
      setError(`Podés subir hasta un máximo de ${maxImages} fotos.`);
      return;
    }

    // Subir cada archivo secuencialmente o en paralelo
    const uploadingPlaceholders = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      file,
    }));

    setUploadingFiles((prev) => [...prev, ...uploadingPlaceholders.map(({ id, name }) => ({ id, name }))]);

    const uploadedUrls: string[] = [];

    // Realizar uploads
    await Promise.all(
      uploadingPlaceholders.map(async ({ id, file }) => {
        try {
          // Validar tamaño (10MB)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error('La imagen supera los 10MB.');
          }

          const formData = new FormData();
          formData.append('file', file);

          const appCheckToken = await getAppCheckToken();
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {}),
            },
            body: formData,
          });

          if (!response.ok) {
            const resData = await response.json();
            throw new Error(resData.error || resData.message || 'Error al subir la imagen.');
          }

          const resData = await response.json();
          if (resData.success && resData.url) {
            uploadedUrls.push(resData.url);
          }
        } catch (err: unknown) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : 'Error al subir una de las imágenes.';
          setError(errorMessage);
        } finally {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
        }
      })
    );

    if (uploadedUrls.length > 0) {
      onChangeImages([...images, ...uploadedUrls]);
    }

    // Resetear input para poder seleccionar el mismo archivo si es necesario
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    onChangeImages(images.filter((url) => url !== urlToRemove));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="font-outfit text-xs font-bold text-foreground/80 tracking-wide flex items-center gap-1.5">
          <Camera size={13} className="text-muted" />
          <span>Fotos del incidente ({images.length}/{maxImages})</span>
        </span>
        <span className="font-jakarta text-[10px] text-muted font-semibold">Opcional</span>
      </div>

      {/* Grid de imágenes y zona de carga */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Renderizar imágenes subidas */}
        {images.map((url, idx) => (
          <div key={url} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-surface-1 group animate-scale-in">
            <Image
              src={url} 
              alt={`Foto ${idx + 1}`} 
              fill
              sizes="96px"
              unoptimized
              className="w-full h-full object-cover" 
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(url)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              title="Eliminar foto"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Renderizar cargando */}
        {uploadingFiles.map((file) => (
          <div key={file.id} className="relative aspect-square rounded-lg border border-border border-dashed bg-surface-1 flex items-center justify-center overflow-hidden animate-pulse">
            <Loader2 size={16} className="text-accent animate-spin" />
          </div>
        ))}

        {/* Botón para subir más */}
        {images.length + uploadingFiles.length < maxImages && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="aspect-square rounded-lg border border-dashed border-border-strong hover:border-accent hover:bg-surface-3 transition-all flex flex-col items-center justify-center gap-1 text-muted hover:text-foreground cursor-pointer group"
          >
            <ImagePlus size={16} className="group-hover:scale-110 transition-transform text-accent/80" />
            <span className="font-jakarta text-[9px] font-bold">Subir</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <span className="font-jakarta text-[10px] font-semibold text-rose-400 flex items-center gap-1 animate-slide-down">
          <AlertCircle size={10} className="shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}
