import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { badRequest, json } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { rateLimit } from '@/server/security';
import { saveUpload } from '@/server/storage';
import { audit } from '@/server/audit';

/** Multipart upload (field "file"), stored via the storage adapter; returns the public URL. */
export const POST = api(async (req) => {
  const me = await requireStaff(req, 'media.write');
  rateLimit(req, 'upload', 60, 10 * 60_000, String(me.id));
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw badRequest('No file uploaded');
  const folder = String(form.get('folder') || 'media').replace(/[^a-z0-9-]/gi, '').slice(0, 30) || 'media';
  const saved = await saveUpload(file, folder);
  const asset = await prisma.mediaAsset.create({ data: { url: saved.url, key: saved.key, mime: saved.mime, sizeBytes: saved.size, alt: String(form.get('alt') || '').slice(0, 191) || null } });
  await audit(req, me.id, 'upload', 'media', asset.id, saved.key);
  return json(asset, 201);
});

export const GET = api(async (req) => {
  await requireStaff(req, 'media.write');
  return json({ items: await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }) });
});
