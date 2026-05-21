import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { GetReportsQuerySchema } from '@/lib/validators/report.schema';
import { Report } from '@/types/report';
import { encodeGeohash, getGeohashRangesForBounds } from '@/lib/utils/geoUtils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/stream
 *
 * Endpoint de Server-Sent Events (SSE) que escucha Firestore en tiempo real
 * con onSnapshot y empuja los reportes al cliente al instante, sin polling.
 * El cliente se reconecta automáticamente si se cae la conexión.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParams = searchParams.getAll('category');
  const viewParam = searchParams.get('view');
  const timeframeParam = searchParams.get('timeframe');

  const parsedQuery = GetReportsQuerySchema.safeParse({
    category: categoryParams.length > 0 ? categoryParams : undefined,
    view: viewParam || undefined,
    timeframe: timeframeParam || undefined,
    south: searchParams.get('south') || undefined,
    north: searchParams.get('north') || undefined,
    west: searchParams.get('west') || undefined,
    east: searchParams.get('east') || undefined,
  });

  const success = parsedQuery.success;
  const view = success ? parsedQuery.data.view : 'markers';
  const categories = success ? parsedQuery.data.category : undefined;
  const timeframe = success ? parsedQuery.data.timeframe : 'all';
  const south = success ? parsedQuery.data.south : undefined;
  const north = success ? parsedQuery.data.north : undefined;
  const west = success ? parsedQuery.data.west : undefined;
  const east = success ? parsedQuery.data.east : undefined;
  
  const maxLimit = view === 'heatmap' ? 1000 : 500;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // El controlador puede estar cerrado si el cliente se desconectó
        }
      };

      const hasBounds = south !== undefined && north !== undefined && west !== undefined && east !== undefined;

      // Agrupador de documentos para streams de rango múltiple
      const activeRangeDocs = new Map<number, Map<string, any>>();
      const unsubscribers: Array<() => void> = [];

      const emitAggregatedResults = () => {
        const docMap = new Map<string, any>();
        activeRangeDocs.forEach((rangeMap) => {
          rangeMap.forEach((data, id) => {
            docMap.set(id, data);
          });
        });

        // Filtrar y mapear por Bounding Box exacto si existen límites
        let filteredList: Array<{ id: string; data: any }> = [];
        docMap.forEach((data, id) => {
          const latVal = data.lat as number;
          const lngVal = data.lng as number;
          if (hasBounds) {
            if (latVal >= south! && latVal <= north! && lngVal >= west! && lngVal <= east!) {
              filteredList.push({ id, data });
            }
          } else {
            filteredList.push({ id, data });
          }
        });

        // Ordenar desc por createdAt
        filteredList.sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));

        // Limitar
        const limitedList = filteredList.slice(0, maxLimit);

        // Mapear según la vista (heatmap vs markers)
        const mappedData = limitedList.map((item) => {
          if (view === 'heatmap') {
            return { lat: item.data.lat as number, lng: item.data.lng as number };
          }
          return {
            id: item.id,
            cityId: item.data.cityId || 'aguilares-tucuman',
            lat: item.data.lat,
            lng: item.data.lng,
            geohash: item.data.geohash || encodeGeohash(item.data.lat, item.data.lng),
            category: item.data.category,
            title: item.data.title,
            description: item.data.description || null,
            images: item.data.images || [],
            status: item.data.status || 'ACTIVE',
            createdAt: item.data.createdAt,
            updatedAt: item.data.updatedAt,
            resolvedAt: item.data.resolvedAt || null,
            verifiedCount: item.data.verifiedCount || 0,
            confirmedBy: item.data.confirmedBy || [],
          } as Report;
        });

        send('reports', { count: mappedData.length, data: mappedData });
      };

      if (hasBounds && south !== undefined && north !== undefined && west !== undefined && east !== undefined) {
        const ranges = getGeohashRangesForBounds(south, north, west, east);
        const resolvedRanges = new Set<number>();

        ranges.forEach(([startRange, endRange], index) => {
          activeRangeDocs.set(index, new Map<string, any>());

          let q: FirebaseFirestore.Query = adminDb.collection('reports');
          if (categories && categories.length > 0) {
            q = q.where('category', 'in', categories);
          }
          q = q.where('status', '==', 'ACTIVE');
          if (timeframe && timeframe !== 'all') {
            const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
            const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
            q = q.where('createdAt', '>=', thresholdDate);
          }

          q = q.orderBy('geohash').startAt(startRange).endAt(endRange);

          const unsubscribe = q.onSnapshot(
            (snapshot) => {
              const rangeMap = activeRangeDocs.get(index) || new Map<string, any>();
              rangeMap.clear();
              snapshot.docs.forEach((doc) => {
                rangeMap.set(doc.id, doc.data());
              });
              activeRangeDocs.set(index, rangeMap);

              resolvedRanges.add(index);

              // Solo emitimos al cliente si ya cargaron los datos iniciales de todos los rangos paralelos
              if (resolvedRanges.size === ranges.length) {
                emitAggregatedResults();
              }
            },
            (error) => {
              console.error(`[SSE] Error en listener de rango ${index}:`, error.message);
              send('error', { message: 'Error de sincronización en rango. Reintentando...' });
            }
          );

          unsubscribers.push(unsubscribe);
        });
      } else {
        // Búsqueda general sin límites
        let query: FirebaseFirestore.Query = adminDb.collection('reports');

        if (categories && categories.length > 0) {
          query = query.where('category', 'in', categories);
        }

        query = query.where('status', '==', 'ACTIVE');

        if (timeframe && timeframe !== 'all') {
          const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
          const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
          query = query.where('createdAt', '>=', thresholdDate);
        }

        query = query.orderBy('createdAt', 'desc').limit(maxLimit);

        const unsubscribe = query.onSnapshot(
          (snapshot) => {
            const reports = snapshot.docs.map((doc) => {
              const data = doc.data();
              if (view === 'heatmap') {
                return { lat: data.lat as number, lng: data.lng as number };
              }
              return {
                id: doc.id,
                cityId: data.cityId || 'aguilares-tucuman',
                lat: data.lat,
                lng: data.lng,
                geohash: data.geohash || encodeGeohash(data.lat, data.lng),
                category: data.category,
                title: data.title,
                description: data.description || null,
                images: data.images || [],
                status: data.status || 'ACTIVE',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                resolvedAt: data.resolvedAt || null,
                verifiedCount: data.verifiedCount || 0,
                confirmedBy: data.confirmedBy || [],
              } as Report;
            });

            send('reports', { count: reports.length, data: reports });
          },
          (error) => {
            console.error('[SSE] Error de Firestore:', error.message);
            send('error', { message: 'Error de sincronización. Reintentando...' });
          }
        );

        unsubscribers.push(unsubscribe);
      }

      // Heartbeat cada 25 segundos para mantener la conexión viva a través de proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Cleanup cuando el cliente se desconecta (cierra pestaña, navega, etc.)
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribers.forEach((unsub) => unsub());
        try {
          controller.close();
        } catch {}
      });
    },

    cancel() {
      // ReadableStream cancelado por el runtime
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Deshabilita buffering en Nginx/proxies
    },
  });
}
