import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meal Direct Admin',
    short_name: 'MD Admin',
    description: 'Enterprise Operational Dashboard for Meal Direct',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B6B4F',
    theme_color: '#0B6B4F',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
