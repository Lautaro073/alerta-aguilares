import { NextRequest } from 'next/server';
import { GetReportsQuerySchema, CreateReportSchema } from '@/lib/validators/report.schema';
import { badRequest, tooManyRequests, serverError, forbidden } from '@/lib/server/response';
import { hashValue } from '@/lib/server/hash';
import { env } from '@/lib/server/env';
import { verifyAppCheckToken } from '@/lib/server/appCheck';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { DEFAULT_DISPLAY_NAME } from '@/lib/constants/user';
import { getPublicReportCacheHeaders, getReportById, listPublicReports } from '@/features/reports/server/reportQueries';
import { triggerReportPushNotifications } from '@/features/reports/server/reportNotifications';
import { resolveLocationLabel } from '@/features/reports/server/locationLabel';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createReportEvent } from '@/lib/server/reportEvents';
import { EMPLOYEE_ROLE_VALUES } from '@/features/admin/shared/employeeOptions';
import type { CategoryId } from '@/lib/constants/categories';
import type { ReportPriority } from '@/types/report';

export const dynamic = 'force-dynamic';

const CATEGORY_PRIORITY = new Map<CategoryId, ReportPriority>([
  ['ACCIDENTE', 'high'],
  ['SEMAFORO', 'high'],
  ['ALUMBRADO', 'high'],
  ['BACHE', 'medium'],
  ['SENALIZACION', 'medium'],
  ['VEHICULO_ABANDONADO', 'medium'],
  ['SEGURIDAD_URBANA', 'high'],
  ['RESIDUOS', 'low'],
  ['AGUA_CLOACAS', 'high'],
  ['ANEGAMIENTO', 'high'],
  ['ARBOLADO_PUBLICO', 'high'],
  ['CABLES_POSTES', 'high'],
  ['ESPACIOS_PUBLICOS', 'medium'],
  ['VEREDAS_ACCESIBILIDAD', 'medium'],
]);

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
 * Requiere una sesión de Supabase y aplica control de rate limiting dual
 * mediante hashes SHA-256 anonimizados.
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

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'Inicia sesión para crear una alerta.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return Response.json(
        { success: false, error: 'La sesión es inválida o expiró.' },
        { status: 401 }
      );
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

    const { lat, lng, category, title, description, images, fingerprintVisitorId, priority } = parsedBody.data;
    const userId = authData.user.id;
    const metadata = authData.user.user_metadata || {};
    const [locationLabel, userResult, categoryResult] = await Promise.all([
      resolveLocationLabel(lat, lng),
      supabaseAdmin
        .from('users')
        .select('display_name, role, employee_status, citizen_status')
        .eq('uid', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('incident_categories')
        .select('priority')
        .eq('id', category)
        .eq('city_id', DEFAULT_CITY_ID)
        .maybeSingle(),
    ]);

    const { data: userRow, error: userError } = userResult;

    if (userError) throw userError;
    if (categoryResult.error) throw categoryResult.error;

    if (userRow?.role === 'user' && userRow.citizen_status === 'blocked') {
      return forbidden('Tu cuenta esta bloqueada y no puede crear alertas.');
    }

    const configuredPriority = categoryResult.data?.priority;
    const automaticPriority: ReportPriority = configuredPriority === 'high' || configuredPriority === 'medium' || configuredPriority === 'low'
      ? configuredPriority
      : CATEGORY_PRIORITY.get(category) || 'low';
    const isEmployee = EMPLOYEE_ROLE_VALUES.some((role) => role === userRow?.role)
      && userRow?.employee_status !== 'disabled';
    const reportPriority = isEmployee && priority ? priority : automaticPriority;

    const metadataName = [metadata.display_name, metadata.full_name, metadata.name]
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    // Nunca derivar el nombre público del correo: se publica en el mapa y
    // expondría parte de la dirección de quien reporta.
    const userDisplayName = userRow?.display_name
      || metadataName
      || DEFAULT_DISPLAY_NAME;

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
      p_user_id: userId,
      p_user_display_name: userDisplayName,
      p_ip_hash: ipHash,
      p_fingerprint_hash: fpHash,
      p_user_agent: request.headers.get('user-agent') || 'unknown',
      p_origin: origin || request.headers.get('referer') || null,
      p_max_reports_fp: env.MAX_REPORTS_PER_DAY_FP,
      p_max_reports_ip: env.MAX_REPORTS_PER_DAY_IP,
      p_window_hours: env.RATE_LIMIT_WINDOW_HOURS,
      p_priority: reportPriority,
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
        'Has alcanzado el limite de reportes diarios permitidos. Por favor, intenta de nuevo mañana.',
        resetAt
      );
    }

    const reportId = rateLimitResult.report_id as string;
    const newReport = await getReportById(reportId);
    if (!newReport) {
      throw new Error('REPORT_CREATED_BUT_NOT_FOUND');
    }

    await createReportEvent({
      reportId,
      actorUid: userId,
      eventType: 'created',
      metadata: { source: 'authenticated' },
    }).catch((err) => {
      console.error('[POST /api/reports] No se pudo registrar evento de creacion:', err);
    });

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
