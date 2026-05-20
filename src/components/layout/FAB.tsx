'use client';

import { ShieldAlert } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  reportCount?: number | undefined;
}

/**
 * Floating Action Button (FAB) premium.
 * 
 * Invoca el Drawer/Bottom Sheet de creación de reportes.
 * Características:
 * - Adapta su tamaño dinámicamente de escritorio (con texto) a móvil (circular para optimizar espacio).
 * - Efecto de pulsación concéntrica y sombra de brillo neon (`glow-accent`).
 * - Micro-animaciones al hacer hover y click.
 */
export default function FAB({ onClick, reportCount }: FABProps) {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[1050] select-none pointer-events-none animate-slide-up">
      {/* Botón interactivo principal */}
      <button
        onClick={onClick}
        className="pointer-events-auto btn btn-primary flex items-center justify-center gap-2.5 h-14 rounded-full px-5 shadow-lg shadow-accent/40 border border-white/10 group transition-all duration-300 hover:scale-105 active:scale-95 glow-accent"
        title="Crear Nueva Alerta Ciudadana"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
        }}
      >
        {/* Icono de Alerta con rotación animada en hover */}
        <ShieldAlert size={18} className="shrink-0 group-hover:rotate-12 transition-transform duration-300 text-white" />

        {/* Texto del FAB (oculto en móviles extremadamente angostos, visible en el resto) */}
        <span className="font-outfit text-xs md:text-sm font-extrabold tracking-wide uppercase text-white drop-shadow-sm select-none">
          Marcar Problema
        </span>

        {/* Contador de reportes activos opcional (burbuja flotante si existe) */}
        {typeof reportCount === 'number' && reportCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-extrabold font-outfit text-white border-2 border-surface-2 shadow animate-scale-in">
            {reportCount}
          </span>
        )}

        {/* Halo de pulsación expansivo */}
        <span className="absolute inset-0 rounded-full bg-accent/25 -z-10 animate-ping" style={{ animationDuration: '2.5s' }} />
      </button>
    </div>
  );
}
