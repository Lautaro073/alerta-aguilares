import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { touchPublicReportsFeed } from '@/lib/server/publicFeed';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';

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

    const reportRef = adminDb.collection('reports').doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return Response.json(
        { success: false, error: 'El reporte no existe.' },
        { status: 404 }
      );
    }

    const nowISO = new Date().toISOString();
    await reportRef.update({
      status,
      updatedAt: nowISO,
      resolvedAt: status === 'RESOLVED' ? nowISO : null,
    });

    await touchPublicReportsFeed({
      cityId: reportDoc.data()?.cityId || DEFAULT_CITY_ID,
      reportId,
      createdAt: nowISO,
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

    const reportRef = adminDb.collection('reports').doc(reportId);
    const metaRef = adminDb.collection('report_private_meta').doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return Response.json(
        { success: false, error: 'El reporte no existe.' },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();
    batch.delete(reportRef);
    batch.delete(metaRef);
    await batch.commit();

    await touchPublicReportsFeed({
      cityId: reportDoc.data()?.cityId || DEFAULT_CITY_ID,
      reportId,
      createdAt: new Date().toISOString(),
    }).catch((err) => {
      console.error('[DELETE /api/reports/[id]] No se pudo actualizar el feed publico:', err);
    });

    return Response.json(
      {
        success: true,
        message: 'Reporte y metadatos asociados eliminados de forma permanente.',
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError('DELETE_REPORT', error);
  }
}
