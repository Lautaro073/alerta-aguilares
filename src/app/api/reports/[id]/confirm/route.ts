import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    const { data, error } = await supabaseAdmin.rpc('toggle_report_confirmation', {
      p_report_id: reportId,
      p_uid: uid,
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;

    return Response.json(
      {
        success: true,
        verifiedCount: result?.verified_count || 0,
        confirmed: Boolean(result?.confirmed),
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
