import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/legal';

/**
 * Reglas para los rastreadores. El sitio es público, así que se permite el
 * rastreo general y solo se excluye lo que no tiene sentido indexar:
 * el panel de administración, los endpoints de la API y las pantallas de
 * flujo con token, que no tienen contenido propio y solo funcionan con un
 * enlace de un solo uso.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
