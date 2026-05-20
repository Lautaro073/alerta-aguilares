'use client';

import { Shield } from 'lucide-react';

interface TopBarProps {
  activeIncidentCount?: number;
}

/**
 * Barra superior de navegación / Branding (TopBar).
 * 
 * Muestra el nombre de la plataforma "CiudadAlerta", el escudo o icono de seguridad
 * con animación sutil, la localidad actual, y un badge opcional indicando el estado del sistema.
 */
export default function TopBar({ activeIncidentCount }: TopBarProps) {
  return (
    <header className="w-full shrink-0 select-none bg-surface-1 border-b border-border/80 h-14 flex items-center justify-between px-4 z-[1000] shadow-sm">
      {/* Branding */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <Shield size={16} className="animate-pulse-slow shrink-0" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-outfit font-extrabold text-sm md:text-base tracking-tight leading-none text-foreground flex items-center gap-1">
            Alertas<span className="gradient-text">Aguilares</span>
          </h1>
          <span className="font-jakarta font-semibold text-[9px] text-muted tracking-wider uppercase leading-none mt-0.5">
            Participación Ciudadana
          </span>
        </div>
      </div>

      {/* Info de Incidencias o Estado del Servidor */}
      <div className="flex items-center gap-3">
        {typeof activeIncidentCount === 'number' && (
          <div className="hidden sm:flex items-center gap-1.5 bg-surface-2 border border-border px-2.5 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="font-jakarta text-[10px] font-bold text-slate-300 tracking-tight">
              {activeIncidentCount} {activeIncidentCount === 1 ? 'Alerta Activa' : 'Alertas Activas'}
            </span>
          </div>
        )}

        {/* Indicador de conexión / Online */}
        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="font-jakarta text-[8.5px] font-bold text-emerald-400 uppercase tracking-wider">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}
