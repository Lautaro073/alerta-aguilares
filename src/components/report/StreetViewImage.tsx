'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { RotateCcw, RotateCw, Compass, Loader2 } from 'lucide-react';

interface StreetViewImageProps {
  lat: number;
  lng: number;
}

// Las 8 direcciones cardinales/intermedias a precargar
const HEADINGS = [0, 45, 90, 135, 180, 225, 270, 315];
const HEADING_STEP = 45;

/**
 * Componente de Street View con precarga de todas las orientaciones.
 * Al abrir, precarga silenciosamente las 8 imágenes (N/NE/E/SE/S/SO/O/NO)
 * para que la rotación sea completamente instantánea.
 */
export default function StreetViewImage({ lat, lng }: StreetViewImageProps) {
  const [heading, setHeading] = useState(0);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const [hasError, setHasError] = useState(false);
  const preloadRefs = useRef<HTMLImageElement[]>([]);

  // Precargar las 8 orientaciones en cuanto cambian las coordenadas
  useEffect(() => {
    let mounted = true;

    HEADINGS.forEach((h) => {
      const img = new window.Image();

      img.onload = () => {
        if (mounted) setLoadedSet((prev) => new Set([...prev, h]));
      };
      img.onerror = () => {
        if (mounted && h === 0) setHasError(true);
      };

      // Asignar src DESPUÉS de los handlers para evitar race conditions
      img.src = `/api/streetview?lat=${lat}&lng=${lng}&heading=${h}`;
      preloadRefs.current.push(img);
    });

    return () => {
      mounted = false;
      // Anular callbacks antes de cualquier limpieza para no disparar estados
      preloadRefs.current.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      preloadRefs.current = [];
    };
  }, [lat, lng]);

  const rotateLeft = () => setHeading((h) => (h - HEADING_STEP + 360) % 360);
  const rotateRight = () => setHeading((h) => (h + HEADING_STEP) % 360);

  // La imagen principal está lista cuando su heading fue precargado
  const isCurrentLoaded = loadedSet.has(heading);
  // Cuántas de las 8 imágenes ya están listas
  const loadedCount = loadedSet.size;
  const isInitialLoading = loadedCount === 0 && !hasError;

  return (
    <div className="relative w-full h-44 sm:h-52 bg-surface-1 rounded-lg overflow-hidden border border-border/80 shadow-md select-none">

      {/* Estado de carga inicial (esperando la primera imagen) */}
      {isInitialLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-2/90 z-10">
          <Loader2 size={28} className="text-accent animate-spin" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-jakarta text-xs font-semibold text-foreground/80">
              Obteniendo vista de calle...
            </span>
            <span className="font-jakarta text-[10px] text-muted">
              Precargando orientaciones…
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {hasError && (
        <div className="absolute inset-0 bg-surface-2/90 flex flex-col items-center justify-center p-4 text-center z-10">
          <h4 className="font-outfit text-sm font-bold text-foreground">
            Error de conexión visual
          </h4>
          <p className="font-jakarta text-xs text-muted mt-1 leading-normal max-w-[240px]">
            No se pudo establecer conexión con el proxy de Street View.
          </p>
        </div>
      )}

      {/* Imagen activa — usa la URL cacheada por el browser, cambio instantáneo */}
      {!hasError && (
        <NextImage
          key={`${lat}-${lng}-${heading}`}
          src={`/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}`}
          alt={`Street View ${heading}° — ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          fill
          sizes="(max-width: 640px) 100vw, 384px"
          unoptimized
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isCurrentLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable="false"
        />
      )}

      {/* Badge superior con orientación actual */}
      {isCurrentLoaded && !hasError && (
        <div className="absolute top-2 left-2 glass px-2 py-0.5 text-[10px] font-outfit font-extrabold text-white tracking-wider uppercase select-none pointer-events-none flex items-center gap-1">
          <Compass size={10} className="shrink-0" />
          <span>Street View · {heading}°</span>
        </div>
      )}

      {/* Barra de precarga inferior (progreso de las 8 imágenes) */}
      {loadedCount > 0 && loadedCount < HEADINGS.length && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-surface-3 z-10 pointer-events-none">
          <div
            className="h-full bg-accent/60 transition-all duration-300"
            style={{ width: `${(loadedCount / HEADINGS.length) * 100}%` }}
          />
        </div>
      )}

      {/* Controles de rotación */}
      {!hasError && loadedCount > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
          <button
            onClick={rotateLeft}
            className="w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all duration-150"
            title="Rotar a la izquierda (−45°)"
          >
            <RotateCcw size={14} />
          </button>

          <div className="glass px-2 py-1 rounded-full border border-white/15 font-mono text-[10px] text-white/90 font-bold min-w-[38px] text-center">
            {heading}°
          </div>

          <button
            onClick={rotateRight}
            className="w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all duration-150"
            title="Rotar a la derecha (+45°)"
          >
            <RotateCw size={14} />
          </button>
        </div>
      )}

    </div>
  );
}
