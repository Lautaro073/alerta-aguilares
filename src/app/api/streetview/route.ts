import { NextRequest } from 'next/server';
import { z } from 'zod';
import { badRequest, serverError } from '@/lib/server/response';
import { env } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

const StreetViewQuerySchema = z.object({
  lat: z.coerce.number({ message: 'La latitud debe ser un número válido.' }),
  lng: z.coerce.number({ message: 'La longitud debe ser un número válido.' }),
  heading: z.coerce.number().min(0).max(360).default(0),
});

/**
 * Retorna un SVG premium formateado como imagen para servir de fallback visual.
 */
function getFallbackSvg(lat: number, lng: number, message = 'Vista de calle no disponible'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f1629" />
        <stop offset="100%" stop-color="#080d1a" />
      </linearGradient>
      <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4f7cff" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
    </defs>
    
    <!-- Fondo -->
    <rect width="100%" height="100%" fill="url(#bg-grad)"/>
    
    <!-- Rejilla decorativa futurista -->
    <path d="M 0,50 L 600,50 M 0,100 L 600,100 M 0,150 L 600,150 M 0,200 L 600,200 M 0,250 L 600,250 M 0,300 L 600,300 M 0,350 L 600,350" stroke="rgba(255,255,255,0.02)" stroke-width="1" />
    <path d="M 100,0 L 100,400 M 200,0 L 200,400 M 300,0 L 300,400 M 400,0 L 400,400 M 500,0 L 500,400" stroke="rgba(255,255,255,0.02)" stroke-width="1" />
    
    <!-- Círculo del radar -->
    <circle cx="300" cy="160" r="65" fill="none" stroke="rgba(79, 124, 255, 0.1)" stroke-width="2" />
    <circle cx="300" cy="160" r="50" fill="none" stroke="url(#icon-grad)" stroke-width="2.5" stroke-dasharray="8,6" />
    
    <!-- Icono de Cámara / Ubicación -->
    <g transform="translate(282, 142) scale(1.15)" fill="none" stroke="#f0f4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </g>
    
    <!-- Textos -->
    <text x="50%" y="270" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', system-ui, sans-serif" font-size="18" font-weight="700" fill="#f0f4ff" letter-spacing="-0.02em">
      ${message}
    </text>
    <text x="50%" y="305" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="500" fill="#8b95b4">
      Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}
    </text>
    <text x="50%" y="330" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="400" fill="rgba(79, 124, 255, 0.6)">
      CiudadAlerta Aguilares
    </text>
  </svg>`;
}

/**
 * GET /api/streetview
 * 
 * Proxy de seguridad para Google Maps Street View Static API.
 * Evita la exposición de la API Key en el cliente y ahorra costos mediante caché inteligente.
 */
export async function GET(request: NextRequest) {
  let queryLat = 0;
  let queryLng = 0;
  
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = StreetViewQuerySchema.safeParse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      heading: searchParams.get('heading'),
    });

    if (!parsedQuery.success) {
      return badRequest('Coordenadas de latitud y longitud requeridas.', parsedQuery.error.format());
    }

    const { lat, lng, heading } = parsedQuery.data;
    queryLat = lat;
    queryLng = lng;

    const apiKey = env.GOOGLE_MAPS_API_KEY;

    // Si la clave de Google Maps no está configurada, servimos el fallback SVG premium de inmediato
    if (!apiKey) {
      const fallbackSvg = getFallbackSvg(lat, lng, 'Vista de calle no configurada');
      return new Response(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }

    // Consultar la API de Google Maps Street View Static
    // Tamaño estándar óptimo para el popup/drawer: 600x400
    const googleStreetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&heading=${heading}&fov=90&key=${apiKey}`;

    const response = await fetch(googleStreetViewUrl, {
      method: 'GET',
      next: { revalidate: 604800 }, // Cachear por 7 días en Next.js fetch cache si es aplicable
    });

    if (!response.ok) {
      console.warn(`⚠️ [STREETVIEW PROXY] Error al consultar API de Google. Status: ${response.status}`);
      // Fallback si la API de Google falla (cuotas superadas, credenciales inválidas, etc.)
      const fallbackSvg = getFallbackSvg(lat, lng, 'Servicio temporalmente no disponible');
      return new Response(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600', // Cache corto de 1 hora en fallos
        },
      });
    }

    const contentType = response.headers.get('content-type');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cabeceras de caché ultra eficientes para ahorrar costos: cachear por 7 días
    const headers = {
      'Content-Type': contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    };

    return new Response(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('🔴 [STREETVIEW_PROXIER_ERROR]:', error);
    
    // Fallback absoluto con SVG para no romper la interfaz visual
    const fallbackSvg = getFallbackSvg(queryLat, queryLng, 'Error al cargar imagen');
    return new Response(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }
}
