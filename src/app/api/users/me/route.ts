import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { serverError } from '@/lib/server/response';

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

function serializeProfile(uid: string, data: FirebaseFirestore.DocumentData): UserProfileResponse {
  return {
    uid,
    displayName: data.displayName || null,
    email: data.email || null,
    photoURL: data.photoURL || null,
    role: data.role === 'admin' ? 'admin' : 'user',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
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
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const existing = userSnap.data();

    const displayName =
      typeof body.displayName === 'string' && body.displayName.trim().length > 0
        ? body.displayName.trim().slice(0, 80)
        : existing?.displayName || decodedToken.name || 'Vecino Anonimo';

    const nowISO = new Date().toISOString();
    const nextProfile = {
      uid,
      displayName,
      email: existing?.email || decodedToken.email || null,
      photoURL: existing?.photoURL || decodedToken.picture || null,
      role: existing?.role === 'admin' ? 'admin' : 'user',
      createdAt: existing?.createdAt || nowISO,
      updatedAt: nowISO,
    };

    await userRef.set(nextProfile, { merge: true });

    return Response.json(
      {
        success: true,
        data: serializeProfile(uid, nextProfile),
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

