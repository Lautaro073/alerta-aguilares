import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CiudadAlerta Aguilares',
    short_name: 'CiudadAlerta',
    description: 'Sistema de Reportes y Alertas en Tiempo Real para la Ciudad de Aguilares',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#080d1a',
    theme_color: '#080d1a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
