import type { MetadataRoute } from 'next';
import { LEGAL_VERSION, SITE_URL } from '@/lib/legal';

/**
 * Solo las rutas públicas y estables del sitio. Quedan afuera a propósito
 * `/admin` (privada) y `/auth/*` (flujos con token, sin contenido indexable).
 *
 * Los documentos legales usan LEGAL_VERSION como fecha de modificación: cambia
 * únicamente cuando se reescribe el articulado, que es justo lo que interesa
 * comunicar a los rastreadores.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const legalLastModified = new Date(LEGAL_VERSION);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: legalLastModified,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terminos`,
      lastModified: legalLastModified,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
