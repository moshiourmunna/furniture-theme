import type { NextConfig } from 'next';
import path from 'node:path';

const dev = process.env.NODE_ENV !== 'production';
const s3 = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).origin : '';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${s3}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self'${dev ? ' ws:' : ''}`,
  'frame-src https://www.openstreetmap.org https://www.google.com',
  "frame-ancestors 'none'",
  "form-action 'self' https:",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const security = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@shekor/shared', '@shekor/db'],
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: { root: path.resolve(__dirname, '../..') },
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' as const } : {}),
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 80],
    deviceSizes: [390, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [64, 96, 160, 240, 320, 480],
    localPatterns: [{ pathname: '/media/**' }, { pathname: '/uploads/**' }],
    ...(s3 ? { remotePatterns: [new URL(`${s3}/**`)] } : {}),
  },
  async headers() {
    return [
      { source: '/:path*', headers: security },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    ];
  },
};

export default nextConfig;
