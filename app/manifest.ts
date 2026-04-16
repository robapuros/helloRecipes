import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HelloRecipes',
    short_name: 'HelloRecipes',
    description: 'Todas nuestras recetas HelloFresh guardadas en un solo lugar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f6',
    theme_color: '#c1440e',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
