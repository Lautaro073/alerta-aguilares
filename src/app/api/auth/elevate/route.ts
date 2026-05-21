import { NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { forbidden, serverError } from '@/lib/server/response';

/**
 * POST /api/auth/elevate
 *
 * Endpoint exclusivo de desarrollo para promover al usuario autenticado
 * al rol de 'admin' en la colección /users de Firestore.
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

    let uid: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch {
      return forbidden('Token de autenticación inválido o expirado.');
    }

    // 2. Actualizar el rol del usuario a 'admin' en Firestore
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return forbidden('No se encontró el perfil del usuario en la base de datos.');
    }

    await userDocRef.update({
      role: 'admin',
      updatedAt: new Date().toISOString(),
    });

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
