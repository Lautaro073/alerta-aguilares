import { getToken } from 'firebase/app-check';

/**
 * Obtiene el token de Firebase App Check para adjuntarlo en el header
 * `X-Firebase-AppCheck` de las peticiones a las API Routes del servidor.
 *
 * Retorna el token como string, o null si App Check no está disponible
 * (modo dev sin reCAPTCHA, o error de inicialización).
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { appCheckInstance } = await import('@/lib/firebase/client');
    if (!appCheckInstance) return null;
    const result = await getToken(appCheckInstance, /* forceRefresh */ false);
    return result.token;
  } catch {
    return null;
  }
}
