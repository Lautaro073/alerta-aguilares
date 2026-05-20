'use client';

import L from 'leaflet';
import 'leaflet.heat';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface HeatmapPoint {
  lat: number;
  lng: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
}

/**
 * Componente cliente secundario que renderiza una capa de mapa de calor dinámico sobre Leaflet.
 * 
 * Utiliza la librería nativa 'leaflet.heat' accediendo a la instancia del mapa mediante 'useMap'.
 * Aplica un gradiente premium de alta visibilidad que combina perfectamente con el Sleek Dark Mode.
 */
export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Formatear las coordenadas con una intensidad base constante de 0.35 por punto (frío/azul-cyan por defecto)
    const heatPoints = points.map((p) => [p.lat, p.lng, 0.35]);

    // Crear la capa de calor dinámica utilizando el constructor del plugin
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 25,          // Radio de dispersión de cada punto (en píxeles)
      blur: 15,            // Desenfoque sutil para suavizar las intersecciones
      maxZoom: 1,          // Fijar en 1 para que la intensidad no cambie con el zoom del mapa
      max: 1.0,            // Intensidad máxima para el color más caliente (rojo)
      gradient: {          // Paleta de gradientes moderna optimizada para Dark Theme
        0.2: 'rgba(59, 130, 246, 0.5)',  // Inundación / Azul translúcido
        0.5: 'rgba(6, 182, 212, 0.75)', // Agua / Cloaca / Cyan
        0.8: 'rgba(245, 158, 11, 0.9)',  // Alumbrado / Naranja
        1.0: 'rgba(239, 68, 68, 1)',     // Bache / Peligro / Rojo sólido
      },
    });

    // Añadir la capa al mapa
    heatLayer.addTo(map);

    // Limpieza de recursos al desmontar el componente o al cambiar los puntos
    return () => {
      if (map) {
        try {
          map.removeLayer(heatLayer);
        } catch (error) {
          // Capturar errores silenciosos en desmontados rápidos de Leaflet
          console.debug('⚠️ [HEATMAP] Error al remover capa:', error);
        }
      }
    };
  }, [map, points]);

  return null; // Componente lógico, no renderiza elementos DOM directos
}
