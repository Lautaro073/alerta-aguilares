import { getToken } from 'firebase/app-check';

/**
 * Obtiene el token de Firebase App Check para adjuntarlo en el header
 * `X-Firebase-AppCheck` de las peticiones a las API Routes del servidor.
 *
 * Si el token almacenado falla, fuerza una renovacion antes de informar el error.
 */
export async function getAppCheckToken(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('La validacion de seguridad solo esta disponible en el navegador.');
  }

  const { appCheckInstance } = await import('@/lib/firebase/client');

  if (!appCheckInstance) {
    throw new Error('No se pudo iniciar la validacion de seguridad de este navegador.');
  }

  try {
    const result = await getToken(appCheckInstance, false);
    return result.token;
  } catch (initialError) {
    console.warn('[App Check] El token actual fallo; se intentara renovarlo.', initialError);

    try {
      const result = await getToken(appCheckInstance, true);
      return result.token;
    } catch (refreshError) {
      console.error('[App Check] No se pudo obtener un token valido.', refreshError);
      throw new Error(
        'No pudimos validar este navegador. Recarga la pagina y, si continua, abre el sitio sin bloqueadores de contenido.',
      );
    }
  }
}
