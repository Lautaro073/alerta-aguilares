'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Componente contenedor del mapa de CiudadAlerta.
 * Implementa importación dinámica con `ssr: false` para mitigar el error de renderizado en servidor de Leaflet
 * y despliega una pantalla de carga premium con estética oscura acorde a nuestra guía visual.
 */
const MapViewInner = dynamic(
  () => import('./MapViewInner'),
  {
    ssr: false,
    loading: () => (
      <div 
        className="w-full h-full flex flex-col items-center justify-center bg-[#0a0f1d] text-slate-400 gap-4" 
        style={{ height: '100dvh' }}
      >
        {/* Spinner premium de carga */}
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-[#3b82f6] animate-spin"></div>
        <p className="font-semibold tracking-wide animate-pulse text-sm text-slate-300">
          Cargando mapa de Aguilares...
        </p>
      </div>
    ),
  }
);

export default function MapView() {
  return <MapViewInner />;
}
