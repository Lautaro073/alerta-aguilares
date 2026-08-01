import { NextRequest } from 'next/server';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { touchPublicReportsFeed } from '@/lib/server/publicFeed';
import { createReportEvent } from '@/lib/server/reportEvents';
import { supabaseAdmin } from '@/lib/supabase/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import type { ReportAssignedArea, ReportPriority, ReportStatus } from '@/types/report';

export const dynamic = 'force-dynamic';

const REPORT_STATUSES: ReportStatus[] = ['PENDING', 'VERIFYING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED', 'DUPLICATE'];
const ASSIGNED_AREAS: ReportAssignedArea[] = ['traffic', 'public_works', 'lighting', 'environment'];
const REPORT_PRIORITIES: ReportPriority[] = ['high', 'medium', 'low'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { uid, errorResponse } = await verifyAdminRole(request, ['admin', 'official']);
    if (errorResponse) return errorResponse;

    let body: { status?: ReportStatus; assignedArea?: ReportAssignedArea | null; priority?: ReportPriority; duplicateOfReportId?: string | null };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: 'Cuerpo de solicitud invalido. Se espera JSON.' },
        { status: 400 }
      );
    }

    const { status } = body;
    if (!status && body.assignedArea === undefined && body.priority === undefined) {
      return Response.json(
        { success: false, error: 'No hay cambios para aplicar.' },
        { status: 400 }
      );
    }

    if (status && !REPORT_STATUSES.includes(status)) {
      return Response.json(
        { success: false, error: 'Estado invalido.' },
        { status: 400 }
      );
    }

    if (body.assignedArea !== undefined && body.assignedArea !== null && !ASSIGNED_AREAS.includes(body.assignedArea)) {
      return Response.json(
        { success: false, error: 'Area asignada invalida.' },
        { status: 400 }
      );
    }

    if (body.priority !== undefined && !REPORT_PRIORITIES.includes(body.priority)) {
      return Response.json(
        { success: false, error: 'Prioridad invalida.' },
        { status: 400 }
      );
    }

    if (status === 'DUPLICATE' && body.duplicateOfReportId === reportId) {
      return Response.json(
        { success: false, error: 'Una alerta no puede marcarse como duplicada de si misma.' },
        { status: 400 }
      );
    }

    if (status === 'DUPLICATE' && body.duplicateOfReportId) {
      const { data: parentReport, error: parentError } = await supabaseAdmin
        .from('reports')
        .select('id')
        .eq('id', body.duplicateOfReportId)
        .eq('city_id', DEFAULT_CITY_ID)
        .maybeSingle();

      if (parentError) throw parentError;

      if (!parentReport) {
        return Response.json(
          { success: false, error: 'La alerta relacionada no existe.' },
          { status: 404 }
        );
      }
    }

    const { data: reportRow, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('id, city_id, status, assigned_area, duplicate_of_report_id')
      .eq('id', reportId)
      .eq('city_id', DEFAULT_CITY_ID)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!reportRow) {
      return Response.json(
        { success: false, error: 'El reporte no existe.' },
        { status: 404 }
      );
    }

    const nowISO = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        ...(status ? { status, resolved_at: status === 'RESOLVED' ? nowISO : null } : {}),
        ...(status ? { duplicate_of_report_id: status === 'DUPLICATE' ? body.duplicateOfReportId || null : null } : {}),
        ...(body.assignedArea !== undefined ? { assigned_area: body.assignedArea } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        updated_at: nowISO,
      })
      .eq('id', reportId)
      .eq('city_id', DEFAULT_CITY_ID);

    if (updateError) {
      throw updateError;
    }

    if (status) {
      await createReportEvent({
        reportId,
        actorUid: uid,
        eventType: status === 'DUPLICATE' ? 'duplicate_marked' : 'status_changed',
        cityId: reportRow.city_id,
        metadata: {
          from: reportRow.status,
          to: status,
          duplicateOfReportId: status === 'DUPLICATE' ? body.duplicateOfReportId || null : null,
        },
      });
    }

    if (body.assignedArea !== undefined) {
      await createReportEvent({
        reportId,
        actorUid: uid,
        eventType: 'area_changed',
        cityId: reportRow.city_id,
        metadata: { from: reportRow.assigned_area, to: body.assignedArea },
      });
    }

    await touchPublicReportsFeed({
      cityId: reportRow.city_id,
      reportId,
    }).catch((err) => {
      console.error('[PATCH /api/reports/[id]] No se pudo actualizar el feed publico:', err);
    });

    return Response.json(
      {
        success: true,
        message: 'Reporte actualizado con exito.',
        data: { id: reportId, status, assignedArea: body.assignedArea, priority: body.priority },
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError('PATCH_REPORT_STATUS', error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { uid, errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const { data: reportRow, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('id, city_id, deleted_at')
      .eq('id', reportId)
      .eq('city_id', DEFAULT_CITY_ID)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!reportRow) {
      return Response.json(
        { success: false, error: 'El reporte no existe.' },
        { status: 404 }
      );
    }

    if (reportRow.deleted_at) {
      return Response.json(
        { success: false, error: 'El reporte ya fue archivado.' },
        { status: 409 }
      );
    }

    // Soft delete: marcar como archivado sin eliminar el registro
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('city_id', DEFAULT_CITY_ID);

    if (updateError) {
      throw updateError;
    }

    await createReportEvent({
      reportId,
      actorUid: uid,
      eventType: 'hidden',
      cityId: reportRow.city_id,
      metadata: { deletedAt: new Date().toISOString() },
    });

    await touchPublicReportsFeed({
      cityId: reportRow.city_id,
      reportId,
    }).catch((err) => {
      console.error('[DELETE /api/reports/[id]] No se pudo actualizar el feed publico:', err);
    });

    return Response.json(
      {
        success: true,
        message: 'Reporte archivado correctamente. Puede ser restaurado desde el panel de administración.',
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError('DELETE_REPORT', error);
  }
}

