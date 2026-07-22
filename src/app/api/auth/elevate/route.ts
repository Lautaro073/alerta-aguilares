import { NextRequest } from 'next/server';
import { forbidden, serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/auth/elevate
 *
 * Endpoint exclusivo de desarrollo para promover al usuario autenticado
 * al rol de 'admin' en Supabase.
 *
 * ⚠️ SOLO DISPONIBLE EN ENTORNOS DE DESARROLLO (NODE_ENV !== 'production').
 * En producción, este endpoint devuelve 403 Forbidden inmediatamente.
 */
export async function POST(request: NextRequest) {
  // Guardia de seguridad: bloquear completamente en producción
  if (process.env.NODE_ENV === 'production') {
    return forbidden('Esta funcionalidad no está disponible en producción.');
  }

  try {
    // 1. Verificar el Bearer token del usuario
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return forbidden('Se requiere un token de autenticación válido.');
    }

    const token = authHeader.substring(7);
    if (!token) {
      return forbidden('Token de autenticación vacío.');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return forbidden('Token de autenticación inválido o expirado.');
    }
    const uid = authData.user.id;

    const { data: userRow, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('uid')
      .eq('uid', uid)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!userRow) {
      return forbidden('No se encontró el perfil del usuario en la base de datos.');
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'admin' })
      .eq('uid', uid);

    if (updateError) {
      throw updateError;
    }

    console.log(`[DEV] Usuario ${uid} promovido a 'admin' exitosamente.`);

    return Response.json(
      {
        success: true,
        message: 'Rol actualizado a admin exitosamente. Recargá la sesión para ver los cambios.',
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError('ELEVATE_ROUTE', error);
  }
}
