import { NextRequest } from 'next/server';
import { adminApp } from '@/lib/firebase/admin';

/**
 * Verifica el token de Firebase App Check del header `X-Firebase-AppCheck`.
 * 
 * - En desarrollo (NODE_ENV !== 'production'): siempre retorna true (no bloquea).
 * - En producción: verifica el token con el SDK de Firebase Admin.
 * 
 * Si la RECAPTCHA_SITE_KEY no está configurada, se omite la verificación.
 */
export async function verifyAppCheckToken(request: NextRequest): Promise<boolean> {
  // Saltar verificación en desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Si no hay site key configurada, no forzar App Check
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    return true;
  }

  const appCheckToken = request.headers.get('X-Firebase-AppCheck');

  if (!appCheckToken) {
    return false;
  }

  try {
    await adminApp.appCheck().verifyToken(appCheckToken);
    return true;
  } catch {
    return false;
  }
}
