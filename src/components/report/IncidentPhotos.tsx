'use client';

import { useState, useRef } from 'react';
import NextImage from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  X, 
  Maximize2,
  RefreshCw
} from 'lucide-react';

interface IncidentPhotosProps {
  urls: string[];
}

export default function IncidentPhotos({ urls }: IncidentPhotosProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Estados para el zoom y arrastre interactivo en pantalla completa
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);

  if (!urls || urls.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdx = activeIndex === 0 ? urls.length - 1 : activeIndex - 1;
    setActiveIndex(newIdx);
    resetZoom();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdx = activeIndex === urls.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIdx);
    resetZoom();
  };

  const openLightbox = () => {
    resetZoom();
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    resetZoom();
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Lógica de arrastre por Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Lógica de arrastre táctil para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const activeUrl = urls[activeIndex];
  if (!activeUrl) return null;

  return (
    <>
      {/* Contenedor Thumbnail con Hover Premium y sin botón de rotar */}
      <div 
        onClick={openLightbox}
        className="relative w-full h-44 sm:h-52 bg-surface-1 rounded-lg overflow-hidden border border-border/80 shadow-md select-none group cursor-pointer"
      >
        {/* Contenedor de la Imagen */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20">
          <NextImage
            src={activeUrl}
            alt={`Foto del incidente ${activeIndex + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            unoptimized
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
            draggable="false"
          />
        </div>

        {/* Overlay Hover Premium con Icono de Ampliar */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="glass px-4 py-2 rounded-pill border border-white/20 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 text-white font-outfit text-xs font-bold shadow-glow">
            <Maximize2 size={13} className="animate-pulse" />
            <span>Ampliar foto</span>
          </div>
        </div>

        {/* Badge superior indicador */}
        <div className="absolute top-2 left-2 glass px-2 py-0.5 text-[10px] font-outfit font-extrabold text-white tracking-wider uppercase flex items-center gap-1 select-none pointer-events-none z-10">
          <ImageIcon size={10} className="shrink-0" />
          <span>Foto {activeIndex + 1} de {urls.length}</span>
        </div>

        {/* Controles de Navegación del Thumbnail (si hay más de una foto) */}
        {urls.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-white hover:bg-white/25 hover:border-white/35 active:scale-95 transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
              title="Foto anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-white hover:bg-white/25 hover:border-white/35 active:scale-95 transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
              title="Siguiente foto"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Indicadores de puntos inferiores si hay múltiples fotos */}
        {urls.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
            {urls.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === activeIndex ? 'bg-accent w-3.5 shadow-glow' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL FULLSCREEN / LIGHTBOX CON ZOOM Y ARRASTRE PREMIUM                     */}
      {/* ========================================================================= */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md select-none animate-fade-in pointer-events-auto"
          onClick={closeLightbox}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
        >
          {/* Header del Lightbox flotante superior */}
          <div 
            className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none"
          >
            {/* Indicador de foto actual */}
            <div className="glass px-3 py-1.5 text-xs font-outfit font-extrabold text-white/90 tracking-wide uppercase flex items-center gap-1.5 select-none">
              <ImageIcon size={12} />
              <span>{activeIndex + 1} / {urls.length}</span>
            </div>

            {/* Controles del Visualizador (Zoom + - y Cerrar) */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Botón Zoom Out */}
              <button
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 disabled:pointer-events-none"
                title="Alejar (-)"
              >
                <ZoomOut size={16} />
              </button>

              {/* Indicador del porcentaje actual de Zoom */}
              <span className="glass min-w-[50px] text-center px-2 py-2 text-[10px] font-mono font-bold text-white/90">
                {Math.round(scale * 100)}%
              </span>

              {/* Botón Zoom In */}
              <button
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 disabled:pointer-events-none"
                title="Acercar (+)"
              >
                <ZoomIn size={16} />
              </button>

              {/* Resetear Zoom si se ha ampliado */}
              {scale > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoom();
                  }}
                  className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-accent hover:bg-white/20 active:scale-90 transition-all"
                  title="Restablecer vista"
                >
                  <RefreshCw size={14} />
                </button>
              )}

              {/* Separador */}
              <div className="w-px h-6 bg-white/10 mx-1" />

              {/* Botón Cerrar */}
              <button
                onClick={closeLightbox}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-red-500 hover:border-red-600 active:scale-90 transition-all"
                title="Cerrar (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de la Imagen con Paneo y Zoom */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <NextImage
              ref={imgRef}
              src={activeUrl}
              alt={`Zoom del incidente ${activeIndex + 1}`}
              width={1600}
              height={1200}
              unoptimized
              onDoubleClick={handleDoubleClick}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[95vw] max-h-[85vh] object-contain select-none select-none select-none pointer-events-auto"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
              draggable="false"
            />
          </div>

          {/* Tips e Indicadores flotantes inferiores */}
          <div className="absolute bottom-5 left-4 right-4 flex flex-col items-center gap-3 pointer-events-none z-30">
            {scale > 1 ? (
              <span className="glass px-3.5 py-1.5 text-[10.5px] font-jakarta text-white/70 tracking-wide shadow-lg text-center animate-fade-in select-none">
                Arrastrá la foto para explorar los detalles. Doble clic para restablecer.
              </span>
            ) : (
              <span className="glass px-3.5 py-1.5 text-[10.5px] font-jakarta text-white/50 tracking-wide shadow-lg text-center select-none">
                Doble clic en la imagen o usá + / - para hacer zoom.
              </span>
            )}

            {/* Puntos de navegación en pantalla completa */}
            {urls.length > 1 && (
              <div className="flex items-center gap-2 pointer-events-auto mt-1">
                {urls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(idx);
                      resetZoom();
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === activeIndex ? 'bg-accent w-4 shadow-glow' : 'bg-white/40 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Navegación lateral en pantalla completa (si hay múltiples fotos y no hay zoom aplicado) */}
          {urls.length > 1 && scale === 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all z-40 pointer-events-auto"
                title="Foto anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all z-40 pointer-events-auto"
                title="Siguiente foto"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
