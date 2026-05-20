'use client';

import { CATEGORIES } from '@/lib/constants/categories';
import { Report } from '@/types/report';
import StreetViewImage from './StreetViewImage';
import IncidentPhotos from './IncidentPhotos';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { X, Clock, MapPin } from 'lucide-react';

interface ReportDetailDrawerProps {
  report: Report | null;
  onClose: () => void;
}

/**
 * Formatea una fecha ISO 8601 a un formato legible en español argentino.
 */
function formatReportDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' hs';
  } catch {
    return 'Fecha no disponible';
  }
}

/**
 * Panel de visualización de detalles de un reporte de incidencia.
 * 
 * Diseño ultra-premium responsivo con iconos Lucide en lugar de emojis.
 */
export default function ReportDetailDrawer({ report, onClose }: ReportDetailDrawerProps) {
  if (!report) return null;

  // Filtrar solo las fotos válidas (excluyendo vectores/SVGs u otros formatos no fotográficos)
  const validPhotos = (report.images || []).filter((url) => {
    try {
      const lowerUrl = url.toLowerCase().split('?')[0] ?? '';
      return (
        lowerUrl.endsWith('.jpg') ||
        lowerUrl.endsWith('.jpeg') ||
        lowerUrl.endsWith('.png') ||
        lowerUrl.endsWith('.webp') ||
        lowerUrl.endsWith('.heic') ||
        lowerUrl.endsWith('.heif')
      );
    } catch {
      return false;
    }
  });

  const categoryConfig = CATEGORIES[report.category];
  const categoryColor = categoryConfig?.color || '#9CA3AF';
  const categoryName = categoryConfig?.name || 'Reporte ciudadano';

  return (
    <>
      {/* Fondo opaco difuminado para móviles (permite cerrar al hacer click fuera) */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[1100] bg-background/50 backdrop-blur-[1.5px] transition-opacity duration-300 md:hidden pointer-events-auto"
      />

      {/* Contenedor del Drawer / Sheet (Responsivo) */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[1200] max-h-[85vh] bg-surface-2 rounded-t-xl border-t border-border shadow-lg flex flex-col p-5 animate-slide-up pointer-events-auto
                   md:bottom-4 md:right-4 md:left-auto md:w-96 md:rounded-lg md:border md:max-h-[600px] md:shadow-glow"
      >
        {/* Handle visual de arrastre exclusivo para móviles */}
        <div className="w-12 h-1 bg-border-strong rounded-full mx-auto mb-4 shrink-0 md:hidden" />

        {/* Encabezado con categoría e ID */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge de categoría de color dinámico con baja opacidad de fondo */}
            <span 
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-pill font-outfit text-xs font-bold select-none border"
              style={{
                backgroundColor: `${categoryColor}15`,
                color: categoryColor,
                borderColor: `${categoryColor}40`,
              }}
            >
              <CategoryIcon name={categoryConfig?.iconName || 'HelpCircle'} size={14} color={categoryColor} className="shrink-0" />
              <span>{categoryName}</span>
            </span>
          </div>

          {/* Botón de cerrar de alto contraste con área de toque WCAG (44x44px) */}
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border text-muted hover:text-foreground hover:bg-surface-3 transition-colors shrink-0"
            title="Cerrar detalles"
            aria-label="Cerrar panel de detalles"
          >
            <X size={16} />
          </button>
        </div>

        {/* Título en Outfit */}
        <h2 className="font-outfit font-extrabold text-lg text-foreground tracking-tight leading-snug mb-1">
          {report.title}
        </h2>

        {/* Fecha en Plus Jakarta Sans */}
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted mb-4 font-jakarta font-medium select-none">
          <Clock size={12} className="text-muted shrink-0" />
          <span>Reportado el {formatReportDate(report.createdAt)}</span>
        </div>

        {/* Sección deslizable del cuerpo */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar flex flex-col gap-4">
          
          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-outfit text-xs font-extrabold text-muted tracking-wider uppercase">
              Descripción del incidente
            </h3>
            {report.description ? (
              <p className="font-jakarta text-sm text-foreground/80 bg-surface-1/40 p-3 rounded-lg border border-border/30 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {report.description}
              </p>
            ) : (
              <p className="font-jakarta text-sm text-muted/60 italic bg-surface-1/20 p-3 rounded-lg border border-dashed border-border/30 text-center select-none">
                Sin descripción adicional brindada.
              </p>
            )}
          </div>

          {/* Street View Image Container o Fotos de reporte */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-outfit text-xs font-extrabold text-muted tracking-wider uppercase">
              {validPhotos.length > 0 ? 'Evidencia fotográfica' : 'Ubicación visual aproximada'}
            </h3>
            {validPhotos.length > 0 ? (
              <IncidentPhotos urls={validPhotos} />
            ) : (
              <StreetViewImage lat={report.lat} lng={report.lng} key={`${report.lat}-${report.lng}`} />
            )}
          </div>

          {/* Metadatos y Coordenadas en Pie */}
          <div className="mt-2 pt-3 border-t border-border flex items-center justify-end text-[10px] text-muted/70 font-jakarta font-medium select-none shrink-0">
            <span className="font-mono flex items-center gap-1">
              <MapPin size={11} className="shrink-0" />
              <span>{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</span>
            </span>
          </div>

        </div>

      </div>
    </>
  );
}
