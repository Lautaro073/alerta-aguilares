'use client';

import { AlertCircle } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface ReportFormFieldsProps {
  title: string;
  description: string;
  images: string[];
  onChangeTitle: (val: string) => void;
  onChangeDescription: (val: string) => void;
  onChangeImages: (urls: string[]) => void;
  errors: {
    title?: string | undefined;
    description?: string | undefined;
  };
}

/**
 * Componente que agrupa los campos de entrada de texto del formulario de reporte (Título y Descripción) y el cargador de imágenes.
 * Cuenta con contadores de caracteres activos y renderizado responsivo de mensajes de error de validación.
 */
export default function ReportFormFields({
  title,
  description,
  images,
  onChangeTitle,
  onChangeDescription,
  onChangeImages,
  errors,
}: ReportFormFieldsProps) {
  const maxTitleChars = 80;
  const maxDescChars = 500;

  return (
    <div className="flex flex-col gap-4 select-none">
      
      {/* Sección Informativa del encabezado */}
      <div className="flex flex-col">
        <h3 className="font-outfit font-extrabold text-sm text-foreground tracking-wide">
          Detalles del incidente
        </h3>
        <p className="font-jakarta text-[11px] text-muted leading-tight mt-0.5">
          Escribí un título directo y una descripción que ayuden a los vecinos a entender el problema.
        </p>
      </div>

      {/* Campo TÍTULO */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center select-none">
          <label 
            htmlFor="report-title"
            className="font-outfit text-xs font-bold text-foreground/80 tracking-wide"
          >
            Título breve *
          </label>
          <span 
            className={`font-jakarta text-[10px] font-semibold ${
              title.length > maxTitleChars - 10 ? 'text-rose-400' : 'text-muted'
            }`}
          >
            {title.length}/{maxTitleChars}
          </span>
        </div>

        <input
          id="report-title"
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value.substring(0, maxTitleChars))}
          placeholder="Ej: Bache profundo al lado del semáforo"
          required
          maxLength={maxTitleChars}
          className={`w-full font-jakarta text-sm px-4 h-12 bg-surface-1 border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all ${
            errors.title ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500' : 'border-border hover:border-border-strong'
          }`}
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <span 
            id="title-error"
            className="font-jakarta text-[11px] font-semibold text-rose-400 select-none animate-slide-down flex items-center gap-1 mt-1"
          >
            <AlertCircle size={12} className="shrink-0" />
            <span>{errors.title}</span>
          </span>
        )}
      </div>

      {/* Campo DESCRIPCIÓN */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center select-none">
          <label 
            htmlFor="report-description"
            className="font-outfit text-xs font-bold text-foreground/80 tracking-wide"
          >
            Detalles adicionales (Opcional)
          </label>
          <span 
            className={`font-jakarta text-[10px] font-semibold ${
              description.length > maxDescChars - 30 ? 'text-rose-400' : 'text-muted'
            }`}
          >
            {description.length}/{maxDescChars}
          </span>
        </div>

        <textarea
          id="report-description"
          value={description}
          onChange={(e) => onChangeDescription(e.target.value.substring(0, maxDescChars))}
          placeholder="Describí con más detalles para alertar a los transeúntes (Ej. profundidad del pozo, si bloquea el tránsito, etc.)"
          maxLength={maxDescChars}
          rows={3.5}
          className={`w-full font-jakarta text-sm px-4 py-3 bg-surface-1 border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none ${
            errors.description ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500' : 'border-border hover:border-border-strong'
          }`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "desc-error" : undefined}
        />
        {errors.description && (
          <span 
            id="desc-error"
            className="font-jakarta text-[11px] font-semibold text-rose-400 select-none animate-slide-down flex items-center gap-1 mt-1"
          >
            <AlertCircle size={12} className="shrink-0" />
            <span>{errors.description}</span>
          </span>
        )}
      </div>

      {/* Cargador de Imágenes de Cloudinary */}
      <ImageUploader
        images={images}
        onChangeImages={onChangeImages}
        maxImages={3}
      />

    </div>
  );
}
