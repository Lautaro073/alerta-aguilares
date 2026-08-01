/**
 * Consentimiento granular para las tecnologías opcionales.
 *
 * Cada función opcional se acepta por separado: aceptar las notificaciones no
 * implica aceptar que se recuerden preferencias de interfaz, ni al revés.
 *
 * Importante: el consentimiento NO alcanza a las tecnologías estrictamente
 * necesarias (sesión de Supabase, huella de navegador antiabuso). Esas se usan
 * siempre, porque sin ellas no se puede sostener el servicio ni aplicar los
 * límites de publicación. Ver la Política de Privacidad.
 */

// El nombre de la clave quedó de la primera versión; el versionado real vive en
// el campo `version` del contenido. Se reutiliza a propósito para no dejar
// claves huérfanas en el navegador de quien ya había decidido.
export const CONSENT_STORAGE_KEY = 'aguilares.consent.v1';

// v2: se pasó de una única opción global a un flag por función. Los registros
// de la versión anterior se descartan y se vuelve a preguntar, porque cambió el
// alcance de lo que se estaba aceptando.
export const CONSENT_VERSION = 2;

export type OptionalFeature = 'notifications' | 'preferences';

export interface ConsentState {
  version: number;
  /** ISO 8601, o null si todavía no respondió el banner. */
  decidedAt: string | null;
  /** Notificaciones push: token del dispositivo registrado en el servidor. */
  notifications: boolean;
  /** Recordar entre visitas preferencias de interfaz (recorrido guiado). */
  preferences: boolean;
}

const CONSENT_EVENT = 'aguilares:consent-change';

const EMPTY_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  decidedAt: null,
  notifications: false,
  preferences: false,
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    // Una versión distinta significa que cambió el alcance de lo que se acepta:
    // hay que volver a preguntar en lugar de dar por válida la decisión vieja.
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      version: CONSENT_VERSION,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : null,
      notifications: parsed.notifications === true,
      preferences: parsed.preferences === true,
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

function persist(state: ConsentState): ConsentState {
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

/**
 * Guarda la respuesta del banner. Marca la decisión como tomada, así que el
 * banner deja de mostrarse aunque se hayan rechazado las dos funciones.
 */
export function saveConsent(choices: Record<OptionalFeature, boolean>): ConsentState {
  return persist({
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    notifications: choices.notifications,
    preferences: choices.preferences,
  });
}

/**
 * Habilita UNA función porque la persona la pidió explícitamente desde su propio
 * control (por ejemplo, tocando la campana de notificaciones).
 *
 * A propósito NO marca el banner como respondido ni toca la otra función: pedir
 * las notificaciones no dice nada sobre si querés que se recuerden preferencias
 * de interfaz, así que el banner sigue preguntando por lo que falta.
 */
export function grantFeature(feature: OptionalFeature): ConsentState {
  const current = readConsent() ?? EMPTY_CONSENT;
  if (current[feature]) return current;

  return persist({ ...current, version: CONSENT_VERSION, [feature]: true });
}

/** ¿Está aceptada esta función en particular? */
export function hasConsent(feature: OptionalFeature): boolean {
  return readConsent()?.[feature] === true;
}

/** ¿Ya respondió el banner? Si no, hay que mostrarlo. */
export function hasAnsweredBanner(): boolean {
  return typeof readConsent()?.decidedAt === 'string';
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
