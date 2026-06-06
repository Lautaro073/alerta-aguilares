import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { GetReportsQuerySchema, CreateReportSchema } from '@/lib/validators/report.schema';
import { badRequest, tooManyRequests, serverError, forbidden } from '@/lib/server/response';
import { hashValue } from '@/lib/server/hash';
import { env } from '@/lib/server/env';
import { verifyAppCheckToken } from '@/lib/server/appCheck';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { getPublicReportCacheHeaders, getReportById, listPublicReports } from '@/features/reports/server/reportQueries';
import { triggerReportPushNotifications } from '@/features/reports/server/reportNotifications';
import { resolveLocationLabel } from '@/features/reports/server/locationLabel';
import { supabaseAdmin } from '@/lib/supabase/server';

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
 * Obtiene los reportes geolocalizados de Supabase.
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
      south: searchParams.get('south') || undefined,
      north: searchParams.get('north') || undefined,
      west: searchParams.get('west') || undefined,
      east: searchParams.get('east') || undefined,
    });

    if (!parsedQuery.success) {
      return badRequest('Parámetros de consulta inválidos.', parsedQuery.error.format());
    }

    const { category, view, limit, timeframe, south, north, west, east } = parsedQuery.data;

    const data = await listPublicReports({ category, view, limit, timeframe, south, north, west, east });

    return Response.json(
      {
        success: true,
        count: data.length,
        data,
      },
      { status: 200, headers: getPublicReportCacheHeaders() }
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
    const locationLabel = await resolveLocationLabel(lat, lng);

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
          
          const { data: userRow, error: userError } = await supabaseAdmin
            .from('users')
            .select('display_name')
            .eq('uid', uid)
            .maybeSingle();

          if (userError) {
            throw userError;
          }

          userId = uid;
          userDisplayName = userRow?.display_name || decodedToken.name || decodedToken.email?.split('@')[0] || 'Vecino Registrado';
        } catch (err) {
          console.warn('[POST /api/reports] Token enviado pero inválido o expirado:', err);
        }
      }
    }

    // 4. Rate Limiting Dual (Fingerprint + IP)
    const ip = getClientIp(request);
    const ipHash = hashValue(ip);
    const fpHash = hashValue(fingerprintVisitorId);

    const { data: rpcRows, error: rpcError } = await supabaseAdmin.rpc('create_report_with_rate_limit', {
      p_city_id: DEFAULT_CITY_ID,
      p_lat: lat,
      p_lng: lng,
      p_category: category,
      p_title: title,
      p_description: description || null,
      p_images: images || [],
      p_location_label: locationLabel,
      p_user_id: userId || null,
      p_user_display_name: userDisplayName || null,
      p_ip_hash: ipHash,
      p_fingerprint_hash: fpHash,
      p_user_agent: request.headers.get('user-agent') || 'unknown',
      p_origin: origin || request.headers.get('referer') || null,
      p_max_reports_fp: env.MAX_REPORTS_PER_DAY_FP,
      p_max_reports_ip: env.MAX_REPORTS_PER_DAY_IP,
      p_window_hours: env.RATE_LIMIT_WINDOW_HOURS,
    });

    if (rpcError) {
      throw rpcError;
    }

    const rateLimitResult = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    if (!rateLimitResult?.allowed) {
      const resetAt = rateLimitResult?.reset_at
        ? new Date(rateLimitResult.reset_at)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
      return tooManyRequests(
        'Has alcanzado el limite de reportes diarios permitidos. Por favor, intenta de nuevo manana.',
        resetAt
      );
    }

    const reportId = rateLimitResult.report_id as string;
    const newReport = await getReportById(reportId);
    if (!newReport) {
      throw new Error('REPORT_CREATED_BUT_NOT_FOUND');
    }

    // Trigger push notifications asynchronously (non-blocking)
    triggerReportPushNotifications(newReport).catch((err) => {
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
