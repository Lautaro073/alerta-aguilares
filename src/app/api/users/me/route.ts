import { NextRequest } from 'next/server';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';
import { DEFAULT_DISPLAY_NAME } from '@/lib/constants/user';

export const dynamic = 'force-dynamic';

type UserRole = 'user' | 'admin' | 'operator' | 'official';

interface UserProfileResponse {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

type VerifiedUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

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

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return {
      errorResponse: Response.json(
        { success: false, error: 'Sesion invalida o expirada.' },
        { status: 401 }
      ),
    };
  }

  const metadata = data.user.user_metadata || {};
  const name = [metadata.display_name, metadata.full_name, metadata.name]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  const picture = [metadata.avatar_url, metadata.picture]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return {
    decodedToken: {
      uid: data.user.id,
      email: data.user.email || null,
      name: name || null,
      picture: picture || null,
    } satisfies VerifiedUser,
  };
}

interface UserRow {
  uid: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  role: UserRole;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function serializeProfile(data: UserRow): UserProfileResponse {
  return {
    uid: data.uid,
    displayName: data.display_name || null,
    email: data.email || null,
    photoURL: data.photo_url || null,
    role: data.role || 'user',
    termsAcceptedAt: data.terms_accepted_at || null,
    termsVersion: data.terms_version || null,
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
        : existing?.display_name || decodedToken.name || DEFAULT_DISPLAY_NAME;

    const nextProfile: Record<string, unknown> = {
      uid,
      display_name: displayName,
      email: existing?.email || decodedToken.email || null,
      photo_url: existing?.photo_url || decodedToken.picture || null,
      role: existing?.role || 'user',
    };

    // Consentimiento a los Términos y la Política de Privacidad (Ley 25.326, art. 5).
    // Se registra una sola vez: si ya hay fecha, no se pisa, porque el dato que
    // importa acreditar es cuándo aceptó por primera vez.
    const acceptedTerms = body.acceptedTerms === true;
    const termsVersion =
      typeof body.termsVersion === 'string' && body.termsVersion.trim().length > 0
        ? body.termsVersion.trim().slice(0, 40)
        : null;

    if (acceptedTerms && termsVersion && !existing?.terms_accepted_at) {
      nextProfile.terms_accepted_at = new Date().toISOString();
      nextProfile.terms_version = termsVersion;
    }

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

