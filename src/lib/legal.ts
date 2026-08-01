/**
 * Datos y versionado de los documentos legales.
 *
 * LEGAL_VERSION identifica la redacción vigente de los Términos y de la Política
 * de Privacidad. Al aceptarlos se guarda esta versión junto a la fecha, así queda
 * registro de QUÉ texto aceptó cada persona: si más adelante cambian de forma
 * sustancial, se puede detectar quién no aceptó la versión nueva.
 *
 * Al modificar los documentos, subir esta constante y la fecha de "Última
 * actualización" que se muestra en ambas páginas.
 */
export const LEGAL_VERSION = '2026-07-31';

export const SITE_URL = 'https://alertas-aguilares.vercel.app';

/**
 * Tarjeta social. La imagen la generan `src/app/opengraph-image.tsx` y
 * `src/app/twitter-image.tsx`, que componen `public/og.png` con el título
 * tipografiado y quedan servidas en la ruta `/opengraph-image`.
 *
 * Esos archivos de convención cubren SOLO su propio segmento: no se heredan a
 * las rutas hijas. Por eso las páginas que definen su propio bloque `openGraph`
 * (privacidad, términos) tienen que apuntar acá a mano, o se comparten sin
 * imagen. En el layout raíz, en cambio, NO hay que declararla: ahí el archivo
 * de convención tiene prioridad y declararla además solo lograba que og:image y
 * twitter:image apuntaran a imágenes distintas.
 *
 * Las medidas deben coincidir con el `size` exportado por `opengraph-image.tsx`.
 */
export const OG_CARD = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Alertas Aguilares — Reportá los problemas de tu barrio',
} as const;

export const CONTACTO_LEGAL = 'lautarojimenez02@gmail.com';

/**
 * Marca temporal en el navegador para el alta con Google: el consentimiento se
 * presta ANTES de irse al proveedor de identidad, pero solo se puede registrar
 * al volver, cuando ya hay sesión.
 */
export const PENDING_TERMS_KEY = 'aguilares.pending-terms-acceptance';

export function markPendingTermsAcceptance() {
  try {
    window.sessionStorage.setItem(PENDING_TERMS_KEY, LEGAL_VERSION);
  } catch {
    // Sin almacenamiento no se puede dejar la marca; el registro del
    // consentimiento se pierde, pero el alta no debe romperse por eso.
  }
}

/** Consume la marca: la devuelve y la borra para no volver a registrarla. */
export function takePendingTermsAcceptance(): string | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_TERMS_KEY);
    if (value) window.sessionStorage.removeItem(PENDING_TERMS_KEY);
    return value;
  } catch {
    return null;
  }
}
