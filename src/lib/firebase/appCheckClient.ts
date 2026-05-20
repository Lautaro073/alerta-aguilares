/**
 * Obtiene el token de Firebase App Check para adjuntarlo en el header
 * `X-Firebase-AppCheck` de las peticiones a las API Routes del servidor.
 * 
 * Retorna el token como string, o null si App Check no está disponible
 * (modo dev sin reCAPTCHA, o navegador sin soporte).
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { getToken, getApp } = await import('firebase/app-check');
    const { app } = await import('@/lib/firebase/client');
    // getApp() para verificar que App Check fue inicializado
    getApp();
    const result = await getToken(app, /* forceRefresh */ false);
    return result.token;
  } catch {
    // App Check no inicializado o error — no bloquear el flujo
    return null;
  }
}
