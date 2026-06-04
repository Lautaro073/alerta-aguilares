import { AGUILARES_BOUNDS } from '@/lib/constants/map';

/**
 * Valida si un punto geográfico (lat, lng) se encuentra dentro de la Bounding Box de Aguilares, Tucumán.
 */
export function isWithinAguilares(lat: number, lng: number): boolean {
  const { south, north, west, east } = AGUILARES_BOUNDS.bbox;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}
