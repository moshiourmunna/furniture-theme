import { readLocalUpload } from '@/server/storage';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', pdf: 'application/pdf' };

/** Serves files saved by the local storage driver. (With STORAGE_DRIVER=s3 files are served by the bucket/CDN.) */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const key = (await params).path.join('/');
  if (!/^[a-z0-9/_-]+\.(jpg|png|webp|avif|pdf)$/i.test(key)) return new Response('Not found', { status: 404 });
  const buf = await readLocalUpload(key);
  if (!buf) return new Response('Not found', { status: 404 });
  const ext = key.split('.').pop()!.toLowerCase();
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': TYPES[ext], 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}
