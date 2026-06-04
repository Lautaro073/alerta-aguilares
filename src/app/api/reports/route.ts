import { NextRequest } from 'next/server';
import { adminDb, adminMessaging, adminAuth } from '@/lib/firebase/admin';
import { GetReportsQuerySchema, CreateReportSchema } from '@/lib/validators/report.schema';
import { badRequest, tooManyRequests, serverError, forbidden } from '@/lib/server/response';
import { Report, ReportPrivateMeta } from '@/types/report';
import { applyRateLimitInTransaction } from '@/lib/utils/rateLimit';
import { hashValue } from '@/lib/server/hash';
import { env } from '@/lib/server/env';
import { CATEGORIES } from '@/lib/constants/categories';
import { verifyAppCheckToken } from '@/lib/server/appCheck';
import { encodeGeohash, getGeohashRangesForBounds } from '@/lib/utils/geoUtils';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { touchPublicReportsFeed } from '@/lib/server/publicFeed';

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

let migrationTriggered = false;

/**
 * Realiza una migración asíncrona en segundo plano para calcular y guardar
 * el campo `geohash` en todos los reportes existentes que carezcan de él.
 */
async function runBackgroundMigration() {
  if (migrationTriggered) return;
  migrationTriggered = true;

  try {
    const snapshot = await adminDb.collection('reports').get();
    const unmigrated = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.geohash && data.lat !== undefined && data.lng !== undefined;
    });

    if (unmigrated.length === 0) {
      return;
    }

    console.log(`[Migration] Detectados ${unmigrated.length} reportes antiguos sin geohash. Iniciando migración...`);

    // Procesar en lotes de 500 (límite máximo de escrituras por batch en Firestore)
    const chunks = [];
    for (let i = 0; i < unmigrated.length; i += 500) {
      chunks.push(unmigrated.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = adminDb.batch();
      chunk.forEach((doc) => {
        const data = doc.data();
        const computedGeohash = encodeGeohash(data.lat, data.lng);
        batch.update(doc.ref, { geohash: computedGeohash });
      });
      await batch.commit();
    }
    console.log(`[Migration] Migración de geohashes finalizada exitosamente para ${unmigrated.length} reportes.`);
  } catch (error) {
    console.error('[Migration] Error durante la migración retroactiva de geohashes:', error);
  }
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
  // Disparar migración retroactiva en segundo plano de manera no bloqueante
  runBackgroundMigration().catch((err) => {
    console.error('[Migration] Error no controlado en la migración:', err);
  });

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
      south: searchParams.get('south') || undefined,
      north: searchParams.get('north') || undefined,
      west: searchParams.get('west') || undefined,
      east: searchParams.get('east') || undefined,
    });

    if (!parsedQuery.success) {
      return badRequest('Parámetros de consulta inválidos.', parsedQuery.error.format());
    }

    const { category, view, limit, timeframe, south, north, west, east } = parsedQuery.data;

    // Determinar límites máximos por vista
    const maxAllowedLimit = view === 'heatmap' ? 1000 : 500;
    const finalLimit = limit ? Math.min(limit, maxAllowedLimit) : maxAllowedLimit;

    let rawDocsSnapshot: Array<{ id: string; data: FirebaseFirestore.DocumentData }> = [];

    // Si vienen límites, ejecutar consultas basadas en Geohashes
    const hasBounds = south !== undefined && north !== undefined && west !== undefined && east !== undefined;

    if (hasBounds) {
      const ranges = getGeohashRangesForBounds(south, north, west, east);

      const promises = ranges.map(([start, end]) => {
        let q: FirebaseFirestore.Query = adminDb.collection('reports');
        if (category && category.length > 0) {
          q = q.where('category', 'in', category);
        }
        q = q.where('status', '==', 'ACTIVE');
        if (timeframe && timeframe !== 'all') {
          const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
          const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
          q = q.where('createdAt', '>=', thresholdDate);
        }
        return q.orderBy('geohash').startAt(start).endAt(end).get();
      });

      const snapshots = await Promise.all(promises);
      const docMap = new Map<string, FirebaseFirestore.DocumentData>();

      snapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          docMap.set(doc.id, doc.data());
        });
      });

      // Filtrar exactamente por bounding box y mapear
      docMap.forEach((data, id) => {
        const latVal = data.lat as number;
        const lngVal = data.lng as number;
        if (latVal >= south && latVal <= north && lngVal >= west && lngVal <= east) {
          rawDocsSnapshot.push({ id, data });
        }
      });

      // Ordenar por fecha descendente
      rawDocsSnapshot.sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
    } else {
      // Búsqueda general sin límites (ej: para consola o listados)
      let query: FirebaseFirestore.Query = adminDb.collection('reports');

      if (category && category.length > 0) {
        query = query.where('category', 'in', category);
      }

      query = query.where('status', '==', 'ACTIVE');

      if (timeframe && timeframe !== 'all') {
        const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
        const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        query = query.where('createdAt', '>=', thresholdDate);
      }

      query = query.orderBy('createdAt', 'desc').limit(finalLimit);

      const snapshot = await query.get();
      rawDocsSnapshot = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    }

    const finalRawDocs = rawDocsSnapshot.slice(0, finalLimit);

    // Configurar cabeceras de caché: 10 segundos cacheada pública, stale-while-revalidate de 30 segundos
    const headers = {
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      'CDN-Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
    };

    if (view === 'heatmap') {
      const heatmapData = finalRawDocs.map((item) => ({
        lat: item.data.lat as number,
        lng: item.data.lng as number,
      }));

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
    const reports: Report[] = finalRawDocs.map((item) => ({
      id: item.id,
      cityId: item.data.cityId || DEFAULT_CITY_ID,
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
    } as Report));

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
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    
    if (env.NODE_ENV === 'production') {
      const cleanOrigin = origin?.replace(/\/$/, '');
      const cleanAllowed = env.ALLOWED_ORIGIN?.replace(/\/$/, '');
      const selfOrigin = host ? `https://${host}`.replace(/\/$/, '') : null;
      const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`.replace(/\/$/, '') : null;

      const isAllowed = 
        (cleanOrigin && cleanOrigin === cleanAllowed) ||
        (cleanOrigin && cleanOrigin === selfOrigin) ||
        (cleanOrigin && cleanOrigin === vercelUrl);

      if (!isAllowed) {
        console.warn(`[CORS Blocked] Origin: ${origin}, Allowed: ${env.ALLOWED_ORIGIN}, Host: ${host}, Vercel: ${process.env.VERCEL_URL}`);
        return forbidden('Acceso denegado: Origen de solicitud no autorizado.');
      }
    }

    // 1b. Verificación de Firebase App Check (solo en producción)
    const appCheckValid = await verifyAppCheckToken(request);
    if (!appCheckValid) {
      return forbidden('Acceso denegado: Token de App Check inválido o ausente.');
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

    // 3b. Verificar si el usuario está autenticado y resolver su autoría de forma segura en el servidor
    let userId: string | undefined = undefined;
    let userDisplayName: string | undefined = undefined;

    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          const uid = decodedToken.uid;
          
          // Buscar perfil del usuario en Firestore para obtener el displayName más actualizado
          const userDoc = await adminDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userId = uid;
            userDisplayName = userData?.displayName || decodedToken.name || 'Vecino Registrado';
          } else {
            userId = uid;
            userDisplayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Vecino Registrado';
          }
        } catch (err) {
          console.warn('[POST /api/reports] Token enviado pero inválido o expirado:', err);
        }
      }
    }

    // 4. Rate Limiting Dual (Fingerprint + IP)
    const ip = getClientIp(request);
    const ipHash = hashValue(ip);
    const fpHash = hashValue(fingerprintVisitorId);

    // 5. Preparar la creación de documentos
    const reportRef = adminDb.collection('reports').doc();
    const reportId = reportRef.id;
    const nowISO = new Date().toISOString();

    // Autoría verificada (solo si se resolvió desde el servidor)
    const authorshipFields: Partial<Report> = userId && userDisplayName
      ? { userId, userDisplayName }
      : {};

    // Documento público
    const newReport: Report = {
      id: reportId,
      cityId: DEFAULT_CITY_ID,
      lat,
      lng,
      geohash: encodeGeohash(lat, lng),
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
      ...authorshipFields,
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

    // 6. Transacción atómica para aplicar rate limit y guardar en Firestore
    const rateLimitResult = await adminDb.runTransaction(async (transaction) => {
      const result = await applyRateLimitInTransaction(transaction, { fpHash, ipHash });
      if (!result.allowed) {
        return result;
      }

      transaction.set(reportRef, newReport);
      transaction.set(adminDb.collection('report_private_meta').doc(reportId), privateMeta);
      return result;
    });

    if (!rateLimitResult.allowed) {
      const resetAt = rateLimitResult.resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
      return tooManyRequests(
        'Has alcanzado el limite de reportes diarios permitidos. Por favor, intenta de nuevo manana.',
        resetAt
      );
    }

    await touchPublicReportsFeed({
      cityId: newReport.cityId,
      reportId,
      createdAt: nowISO,
    }).catch((err) => {
      console.error('[POST /api/reports] No se pudo actualizar el feed publico:', err);
    });

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
