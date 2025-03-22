import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'korekara',
    short_name: 'korekara',
    description: 'Korekara is a simple web app to help you plan your day.',
    lang: 'ja',
    start_url: '/',
    display: 'standalone',
    theme_color: '#000000',
    background_color: '#000000',
    icons: [
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: 'icon512_maskable.png',
        type: 'image/png'
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: 'icon512_rounded.png',
        type: 'image/png'
      }
    ],
    orientation: 'any',
    dir: 'auto'
  };
}
