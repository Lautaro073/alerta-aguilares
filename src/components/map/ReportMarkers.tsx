'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { CATEGORIES, CategoryId } from '@/lib/constants/categories';
import { Report } from '@/types/report';
import { renderToString } from 'react-dom/server';
import CategoryIcon from '@/components/ui/CategoryIcon';

interface ReportMarkersProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
}

/**
 * Genera un L.divIcon personalizado para Leaflet con una estética premium de alta fidelidad.
 * Utiliza renderToString de React para inyectar iconos vectoriales de Lucide
 * en lugar de emojis planos tradicionales.
 */
const createCategoryIcon = (category: CategoryId, color: string) => {
  const categoryConfig = CATEGORIES[category];
  const iconName = categoryConfig?.iconName || 'HelpCircle';
  
  // Renderizar el icono Lucide a String de SVG
  const iconHtml = renderToString(
    <CategoryIcon name={iconName} size={13} color="#080d1a" className="shrink-0" />
  );

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 select-none animate-scale-in" style="pointer-events: none;">
        <!-- Aura pulsante exterior (Efecto radar) -->
        <div class="absolute w-8 h-8 rounded-full opacity-35 animate-ping" 
             style="background-color: ${color}; animation-duration: 3s; pointer-events: none;"></div>
             
        <!-- Contenedor sólido del pin con bordes de luz premium -->
        <div class="absolute w-8 h-8 rounded-full border-2 border-white/90 flex items-center justify-center shadow-lg transition-transform duration-200"
             style="background-color: ${color}; box-shadow: 0 0 12px ${color}55, 0 4px 10px rgba(0,0,0,0.5); pointer-events: none;">
          <!-- Icono SVG en el centro (Color oscuro legible sobre el color brillante del pin) -->
          <div class="flex items-center justify-center w-4 h-4 text-[#080d1a]" style="margin-top: 0.5px;">
            ${iconHtml}
          </div>
        </div>
        
        <!-- Flecha del pin hacia abajo sutil -->
        <div class="absolute -bottom-[2px] w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"
             style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3)); pointer-events: none;"></div>
      </div>
    `,
    className: 'custom-report-marker', // Clase limpia sin estilos por defecto de Leaflet
    iconSize: [40, 40],
    iconAnchor: [20, 36], // Centrar horizontalmente, alinear la base del marcador en el punto geográfico
  });
};

/**
 * Crea un icono de cluster personalizado de alta fidelidad con auras y gradientes
 * que coinciden con el tema visual Sleek Dark Theme de la app.
 */
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  
  let color = '#4f7cff'; // Azul brillante por defecto (pocos incidentes)
  let shadow = 'rgba(79, 124, 255, 0.4)';
  
  if (count >= 5 && count < 15) {
    color = '#f59e0b'; // Naranja (moderado)
    shadow = 'rgba(245, 158, 11, 0.4)';
  } else if (count >= 15) {
    color = '#ef4444'; // Rojo (elevado)
    shadow = 'rgba(239, 68, 68, 0.4)';
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 select-none animate-scale-in" style="pointer-events: none;">
        <!-- Aura pulsante concéntrica exterior (Efecto radar) -->
        <div class="absolute w-8 h-8 rounded-full opacity-20 animate-ping" 
             style="background-color: ${color}; animation-duration: 2.5s; pointer-events: none;"></div>
             
        <!-- Círculo central sólido oscuro con borde brillante de color de alerta -->
        <div class="absolute w-8 h-8 rounded-full border-2 flex items-center justify-center font-outfit font-extrabold text-xs text-white transition-all duration-200"
             style="background-color: #0c1220; border-color: ${color}; box-shadow: 0 0 14px ${shadow}, 0 4px 8px rgba(0,0,0,0.6); pointer-events: none;">
          ${count}
        </div>
      </div>
    `,
    className: 'custom-cluster-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

/**
 * Componente cliente que renderiza los reportes sobre el mapa de Leaflet.
 * Agrupa marcadores geográficos cercanos usando react-leaflet-cluster para
 * mejorar el rendimiento y legibilidad.
 */
export default function ReportMarkers({ reports, onSelectReport }: ReportMarkersProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={50} // Radio de agrupación óptimo
      showCoverageOnHover={false} // Evitar polígonos feos en hover de clusters
      spiderfyOnMaxZoom={true} // Separar marcadores que coinciden en coordenadas al máximo zoom
      disableClusteringAtZoom={17} // Deshabilita la agrupación a nivel de calle (zoom máximo) para ver los marcadores directos
      iconCreateFunction={createClusterIcon} // Icono personalizado premium para clusters
    >
      {reports.map((report, idx) => {
        const categoryConfig = CATEGORIES[report.category];
        const markerColor = categoryConfig?.color || '#9CA3AF';
        const customIcon = createCategoryIcon(report.category, markerColor);

        return (
          <Marker
            key={`report-marker-${report.id || 'no-id'}-${idx}`}
            position={[report.lat, report.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                onSelectReport(report);
              },
            }}
          />
        );
      })}
    </MarkerClusterGroup>
  );
}
