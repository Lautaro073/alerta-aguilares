import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export interface AdminRoleResult {
  uid: string;
  errorResponse?: Response;
}

export async function verifyAdminRole(request: NextRequest): Promise<AdminRoleResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      uid: '',
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
      errorResponse: Response.json(
        { success: false, error: 'No autorizado. Token vacio.' },
        { status: 401 }
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return {
        uid,
        errorResponse: Response.json(
          { success: false, error: 'Acceso denegado. Se requieren privilegios de administrador.' },
          { status: 403 }
        ),
      };
    }

    return { uid };
  } catch (err) {
    console.error('Error al verificar privilegios de administrador:', err);
    return {
      uid: '',
      errorResponse: Response.json(
        { success: false, error: 'Sesion invalida o expirada.' },
        { status: 401 }
      ),
    };
  }
}

