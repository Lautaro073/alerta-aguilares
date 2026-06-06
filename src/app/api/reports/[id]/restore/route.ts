import { NextRequest } from 'next/server';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { touchPublicReportsFeed } from '@/lib/server/publicFeed';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/[id]/restore
 *
 * Restaura un reporte archivado (soft-deleted) volviéndolo al estado ACTIVE.
 * Solo disponible para administradores.
 */
export async function POST(
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

    if (!reportRow.deleted_at) {
      return Response.json(
        { success: false, error: 'El reporte no está archivado. No es necesario restaurarlo.' },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        deleted_at: null,
        status: 'ACTIVE',
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
      console.error('[POST /api/reports/[id]/restore] No se pudo actualizar el feed publico:', err);
    });

    return Response.json(
      {
        success: true,
        message: 'Reporte restaurado correctamente y marcado como Activo.',
        data: { id: reportId, status: 'ACTIVE' },
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError('POST_RESTORE_REPORT', error);
  }
}
