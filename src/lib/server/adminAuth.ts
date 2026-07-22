import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface AdminRoleResult {
  uid: string;
  role?: AdminAccessRole;
  errorResponse?: Response;
}

const ADMIN_ACCESS_ROLES = ['admin', 'operator', 'official'];
type AdminAccessRole = (typeof ADMIN_ACCESS_ROLES)[number];

async function verifyAuthUid(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function verifyAdminRole(
  request: NextRequest,
  allowedRoles: readonly AdminAccessRole[] = ADMIN_ACCESS_ROLES
): Promise<AdminRoleResult> {
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
    const uid = await verifyAuthUid(token);
    if (!uid) {
      return {
        uid: '',
        errorResponse: Response.json(
          { success: false, error: 'Sesion invalida o expirada.' },
          { status: 401 }
        ),
      };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.role || !allowedRoles.includes(data.role)) {
      return {
        uid,
        errorResponse: Response.json(
          { success: false, error: 'Acceso denegado. Se requiere rol interno.' },
          { status: 403 }
        ),
      };
    }

    return { uid, role: data.role };
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

