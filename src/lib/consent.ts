/**
 * Estado de consentimiento de almacenamiento local y tecnologías opcionales.
 *
 * Importante: el consentimiento NO alcanza a las tecnologías estrictamente
 * necesarias (sesión de Supabase, huella de navegador antiabuso). Esas se usan
 * siempre, porque sin ellas no se puede sostener el servicio ni aplicar los
 * límites de publicación. Ver la Política de Privacidad.
 */

export const CONSENT_STORAGE_KEY = 'aguilares.consent.v1';
export const CONSENT_VERSION = 1;

export type ConsentChoice = 'all' | 'essential';

export interface ConsentState {
  choice: ConsentChoice;
  version: number;
  /** ISO 8601 */
  decidedAt: string;
}

const CONSENT_EVENT = 'aguilares:consent-change';

function isBrowser() {
  return typeof window !== 'undefined';
}

function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.choice !== 'all' && parsed.choice !== 'essential') return null;
    // Una versión distinta significa que cambió el alcance de lo que se acepta:
    // hay que volver a preguntar en lugar de dar por válida la decisión vieja.
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      choice: parsed.choice,
      version: CONSENT_VERSION,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Caché del snapshot. `useSyncExternalStore` compara por identidad, así que
 * `readConsent` DEBE devolver la misma referencia mientras el valor guardado no
 * cambie: si construyera un objeto nuevo en cada llamada, React entraría en un
 * bucle infinito de renders ("The result of getSnapshot should be cached").
 */
let cachedRaw: string | null = null;
let cachedState: ConsentState | null = null;

/**
 * Respaldo para navegadores con el almacenamiento bloqueado (modo privado,
 * cookies de terceros deshabilitadas). Sin esto la decisión no se podría leer de
 * vuelta y el banner reaparecería apenas se lo cierra, como si el botón no
 * funcionara. La decisión vale para la pestaña actual y se vuelve a preguntar en
 * la próxima visita, que es lo correcto: no se pudo dejar constancia.
 */
let storageBlocked = false;
let memoryState: ConsentState | null = null;

export function readConsent(): ConsentState | null {
  if (!isBrowser()) return null;
  if (storageBlocked) return memoryState;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    storageBlocked = true;
    return memoryState;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseConsent(raw);
  }

  return cachedState;
}

export function saveConsent(choice: ConsentChoice): ConsentState {
  const state: ConsentState = {
    choice,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };

  if (!isBrowser()) return state;

  const raw = JSON.stringify(state);
  memoryState = state;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    // Se dejan sincronizados caché y almacenamiento para que la próxima lectura
    // devuelva esta misma referencia y no dispare un render extra.
    cachedRaw = raw;
    cachedState = state;
  } catch {
    storageBlocked = true;
  }

  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  return state;
}

/** Borra la decisión guardada para que el banner vuelva a mostrarse. */
export function resetConsent() {
  if (!isBrowser()) return;

  memoryState = null;
  cachedRaw = null;
  cachedState = null;

  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    storageBlocked = true;
  }

  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

/**
 * ¿Aceptó el usuario las funciones opcionales (notificaciones push y recordar
 * preferencias de interfaz)? Usar antes de activar cualquiera de ellas.
 */
export function hasOptionalConsent(): boolean {
  return readConsent()?.choice === 'all';
}

export function subscribeToConsent(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) callback();
  };

  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}
