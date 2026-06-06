import { NextRequest } from 'next/server';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { touchPublicReportsFeed } from '@/lib/server/publicFeed';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ReportStatus = 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    let body: { status?: ReportStatus };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: 'Cuerpo de solicitud invalido. Se espera JSON.' },
        { status: 400 }
      );
    }

    const { status } = body;
    if (!status || !['ACTIVE', 'RESOLVED', 'DUPLICATE'].includes(status)) {
      return Response.json(
        { success: false, error: 'Estado invalido. Debe ser ACTIVE, RESOLVED o DUPLICATE.' },
        { status: 400 }
      );
    }

    const { data: reportRow, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('id, city_id')
      .eq('id', reportId)
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
        status,
        resolved_at: status === 'RESOLVED' ? nowISO : null,
      })
      .eq('id', reportId);

    if (updateError) {
      throw updateError;
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
        message: `Estado del reporte actualizado a ${status} con exito.`,
        data: { id: reportId, status },
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
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    const { data: reportRow, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('id, city_id, deleted_at')
      .eq('id', reportId)
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
      .eq('id', reportId);

    if (updateError) {
      throw updateError;
    }

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

