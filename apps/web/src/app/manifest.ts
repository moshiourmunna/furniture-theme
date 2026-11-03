import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shekor — Furniture rooted in craft', short_name: 'Shekor', start_url: '/en', display: 'standalone',
    background_color: '#F4EFE6', theme_color: '#1F4D3A', lang: 'en',
    icons: [{ src: '/brand/shekor-appicon-green-192.png', sizes: '192x192', type: 'image/png' }, { src: '/brand/shekor-appicon-green-512.png', sizes: '512x512', type: 'image/png' }, { src: '/brand/shekor-appicon-green-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  };
}
