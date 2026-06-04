import { NextRequest } from 'next/server';
import { adminApp } from '@/lib/firebase/admin';

/**
 * Verifica el token de Firebase App Check del header `X-Firebase-AppCheck`.
 * 
 * - En desarrollo (NODE_ENV !== 'production'): siempre retorna true (no bloquea).
 * - En producción: verifica el token con el SDK de Firebase Admin.
 * 
 * Si la site key de reCAPTCHA no está configurada en producción, la verificación falla cerrada.
 */
export async function verifyAppCheckToken(request: NextRequest): Promise<boolean> {
  // Saltar verificación en desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.error('[App Check] NEXT_PUBLIC_RECAPTCHA_SITE_KEY no esta configurada en produccion.');
    return false;
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
