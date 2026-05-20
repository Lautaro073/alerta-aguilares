import { NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { serverError } from '@/lib/server/response';

export const dynamic = 'force-dynamic';

/**
 * Verifica si el usuario autenticado tiene el rol de administrador.
 */
async function verifyAdminRole(request: NextRequest): Promise<{ uid: string; isAdmin: boolean; errorResponse?: Response }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      uid: '',
      isAdmin: false,
      errorResponse: Response.json(
        { success: false, error: 'No autorizado. Se requiere token Bearer.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  if (!token) {
    return {
      uid: '',
      isAdmin: false,
      errorResponse: Response.json(
        { success: false, error: 'No autorizado. Token vacío.' },
        { status: 401 }
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Buscar el rol del usuario en la colección 'users' de Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return {
        uid,
        isAdmin: false,
        errorResponse: Response.json(
          { success: false, error: 'Acceso denegado. Se requieren privilegios de administrador.' },
          { status: 403 }
        ),
      };
    }

    return { uid, isAdmin: true };
  } catch (err) {
    console.error('Error al verificar privilegios de administrador:', err);
    return {
      uid: '',
      isAdmin: false,
      errorResponse: Response.json(
        { success: false, error: 'Sesión inválida o expirada.' },
        { status: 401 }
      ),
    };
  }
}

/**
 * PATCH /api/reports/[id]
 * 
 * Permite a un administrador actualizar el estado de un reporte (ej. cambiar a RESOLVED o DUPLICATE).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;

    // 1. Verificar rol de administrador
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    // 2. Parsear el cuerpo de la petición
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: 'Cuerpo de solicitud inválido. Se espera JSON.' },
        { status: 400 }
      );
    }

    const { status } = body;
    if (!status || !['ACTIVE', 'RESOLVED', 'DUPLICATE'].includes(status)) {
      return Response.json(
        { success: false, error: 'Estado inválido. Debe ser ACTIVE, RESOLVED o DUPLICATE.' },
        { status: 400 }
      );
    }

    // 3. Actualizar el reporte en Firestore
    const reportRef = adminDb.collection('reports').doc(reportId);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return Response.json(
        { success: false, error: 'El reporte no existe.' },
        { status: 404 }
      );
    }

    const nowISO = new Date().toISOString();
    const updateData: any = {
      status,
      updatedAt: nowISO,
    };

    if (status === 'RESOLVED') {
      updateData.resolvedAt = nowISO;
    } else {
      updateData.resolvedAt = null;
    }

    await reportRef.update(updateData);

    return Response.json(
      {
        success: true,
        message: `Estado del reporte actualizado a ${status} con éxito.`,
        data: { id: reportId, status },
      },
      { status: 200 }
    );

  } catch (error) {
    return serverError('PATCH_REPORT_STATUS', error);
  }
}

/**
 * DELETE /api/reports/[id]
 * 
 * Permite a un administrador eliminar de manera permanente un reporte y sus metadatos.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;

    // 1. Verificar rol de administrador
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    // 2. Eliminar el reporte y sus metadatos privados en un batch
    const reportRef = adminDb.collection('reports').doc(reportId);
    const metaRef = adminDb.collection('report_private_meta').doc(reportId);

    const doc = await reportRef.get();
    if (!doc.exists) {
      return Response.json(
        { success: false, error: 'El reporte no existe.' },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();
    batch.delete(reportRef);
    batch.delete(metaRef);
    await batch.commit();

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
