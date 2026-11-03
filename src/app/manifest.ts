import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gestión diaria de obra',
    short_name: 'Gestión obra',
    description: 'Albaranes y fichajes desde el móvil, también sin cobertura.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#d9480f',
    lang: 'es',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
