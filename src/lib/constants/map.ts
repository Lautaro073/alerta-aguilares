/**
 * Centro y encuadre inicial del mapa de Aguilares, Tucuman.
 * El bbox sirve para presentar la ciudad, no como geocerca de validacion.
 */
export const AGUILARES_BOUNDS = {
  center: { lat: -27.4333, lng: -65.6167 } as const,
  bbox: {
    south: -27.47,
    north: -27.4,
    west: -65.65,
    east: -65.58,
  } as const,
  defaultZoom: 14,
  minZoom: 13,
  maxZoom: 18,
};
