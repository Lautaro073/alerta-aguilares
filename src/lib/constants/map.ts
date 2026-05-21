/**
 * Límites geográficos y configuraciones por defecto del mapa para la ciudad de Aguilares, Tucumán, Argentina.
 */
export const AGUILARES_BOUNDS = {
  center: { lat: -27.4333, lng: -65.6167 } as const,
  bbox: {
    south: -27.470,
    north: -27.400,
    west: -65.650,
    east: -65.580,
  } as const,
  defaultZoom: 14,
  minZoom: 13,
  maxZoom: 18,
};
