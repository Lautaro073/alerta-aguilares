'use client';

import { X, TrafficCone } from 'lucide-react';
import { TrafficLightPoint } from '@/lib/constants/trafficLights';

interface TrafficLightDetailDrawerProps {
  point: TrafficLightPoint | null;
  hasProblem: boolean;
  devMode?: boolean;
  onClose: () => void;
  onReportProblem: (point: TrafficLightPoint) => void;
  onMoveToCenter?: (point: TrafficLightPoint) => void;
  onDelete?: (point: TrafficLightPoint) => void;
}

export default function TrafficLightDetailDrawer({
  point,
  hasProblem,
  devMode = false,
  onClose,
  onReportProblem,
  onMoveToCenter,
  onDelete,
}: TrafficLightDetailDrawerProps) {
  if (!point) return null;

  const color = hasProblem ? '#DC2626' : '#16A34A';

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[1100] bg-background/50 backdrop-blur-[1.5px] transition-opacity duration-300 md:hidden pointer-events-auto"
      />
      <div className="fixed bottom-0 left-0 right-0 z-[1200] bg-surface-2 rounded-t-xl border-t border-border shadow-lg flex flex-col p-5 animate-slide-up pointer-events-auto md:bottom-4 md:right-4 md:left-auto md:w-96 md:rounded-lg md:border md:shadow-glow">
        <div className="w-12 h-1 bg-border-strong rounded-full mx-auto mb-4 shrink-0 md:hidden" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <span
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-pill font-outfit text-xs font-bold select-none border"
            style={{ backgroundColor: `${color}15`, color, borderColor: `${color}40` }}
          >
            <TrafficCone size={14} />
            Semaforo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border text-muted hover:text-foreground hover:bg-surface-3 transition-colors shrink-0"
            aria-label="Cerrar detalle"
          >
            <X size={16} />
          </button>
        </div>

        <h2 className="font-outfit font-extrabold text-lg text-foreground tracking-tight leading-snug mb-2">
          Semaforo en {point.label}
        </h2>
        <p className="font-jakarta text-sm text-muted leading-relaxed mb-5">
          {hasProblem
            ? 'Este semaforo tiene un problema reportado.'
            : 'Este semaforo esta activo. Si detectas una falla, cargala como alerta.'}
        </p>

        <button
          type="button"
          onClick={() => onReportProblem(point)}
          className="btn btn-primary w-full h-11 font-outfit"
        >
          Reportar problema
        </button>

        {devMode && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => onMoveToCenter?.(point)}
              className="btn btn-ghost h-10 text-xs font-outfit"
            >
              Mover al centro
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(point)}
              className="btn btn-ghost h-10 text-xs font-outfit text-rose-300 hover:text-rose-200"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
