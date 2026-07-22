import { NextRequest } from 'next/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { createReportEvent } from '@/lib/server/reportEvents';
import { touchPublicReportsFeed } from '@/lib/server/publicFeed';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const OPEN_REPORT_STATUSES = ['ACTIVE', 'PENDING', 'VERIFYING', 'IN_PROGRESS'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ success: false, error: 'No autorizado.' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    if (authError || !authData.user) {
      return Response.json({ success: false, error: 'Sesion invalida o expirada.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as { resolved?: unknown } | null;
    if (typeof body?.resolved !== 'boolean') {
      return Response.json({ success: false, error: 'Respuesta invalida.' }, { status: 400 });
    }

    const { id: reportId } = await params;
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, city_id, user_id, status')
      .eq('id', reportId)
      .eq('city_id', DEFAULT_CITY_ID)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report) {
      return Response.json({ success: false, error: 'La alerta no existe.' }, { status: 404 });
    }
    if (report.user_id !== authData.user.id) {
      return Response.json({ success: false, error: 'Solo el creador puede responder sobre esta alerta.' }, { status: 403 });
    }
    if (!OPEN_REPORT_STATUSES.includes(report.status)) {
      return Response.json({ success: false, error: 'La alerta ya no esta abierta.' }, { status: 409 });
    }

    const nextStatus = body.resolved ? 'RESOLVED' : report.status;
    if (body.resolved) {
      const now = new Date().toISOString();
      const { data: updatedReport, error: updateError } = await supabaseAdmin
        .from('reports')
        .update({ status: nextStatus, resolved_at: now, updated_at: now })
        .eq('id', reportId)
        .eq('city_id', DEFAULT_CITY_ID)
        .in('status', OPEN_REPORT_STATUSES)
        .select('id')
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updatedReport) {
        return Response.json({ success: false, error: 'La alerta ya no está abierta.' }, { status: 409 });
      }
    }

    await createReportEvent({
      reportId,
      actorUid: authData.user.id,
      eventType: 'owner_feedback',
      cityId: report.city_id,
      metadata: { resolved: body.resolved, from: report.status, to: nextStatus },
    });

    if (body.resolved) {
      await touchPublicReportsFeed({ cityId: report.city_id, reportId });
    }

    return Response.json({ success: true, resolved: body.resolved, status: nextStatus });
  } catch (error) {
    return serverError('POST_REPORT_OWNER_RESOLUTION', error);
  }
}
