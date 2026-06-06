import { env } from '@/lib/server/env';

type GoogleGeocodeResult = {
  formatted_address?: string;
  types?: string[];
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
};

type GoogleGeocodeResponse = {
  status?: string;
  results?: GoogleGeocodeResult[];
};

const PREFERRED_RESULT_TYPES = new Set([
  'street_address',
  'route',
  'intersection',
  'premise',
  'subpremise',
]);

function getAddressComponent(result: GoogleGeocodeResult, type: string) {
  return result.address_components?.find((component) => component.types.includes(type))?.long_name || null;
}

function buildStreetLabel(result: GoogleGeocodeResult) {
  const route = getAddressComponent(result, 'route');
  const streetNumber = getAddressComponent(result, 'street_number');

  if (route && streetNumber) {
    return `${route} ${streetNumber}`;
  }

  if (route) {
    return route;
  }

  return result.formatted_address?.split(',')[0]?.trim() || null;
}

function pickBestGeocodeResult(results: GoogleGeocodeResult[]) {
  return results.find((result) => result.types?.some((type) => PREFERRED_RESULT_TYPES.has(type))) || results[0] || null;
}

export async function resolveLocationLabel(lat: number, lng: number): Promise<string | null> {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('language', 'es');
  url.searchParams.set('region', 'ar');
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const result = await response.json() as GoogleGeocodeResponse;
    if (result.status !== 'OK' || !result.results?.length) return null;

    const bestResult = pickBestGeocodeResult(result.results);
    return bestResult ? buildStreetLabel(bestResult) : null;
  } catch (error) {
    console.warn('[LOCATION_LABEL] No se pudo resolver direccion del reporte:', error);
    return null;
  }
}
