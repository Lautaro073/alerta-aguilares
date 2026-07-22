import { NextRequest, NextResponse } from 'next/server';
import { badRequest, serverError } from '@/lib/server/response';
import { env } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return badRequest('No se proporcionó ningún texto de búsqueda.');
    }

    const apiKey = env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!apiKey) {
      return serverError('GET_GEOCODE_ROUTE', new Error('La variable de entorno GOOGLE_MAPS_SERVER_API_KEY no está configurada.'));
    }

    const cleanQuery = `${query}, Aguilares, Tucumán, Argentina`;
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&components=country:AR&key=${apiKey}`;

    const res = await fetch(googleUrl);
    const data = await res.json();

    if (data.status === 'ZERO_RESULTS') {
      return Response.json({
        success: false,
        error: 'No se encontró esa dirección en Aguilares. Intentá con otro nombre de calle.'
      }, { status: 404 });
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return badRequest(`Error de geocodificación de Google: ${data.status || 'Respuesta vacía'}`);
    }

    const matchedResult = data.results[0];

    const lat = matchedResult.geometry.location.lat;
    const lng = matchedResult.geometry.location.lng;
    const formattedAddress = matchedResult.formatted_address;
    const types = matchedResult.types || [];
    
    // Identificar si es una altura exacta (ej: street_address, premise)
    const isExactAddress = types.includes('street_address') || types.includes('premise') || types.includes('subpremise');

    return NextResponse.json({
      success: true,
      data: {
        lat,
        lng,
        formattedAddress,
        isExactAddress
      }
    });

  } catch (error) {
    return serverError('GET_GEOCODE_ROUTE', error);
  }
}
