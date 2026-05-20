import { NextRequest } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase/admin';
import { GetReportsQuerySchema, CreateReportSchema } from '@/lib/validators/report.schema';
import { badRequest, tooManyRequests, serverError, forbidden } from '@/lib/server/response';
import { Report, ReportPrivateMeta } from '@/types/report';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import { hashValue } from '@/lib/server/hash';
import { env } from '@/lib/server/env';
import { CATEGORIES } from '@/lib/constants/categories';

export const dynamic = 'force-dynamic';

/**
 * Obtiene la dirección IP del cliente desde los headers HTTP.
 */
function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    if (ips[0]) return ips[0].trim();
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();
  
  return '127.0.0.1';
}

/**
 * GET /api/reports
 * 
 * Obtiene los reportes geolocalizados de la base de datos de Firestore.
 * Soporta filtrado por múltiples categorías y dos vistas de visualización:
 * - markers (vista detallada, límite 500)
 * - heatmap (vista simplificada de calor {lat, lng}, límite 1000)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Obtener los parámetros de query y formatear 'category'
    const categoryParams = searchParams.getAll('category');
    const viewParam = searchParams.get('view');
    const limitParam = searchParams.get('limit');

    // Validar parámetros con Zod
    const parsedQuery = GetReportsQuerySchema.safeParse({
      category: categoryParams.length > 0 ? categoryParams : undefined,
      view: viewParam || undefined,
      limit: limitParam || undefined,
      timeframe: searchParams.get('timeframe') || undefined,
    });

    if (!parsedQuery.success) {
      return badRequest('Parámetros de consulta inválidos.', parsedQuery.error.format());
    }

    const { category, view, limit, timeframe } = parsedQuery.data;

    // Determinar límites máximos por vista
    const maxAllowedLimit = view === 'heatmap' ? 1000 : 500;
    const finalLimit = limit ? Math.min(limit, maxAllowedLimit) : maxAllowedLimit;

    // Construir consulta a Firestore
    let query: FirebaseFirestore.Query = adminDb.collection('reports');

    // Filtrar por categorías si se especifican
    if (category && category.length > 0) {
      query = query.where('category', 'in', category);
    }

    // Por defecto filtramos por reportes activos
    query = query.where('status', '==', 'ACTIVE');

    // Filtrar por rango de tiempo (timeframe) si no es 'all'
    if (timeframe && timeframe !== 'all') {
      const days = timeframe === '7d' ? 7 : 30;
      const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.where('createdAt', '>=', thresholdDate);
    }

    // Ordenar por fecha de creación descendente (los más recientes primero)
    query = query.orderBy('createdAt', 'desc');

    // Aplicar límite
    query = query.limit(finalLimit);

    // Ejecutar consulta
    const snapshot = await query.get();
    
    // Configurar cabeceras de caché: 10 segundos cacheada pública, stale-while-revalidate de 30 segundos
    const headers = {
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      'CDN-Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
    };

    if (view === 'heatmap') {
      // Retornar solo las coordenadas en la vista de mapa de calor
      const heatmapData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          lat: data.lat as number,
          lng: data.lng as number,
        };
      });

      return Response.json(
        {
          success: true,
          count: heatmapData.length,
          data: heatmapData,
        },
        { status: 200, headers }
      );
    }

    // Vista predeterminada: 'markers' (retorna la información detallada del reporte)
    const reports: Report[] = snapshot.docs.map((doc) => {
      const data = doc.data();
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

    return Response.json(
      {
        success: true,
        count: reports.length,
        data: reports,
      },
      { status: 200, headers }
    );

  } catch (error) {
    return serverError('GET_REPORTS_ROUTE', error);
  }
}

/**
 * POST /api/reports
 * 
 * Crea un nuevo reporte de incidencia geolocalizado en la base de datos.
 * Aplica verificación de origen, validaciones de integridad geográfica
 * y control de rate limiting dual mediante hashes SHA-256 anonimizados.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificación de Origen (CSRF y CORS Básico)
    const origin = request.headers.get('origin');
    
    if (env.NODE_ENV === 'production') {
      if (!origin || origin !== env.ALLOWED_ORIGIN) {
        return forbidden('Acceso denegado: Origen de solicitud no autorizado.');
      }
    }

    // 2. Parsear el cuerpo de la solicitud
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest('Cuerpo de la solicitud inválido. Se espera formato JSON.');
    }

    // 3. Validar con Zod (Geografía, tipos, campos obligatorios)
    const parsedBody = CreateReportSchema.safeParse(body);
    if (!parsedBody.success) {
      return badRequest('Validación de campos fallida.', parsedBody.error.format());
    }

    const { lat, lng, category, title, description, images, fingerprintVisitorId } = parsedBody.success ? parsedBody.data : body;

    // 4. Rate Limiting Dual (Fingerprint + IP)
    const ip = getClientIp(request);
    const ipHash = hashValue(ip);
    const fpHash = hashValue(fingerprintVisitorId);

    const rateLimitResult = await checkRateLimit({ fpHash, ipHash });

    if (!rateLimitResult.allowed) {
      const resetAt = rateLimitResult.resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
      return tooManyRequests(
        'Has alcanzado el límite de reportes diarios permitidos. Por favor, intenta de nuevo mañana.',
        resetAt
      );
    }

    // 5. Preparar la creación de documentos
    const reportRef = adminDb.collection('reports').doc();
    const reportId = reportRef.id;
    const nowISO = new Date().toISOString();

    // Documento público
    const newReport: Report = {
      id: reportId,
      cityId: 'aguilares-tucuman',
      lat,
      lng,
      category,
      title,
      description: description || null,
      images: images || [],
      status: 'ACTIVE',
      createdAt: nowISO,
      updatedAt: nowISO,
      resolvedAt: null,
      verifiedCount: 0,
      confirmedBy: [],
    };

    // Documento de metadatos privados
    const privateMeta: ReportPrivateMeta = {
      reportId,
      ipHash,
      fingerprintHash: fpHash,
      userAgent: request.headers.get('user-agent') || 'unknown',
      origin: origin || request.headers.get('referer') || null,
      createdAt: nowISO,
    };

    // 6. Transacción atómica batch para guardar en Firestore
    const batch = adminDb.batch();
    batch.set(reportRef, newReport);
    batch.set(adminDb.collection('report_private_meta').doc(reportId), privateMeta);
    
    await batch.commit();

    // Trigger push notifications asynchronously (non-blocking)
    triggerPushNotifications(newReport).catch((err) => {
      console.error('[FCM] Failed to trigger notifications asynchronously:', err);
    });

    // 7. Retornar éxito
    return Response.json(
      {
        success: true,
        message: 'Reporte creado de forma exitosa.',
        data: newReport,
      },
      { status: 201 }
    );

  } catch (error) {
    return serverError('POST_REPORTS_ROUTE', error);
  }
}

/**
 * Envía notificaciones push a todos los dispositivos suscritos de forma asíncrona.
 * Limpia los tokens que hayan expirado o no estén registrados.
 */
async function triggerPushNotifications(report: Report) {
  try {
    const tokensSnapshot = await adminDb.collection('fcm_tokens').get();
    if (tokensSnapshot.empty) {
      return;
    }

    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token): token is string => typeof token === 'string' && token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const categoryLabel = CATEGORIES[report.category as keyof typeof CATEGORIES]?.label || report.category;
    const title = `🚨 Nueva Alerta: ${categoryLabel}`;
    const body = report.title;
    const url = `/?reportId=${report.id}`;

    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        title,
        body,
        url,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192-maskable.png',
          tag: 'nuevo-reporte',
          data: {
            url,
          },
        },
      },
    });

    // Detectar tokens fallidos para eliminarlos
    const tokensToDelete: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const code = resp.error.code;
        const t = tokens[idx];
        if (
          t &&
          (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-argument')
        ) {
          tokensToDelete.push(t);
        }
      }
    });

    if (tokensToDelete.length > 0) {
      const cleanupBatch = adminDb.batch();
      tokensToDelete.forEach((token) => {
        cleanupBatch.delete(adminDb.collection('fcm_tokens').doc(token));
      });
      await cleanupBatch.commit();
      console.log(`[FCM] Se eliminaron ${tokensToDelete.length} tokens inválidos.`);
    }

    console.log(`[FCM] Éxito: ${response.successCount}, Fallos: ${response.failureCount}`);
  } catch (error) {
    console.error('[FCM] Error en triggerPushNotifications:', error);
  }
}
