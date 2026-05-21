'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES } from '@/lib/constants/categories';
import { Report } from '@/types/report';
import StreetViewImage from './StreetViewImage';
import IncidentPhotos from './IncidentPhotos';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import { X, Clock, MapPin, Users, Check, Loader2, Heart, BadgeCheck, UserCircle } from 'lucide-react';

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
  const { user } = useAuth();
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sincronizar el reporte local cuando cambie la prop
  useEffect(() => {
    setCurrentReport(report);
  }, [report]);

  if (!report || !currentReport) return null;

  // Filtrar solo las fotos válidas (excluyendo vectores/SVGs u otros formatos no fotográficos)
  const validPhotos = (currentReport.images || []).filter((url) => {
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

  const categoryConfig = CATEGORIES[currentReport.category];
  const categoryColor = categoryConfig?.color || '#9CA3AF';
  const categoryName = categoryConfig?.name || 'Reporte ciudadano';

  const hasConfirmed = user && currentReport.confirmedBy?.includes(user.uid);

  const handleConfirmToggle = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isConfirming) return;

    try {
      setIsConfirming(true);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/reports/${currentReport.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al confirmar el reporte.');
      }

      const result = await response.json();
      
      // Actualización optimista del estado local
      setCurrentReport((prev) => {
        if (!prev) return null;
        let newConfirmedBy = [...(prev.confirmedBy || [])];
        
        if (result.confirmed) {
          if (!newConfirmedBy.includes(user.uid)) {
            newConfirmedBy.push(user.uid);
          }
        } else {
          newConfirmedBy = newConfirmedBy.filter((uid) => uid !== user.uid);
        }

        return {
          ...prev,
          verifiedCount: result.verifiedCount,
          confirmedBy: newConfirmedBy,
        };
      });

    } catch (error) {
      console.error('Error al confirmar reporte:', error);
    } finally {
      setIsConfirming(false);
    }
  };

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
          {currentReport.title}
        </h2>

        {/* Fecha en Plus Jakarta Sans */}
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted mb-2 font-jakarta font-medium select-none">
          <Clock size={12} className="text-muted shrink-0" />
          <span>Reportado el {formatReportDate(currentReport.createdAt)}</span>
        </div>

        {/* Autoría del reporte */}
        <div className="flex items-center gap-1.5 mb-4 select-none">
          {currentReport.userDisplayName ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-emerald-400/90">
              <BadgeCheck size={13} className="shrink-0" />
              <span>Reportado por <strong>{currentReport.userDisplayName}</strong> · Vecino Registrado</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-jakarta text-muted/70">
              <UserCircle size={13} className="shrink-0" />
              <span>Reporte Anónimo</span>
            </span>
          )}
        </div>

        {/* Sección deslizable del cuerpo */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar flex flex-col gap-4">
          
          {/* Apoyo Vecinal / Confirmación (Fase 2) */}
          <div className="bg-surface-1/40 border border-border/30 rounded-lg p-3 flex items-center justify-between gap-3 select-none">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider font-jakarta">Validación Vecinal</span>
              <span className="font-outfit font-extrabold text-[12.5px] text-foreground flex items-center gap-1.5">
                <Users size={13} className="text-accent shrink-0" />
                {currentReport.verifiedCount === 0 ? (
                  'Sin confirmaciones'
                ) : currentReport.verifiedCount === 1 ? (
                  '1 vecino validó esto'
                ) : (
                  `${currentReport.verifiedCount} vecinos validaron esto`
                )}
              </span>
            </div>

            <button
              onClick={handleConfirmToggle}
              disabled={isConfirming}
              className={`btn h-8 px-3.5 rounded-pill font-outfit text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                hasConfirmed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow shadow-emerald-500/5 hover:bg-emerald-500/25'
                  : 'bg-accent/10 border-accent/30 hover:bg-accent/20 text-accent hover:shadow-glow hover:shadow-accent/5'
              }`}
            >
              {isConfirming ? (
                <Loader2 size={12} className="animate-spin" />
              ) : hasConfirmed ? (
                <>
                  <Check size={12} className="shrink-0" />
                  <span>Validado</span>
                </>
              ) : (
                <>
                  <Heart size={12} className="shrink-0" />
                  <span>¿Lo ves?</span>
                </>
              )}
            </button>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-outfit text-xs font-extrabold text-muted tracking-wider uppercase">
              Descripción del incidente
            </h3>
            {currentReport.description ? (
              <p className="font-jakarta text-sm text-foreground/80 bg-surface-1/40 p-3 rounded-lg border border-border/30 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {currentReport.description}
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
              <StreetViewImage lat={currentReport.lat} lng={currentReport.lng} key={`${currentReport.lat}-${currentReport.lng}`} />
            )}
          </div>

          {/* Metadatos y Coordenadas en Pie */}
          <div className="mt-2 pt-3 border-t border-border flex items-center justify-end text-[10px] text-muted/70 font-jakarta font-medium select-none shrink-0">
            <span className="font-mono flex items-center gap-1">
              <MapPin size={11} className="shrink-0" />
              <span>{currentReport.lat.toFixed(6)}, {currentReport.lng.toFixed(6)}</span>
            </span>
          </div>

        </div>

      </div>

      {/* Modal de Autenticación Dinámico */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
