import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface UserProfileResponse {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: unknown;
  updatedAt: unknown;
}

async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: Response.json(
        { success: false, error: 'No autorizado. Se requiere token Bearer.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  if (!token) {
    return {
      errorResponse: Response.json(
        { success: false, error: 'No autorizado. Token vacio.' },
        { status: 401 }
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { decodedToken };
  } catch {
    return {
      errorResponse: Response.json(
        { success: false, error: 'Sesion invalida o expirada.' },
        { status: 401 }
      ),
    };
  }
}

interface UserRow {
  uid: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  role: 'user' | 'admin';
  created_at: string | null;
  updated_at: string | null;
}

function serializeProfile(data: UserRow): UserProfileResponse {
  return {
    uid: data.uid,
    displayName: data.display_name || null,
    email: data.email || null,
    photoURL: data.photo_url || null,
    role: data.role === 'admin' ? 'admin' : 'user',
    createdAt: data.created_at || null,
    updatedAt: data.updated_at || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { decodedToken, errorResponse } = await verifyUser(request);
    if (errorResponse) return errorResponse;
    if (!decodedToken) {
      return Response.json(
        { success: false, error: 'Sesion invalida o expirada.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const uid = decodedToken.uid;
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    const displayName =
      typeof body.displayName === 'string' && body.displayName.trim().length > 0
        ? body.displayName.trim().slice(0, 80)
        : existing?.display_name || decodedToken.name || 'Vecino Anonimo';

    const nextProfile = {
      uid,
      display_name: displayName,
      email: existing?.email || decodedToken.email || null,
      photo_url: existing?.photo_url || decodedToken.picture || null,
      role: existing?.role === 'admin' ? 'admin' : 'user',
    };

    const { data: savedProfile, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(nextProfile, { onConflict: 'uid' })
      .select('*')
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return Response.json(
      {
        success: true,
        data: serializeProfile(savedProfile as UserRow),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    return serverError('POST_USERS_ME', error);
  }
}

