import { AGUILARES_BOUNDS } from '@/lib/constants/map';

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const BITS = [16, 8, 4, 2, 1];

/**
 * Valida si un punto geográfico (lat, lng) se encuentra dentro de la Bounding Box de Aguilares, Tucumán.
 */
export function isWithinAguilares(lat: number, lng: number): boolean {
  const { south, north, west, east } = AGUILARES_BOUNDS.bbox;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

/**
 * Codifica una coordenada de latitud y longitud en un Geohash.
 * La precisión por defecto es 9 (~4.8m x 4.8m), ideal para ubicar reportes individuales.
 */
export function encodeGeohash(lat: number, lng: number, precision = 9): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let geohash = '';
  let bit = 0;
  let ch = 0;
  let isEven = true;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= BITS[bit] ?? 0;
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= BITS[bit] ?? 0;
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Calcula los rangos de Geohash [start, end] necesarios para cubrir una ventana visual (Bounding Box).
 * Retorna un máximo de 9 rangos para no sobrecargar las consultas en paralelo de Firestore.
 */
export function getGeohashRangesForBounds(
  south: number,
  north: number,
  west: number,
  east: number
): Array<[string, string]> {
  const latDiff = north - south;
  const lngDiff = east - west;
  const maxDiff = Math.max(latDiff, lngDiff);

  // Determinar precisión del prefijo de geohash según el tamaño del viewport
  let precision = 5;
  if (maxDiff > 0.1) {
    precision = 4; // ~39km x 19km
  } else if (maxDiff > 0.02) {
    precision = 5; // ~4.9km x 4.9km (tamaño ideal para la ciudad de Aguilares)
  } else {
    precision = 6; // ~1.2km x 0.6km (zoomed-in)
  }

  // Dimensiones aproximadas en grados para cada precisión
  const cellSizes: Record<number, { lat: number; lng: number }> = {
    4: { lat: 0.175, lng: 0.35 },
    5: { lat: 0.044, lng: 0.088 },
    6: { lat: 0.011, lng: 0.011 },
  };

  const size = cellSizes[precision] ?? { lat: 0.044, lng: 0.088 };
  const geohashesSet = new Set<string>();

  // Iterar sobre los cuadrantes con pasos de media celda para no omitir esquinas o intersecciones
  const latStep = size.lat / 2;
  const lngStep = size.lng / 2;

  for (let lat = south; lat <= north + latStep; lat += latStep) {
    const safeLat = Math.min(Math.max(lat, -90), 90);
    for (let lng = west; lng <= east + lngStep; lng += lngStep) {
      const safeLng = lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng;
      const hash = encodeGeohash(safeLat, safeLng, precision);
      geohashesSet.add(hash);
    }
  }

  // Si salen más de 9 geohashes y la precisión es alta, bajar la precisión un nivel para unir celdas
  if (geohashesSet.size > 9 && precision > 4) {
    const nextLowerPrecision = precision === 6 ? 5 : 4;
    return getGeohashRangesForBoundsWithPrecision(south, north, west, east, nextLowerPrecision);
  }

  return Array.from(geohashesSet).map((hash) => [hash, hash + '\uf8ff']);
}

/**
 * Función auxiliar recursiva para recalcular rangos con una precisión forzada si la inicial genera demasiadas consultas.
 */
function getGeohashRangesForBoundsWithPrecision(
  south: number,
  north: number,
  west: number,
  east: number,
  precision: number
): Array<[string, string]> {
  const cellSizes: Record<number, { lat: number; lng: number }> = {
    4: { lat: 0.175, lng: 0.35 },
    5: { lat: 0.044, lng: 0.088 },
  };

  const size = cellSizes[precision] ?? { lat: 0.175, lng: 0.35 };
  const geohashesSet = new Set<string>();

  const latStep = size.lat / 2;
  const lngStep = size.lng / 2;

  for (let lat = south; lat <= north + latStep; lat += latStep) {
    const safeLat = Math.min(Math.max(lat, -90), 90);
    for (let lng = west; lng <= east + lngStep; lng += lngStep) {
      const safeLng = lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng;
      const hash = encodeGeohash(safeLat, safeLng, precision);
      geohashesSet.add(hash);
    }
  }

  return Array.from(geohashesSet).map((hash) => [hash, hash + '\uf8ff']);
}
