/**
 * Tarjeta para X/Twitter. Reutiliza exactamente la misma imagen que Open Graph.
 *
 * Hace falta este archivo aparte: `opengraph-image.tsx` NO alimenta la etiqueta
 * `twitter:image`. Sin esto, al compartir en X la tarjeta quedaba con la
 * ilustración sin título mientras el resto de las plataformas mostraban la
 * compuesta.
 */
export { default, alt, size, contentType } from './opengraph-image';
