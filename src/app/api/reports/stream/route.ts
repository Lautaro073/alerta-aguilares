import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { GetReportsQuerySchema } from '@/lib/validators/report.schema';
import { Report } from '@/types/report';

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

  const parsedQuery = GetReportsQuerySchema.safeParse({
    category: categoryParams.length > 0 ? categoryParams : undefined,
    view: viewParam || undefined,
  });

  const view = parsedQuery.success ? parsedQuery.data.view : 'markers';
  const categories = parsedQuery.success ? parsedQuery.data.category : undefined;
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

      // Construir la query de Firestore (mismos índices que el GET normal)
      let query: FirebaseFirestore.Query = adminDb.collection('reports');

      if (categories && categories.length > 0) {
        query = query.where('category', 'in', categories);
      }

      query = query
        .where('status', '==', 'ACTIVE')
        .orderBy('createdAt', 'desc')
        .limit(maxLimit);

      // Listener de tiempo real — se dispara en cada cambio de Firestore
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
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },

    cancel() {
      // También se llama si el ReadableStream es cancelado por el runtime
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
