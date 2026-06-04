import { NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { serverError } from '@/lib/server/response';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/[id]/confirm
 * 
 * Permite a los vecinos confirmar/apoyar un incidente activo ("Yo también veo este problema").
 * Requiere Bearer Token de Firebase Auth. Realiza una transacción de base de datos
 * atómica tipo toggle (agrega el uid si no existe, o lo remueve si ya estaba).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    
    // 1. Obtener header de autorización
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'No autorizado. Se requiere token Bearer.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " tiene longitud 7
    if (!token) {
      return Response.json(
        { success: false, error: 'No autorizado. Token vacío.' },
        { status: 401 }
      );
    }

    // 2. Verificar el ID Token
    let uid: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      console.warn('❌ Token de autenticación inválido:', err);
      return Response.json(
        { success: false, error: 'Sesión inválida o expirada.' },
        { status: 401 }
      );
    }

    // 3. Realizar la transacción de toggle en Firestore
    const reportRef = adminDb.collection('reports').doc(reportId);
    let confirmedCount = 0;
    let userHasConfirmed = false;

    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(reportRef);
      if (!doc.exists) {
        throw new Error('NOT_FOUND');
      }

      const data = doc.data()!;
      if (data.status !== 'ACTIVE') {
        throw new Error('REPORT_NOT_ACTIVE');
      }

      const confirmedBy: string[] = data.confirmedBy || [];
      const userIndex = confirmedBy.indexOf(uid);

      if (userIndex > -1) {
        // Toggle OFF: El usuario ya lo había confirmado, se remueve el apoyo
        confirmedBy.splice(userIndex, 1);
        userHasConfirmed = false;
      } else {
        // Toggle ON: El usuario no lo había confirmado, se agrega el apoyo
        confirmedBy.push(uid);
        userHasConfirmed = true;
      }

      confirmedCount = confirmedBy.length;

      transaction.update(reportRef, {
        confirmedBy,
        verifiedCount: confirmedCount,
        updatedAt: new Date().toISOString(),
      });
    });

    return Response.json(
      {
        success: true,
        verifiedCount: confirmedCount,
        confirmed: userHasConfirmed,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return Response.json(
        { success: false, error: 'El reporte especificado no existe.' },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === 'REPORT_NOT_ACTIVE') {
      return Response.json(
        { success: false, error: 'Solo se pueden confirmar reportes en estado activo.' },
        { status: 400 }
      );
    }
    return serverError('POST_CONFIRM_REPORT', error);
  }
}
