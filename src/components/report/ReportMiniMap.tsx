'use client';

import { useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';
import { isWithinAguilares } from '@/lib/utils/geoUtils';
import { renderToString } from 'react-dom/server';
import { MapPin, AlertCircle, CheckCircle2, Search, Loader2 } from 'lucide-react';

// Configurar los límites geográficos locales para restringir la cámara
const southwestCorner = L.latLng(AGUILARES_BOUNDS.bbox.south, AGUILARES_BOUNDS.bbox.west);
const northeastCorner = L.latLng(AGUILARES_BOUNDS.bbox.north, AGUILARES_BOUNDS.bbox.east);
const geobounds = L.latLngBounds(southwestCorner, northeastCorner);

// Renderizar el icono de selección de Lucide a HTML de SVG
const pinHtml = renderToString(
  <MapPin size={22} color="#ffffff" className="shrink-0" />
);

// Icono personalizado para el pin seleccionador móvil
const selectionIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-12 h-12" style="pointer-events: none;">
      <!-- Pulso expansivo concéntrico -->
      <div class="absolute w-8 h-8 rounded-full bg-accent/25 animate-ping" style="animation-duration: 2s;"></div>
      
      <!-- Cuerpo principal del pin (Globo flotante) -->
      <div class="absolute w-10 h-10 rounded-full bg-accent border-2 border-white flex items-center justify-center shadow-xl animate-bounce"
           style="box-shadow: 0 0 16px rgba(79, 124, 255, 0.6), 0 6px 14px rgba(0,0,0,0.4); animation-duration: 1s;">
        <div class="flex items-center justify-center text-white" style="margin-top:-1px;">
          ${pinHtml}
        </div>
      </div>
      
      <!-- Sombra flotante proyectada en el mapa -->
      <div class="absolute bottom-1 w-3 h-1 bg-black/40 rounded-full blur-[1px]"></div>
    </div>
  `,
  className: 'custom-selection-pin',
  iconSize: [48, 48],
  iconAnchor: [24, 44],
});

/**
 * Escucha los clics sobre el mapa para reposicionar el marcador inmediatamente.
 */
function MapClickEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Componente auxiliar que mueve el centro del mapa cuando cambian las coordenadas
 * (por ejemplo, tras una búsqueda de dirección exitosa).
 */
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 17, { duration: 1.2 });
  return null;
}

interface ReportMiniMapProps {
  lat: number;
  lng: number;
  onChangeLocation: (lat: number, lng: number) => void;
}

/**
 * MiniMapa interactivo de selección exacta de ubicación.
 *
 * Permite al vecino buscar su dirección por nombre de calle (Nominatim),
 * o bien reposicionar el pin haciendo click/drag en cualquier punto del mapa.
 */
export default function ReportMiniMap({ lat, lng, onChangeLocation }: ReportMiniMapProps) {
  const markerRef = useRef<L.Marker>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Estado del buscador de calles
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [shouldRecenter, setShouldRecenter] = useState(false);

  // Buscar una dirección usando nuestra API Route segura (Google Maps Geocoding)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchSuccess(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        setSearchError(result.error || 'No se encontró esa dirección en Aguilares. Intentá con otro nombre de calle.');
        return;
      }

      const { lat: targetLat, lng: targetLng, formattedAddress, isExactAddress } = result.data;

      onChangeLocation(targetLat, targetLng);
      setShouldRecenter(true);
      setTimeout(() => setShouldRecenter(false), 200);

      // Mensaje sumamente amigable e instructivo para el ciudadano común
      const cleanAddressName = formattedAddress.split(',')[0] || query;
      if (isExactAddress) {
        setSearchSuccess(`¡Excelente! Ubicación exacta encontrada: ${cleanAddressName}`);
      } else {
        setSearchSuccess(`Ubicamos el pin en: ${cleanAddressName} (podés moverlo en el mapa si preferís ajustar el lugar exacto)`);
      }
    } catch {
      setSearchError('Error al conectar con el servidor de búsqueda. Intentá mover el pin directamente.');
    } finally {
      setIsSearching(false);
    }
  };

  // Validar y reportar ubicación (clic o drag del pin)
  const handleLocationUpdate = (newLat: number, newLng: number) => {
    if (searchError) setSearchError(null);
    if (searchSuccess) setSearchSuccess(null);
    if (isWithinAguilares(newLat, newLng)) {
      setGeoError(null);
      onChangeLocation(newLat, newLng);
    } else {
      setGeoError('Límites geográficos excedidos: Por favor ubique el reporte dentro de Aguilares.');
      setTimeout(() => setGeoError(null), 3000);
    }
  };

  // Manejador del arrastre del pin (dragend)
  const dragEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          handleLocationUpdate(newLatLng.lat, newLatLng.lng);
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lat, lng]
  );

  return (
    <div className="flex flex-col gap-2 w-full select-none shrink-0">

      {/* Encabezado informativo */}
      <div className="flex flex-col select-none">
        <h3 className="font-outfit font-extrabold text-sm text-foreground tracking-wide">
          ¿Dónde está ocurriendo? *
        </h3>
        <p className="font-jakarta text-[11px] text-muted leading-tight mt-0.5">
          Buscá la calle o mové el pin en el mapa para marcar el lugar exacto.
        </p>
      </div>

      {/* Buscador de calles */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchError) setSearchError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Ej: Mitre 400, Belgrano..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-surface-1 border border-border text-foreground text-xs font-jakarta placeholder:text-muted/60 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="h-9 px-3 rounded-lg bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
          title="Buscar dirección"
        >
          {isSearching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
        </button>
      </form>

      {/* Error de búsqueda de dirección */}
      {searchError && (
        <p className="font-jakarta text-[10.5px] text-amber-400 flex items-center gap-1.5 animate-slide-down">
          <AlertCircle size={11} className="shrink-0" />
          <span>{searchError}</span>
        </p>
      )}

      {/* Éxito de búsqueda de dirección (Amigable para el ciudadano) */}
      {searchSuccess && (
        <p className="font-jakarta text-[10.5px] text-emerald-400 flex items-center gap-1.5 animate-slide-down">
          <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
          <span>{searchSuccess}</span>
        </p>
      )}

      {/* Contenedor del Mapa */}
      <div className="relative w-full h-[180px] bg-surface-1 rounded-lg overflow-hidden border border-border/80 shadow-md">
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          minZoom={14}
          maxZoom={18}
          maxBounds={geobounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          {/* Capa base de CartoDB Dark Matter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Recentrar el mapa cuando el usuario busca una dirección */}
          {shouldRecenter && <MapRecenter lat={lat} lng={lng} />}

          {/* Marcador de Selección Móvil */}
          <Marker
            draggable={true}
            eventHandlers={dragEvents}
            position={[lat, lng]}
            icon={selectionIcon}
            ref={markerRef}
          />

          {/* Escuchador de clics del mapa */}
          <MapClickEvents onClick={handleLocationUpdate} />
        </MapContainer>

        {/* Indicador de coordenadas en esquina inferior derecha */}
        <div className="absolute bottom-2 right-2 glass px-2 py-0.5 font-mono text-[9px] text-foreground/80 pointer-events-none select-none z-[400]">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      </div>

      {/* Banner de error geográfico */}
      {geoError && (
        <div className="bg-rose-500/10 border border-rose-500/25 p-2 rounded text-center animate-slide-down shrink-0 flex items-center justify-center gap-1.5">
          <span className="font-jakarta text-[10.5px] font-bold text-rose-400 flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0" />
            <span>{geoError}</span>
          </span>
        </div>
      )}

    </div>
  );
}
