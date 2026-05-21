'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Shield, Flame } from 'lucide-react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';
import { useMapFilter } from '@/hooks/useMapFilter';
import { useRealtimeReports } from '@/hooks/useRealtimeReports';

// Componentes del mapa e interfaces
import MapControls from './MapControls';
import ReportMarkers from './ReportMarkers';
import HeatmapLayer from './HeatmapLayer';
import ReportDetailDrawer from '../report/ReportDetailDrawer';
import ReportDrawer from '../report/ReportDrawer';
import FAB from '../layout/FAB';
import { Report } from '@/types/report';

// Límites geográficos locales para restringir la cámara
const cornerSouthWest = L.latLng(AGUILARES_BOUNDS.bbox.south, AGUILARES_BOUNDS.bbox.west);
const cornerNorthEast = L.latLng(AGUILARES_BOUNDS.bbox.north, AGUILARES_BOUNDS.bbox.east);
const bounds = L.latLngBounds(cornerSouthWest, cornerNorthEast);

/**
 * Subcomponente de escucha para rastrear las coordenadas del centro del mapa reactivamente.
 * Cuando el usuario mueve la cámara, guardamos la ubicación para que el pin nuevo se dibuje allí.
 */
function MapListener({
  onCenterChange,
}: {
  onCenterChange: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
  });

  return null;
}

export default function MapViewInner() {
  // 1. Integración de Hooks de Estado y SWR
  const {
    selectedCategories,
    selectedView,
    selectedTimeframe,
    toggleCategory,
    clearCategories,
    isCategorySelected,
    setView,
    setTimeframe,
  } = useMapFilter();

  const { reports, isLoading, isConnected } = useRealtimeReports({
    categories: selectedCategories,
    view: selectedView,
    timeframe: selectedTimeframe,
    bounds: null,     // Consulta global estática para toda la ciudad (cero reconexiones y 60 FPS estables)
  });

  // 2. Estados locales para interactividad
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState<boolean>(false);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>(
    AGUILARES_BOUNDS.center
  );

  // Escuchar el cambio de cámara del mapa
  const handleCenterChange = useCallback((lat: number, lng: number) => {
    setCurrentCenter({ lat, lng });
  }, []);

  return (
    <div className="w-full h-full relative" style={{ height: '100dvh' }}>

      {/* Controles del mapa superior (Banda flotante con filters y view selectors) */}
      <MapControls
        selectedCategories={selectedCategories}
        selectedView={selectedView}
        toggleCategory={toggleCategory}
        clearCategories={clearCategories}
        setView={setView}
        isCategorySelected={isCategorySelected}
        selectedTimeframe={selectedTimeframe}
        setTimeframe={setTimeframe}
      />

      {/* Contenedor Principal de Leaflet */}
      <MapContainer
        center={AGUILARES_BOUNDS.center}
        zoom={AGUILARES_BOUNDS.defaultZoom}
        minZoom={AGUILARES_BOUNDS.minZoom}
        maxZoom={AGUILARES_BOUNDS.maxZoom}
        maxBounds={bounds}
        maxBoundsViscosity={1.0} // Restricción de arrastre elástico
        zoomControl={false}      // Posicionaremos controles premium en el futuro o se mantiene táctil directo
        className="w-full h-full z-0"
      >
        {/* Capa de mapa base en modo oscuro premium (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={AGUILARES_BOUNDS.maxZoom}
          maxNativeZoom={20}
        />

        {/* Escuchador de posición de cámara */}
        <MapListener
          onCenterChange={handleCenterChange}
        />

        {/* RENDERIZADO CONDICIONAL DE CAPAS SEGÚN MODO */}
        {selectedView === 'markers' ? (
          <ReportMarkers
            reports={reports as Report[]}
            onSelectReport={setSelectedReport}
          />
        ) : (
          <HeatmapLayer
            points={reports as { lat: number; lng: number }[]}
          />
        )}
      </MapContainer>

      {/* Botón flotante para reportar incidencia */}
      <FAB
        onClick={() => setIsReportDrawerOpen(true)}
      />

      {/* Cajón de Detalle del Reporte (Bottom Sheet en móvil, Tarjeta flotante en escritorio) */}
      <ReportDetailDrawer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Cajón de Formulario Creación (Bottom Sheet de 3 pasos) */}
      <ReportDrawer
        key={isReportDrawerOpen ? 'open' : 'closed'}
        isOpen={isReportDrawerOpen}
        onClose={() => setIsReportDrawerOpen(false)}
        mapCenter={currentCenter}
        onReportCreated={() => setIsReportDrawerOpen(false)}
      />

      {/* Contenedor de Estado y Leyendas (Esquina inferior izquierda) */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3 pointer-events-none">

        {/* Leyenda del Mapa de Calor (Temperatura) */}
        {selectedView === 'heatmap' && (
          <div className="glass px-4 py-3.5 max-w-[280px] sm:max-w-xs shadow-lg animate-slide-up flex flex-col gap-2.5 select-none border border-white/10 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                <Flame size={14} className="animate-pulse" />
              </div>
              <span className="font-outfit text-xs font-extrabold tracking-wide uppercase text-foreground">
                Zonas más activas
              </span>
            </div>

            <p className="font-jakarta text-[10.5px] text-muted leading-relaxed">
              Muestra las partes de la ciudad con más alertas en este momento. Los sectores más rojos concentran mayor cantidad de reportes.
            </p>

            {/* Barra de Temperatura de Color */}
            <div className="flex flex-col gap-1.5 mt-1.5">
              <div
                className="h-2.5 w-full rounded-full shadow-inner"
                style={{
                  background: 'linear-gradient(to right, #3b82f6 0%, #10b981 35%, #f59e0b 70%, #ef4444 100%)'
                }}
              />
              <div className="flex items-center justify-between text-[9.5px] font-jakarta font-bold text-muted/90">
                <span>Pocas alertas</span>
                <span>Muchas alertas</span>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de estado de conexión en tiempo real */}
        <div className="pointer-events-none self-start">
          {isLoading ? (
            <div className="glass px-3 py-1.5 flex items-center gap-2 select-none shadow animate-fade-in pointer-events-auto">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 border-t-accent animate-spin" />
              <span className="font-jakarta text-[10px] text-muted font-bold tracking-wide uppercase">
                Conectando...
              </span>
            </div>
          ) : isConnected ? (
            <div className="glass px-3 py-1.5 flex items-center gap-2 select-none shadow animate-fade-in pointer-events-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-jakarta text-[10px] text-emerald-400 font-bold tracking-wide uppercase">
                En vivo
              </span>
            </div>
          ) : (
            <div className="glass px-3 py-1.5 flex items-center gap-2 select-none shadow animate-fade-in pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="font-jakarta text-[10px] text-yellow-400 font-bold tracking-wide uppercase">
                Reconectando...
              </span>
            </div>
          )}
        </div>

        {/* Enlace a Políticas de Privacidad */}
        <div className="pointer-events-auto self-start">
          <Link
            href="/privacidad"
            className="glass px-3 py-1.5 flex items-center gap-1.5 select-none shadow hover:bg-white/5 hover:border-white/20 transition-all font-jakarta text-[9.5px] text-muted hover:text-foreground font-bold uppercase tracking-wider cursor-pointer"
          >
            <Shield size={11} className="text-accent shrink-0 animate-pulse-slow" />
            <span>Privacidad</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
