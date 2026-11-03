import { api } from '@/server/route';
import { badRequest, json } from '@/server/http';
import { requireUser } from '@/server/auth';
import { rateLimit } from '@/server/security';
import { saveUpload } from '@/server/storage';

/** Customer image upload for review photos (images only, 5 MB). */
export const POST = api(async (req) => {
  const user = await requireUser(req);
  rateLimit(req, 'customer-upload', 12, 60 * 60_000, String(user.id));
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw badRequest('No file uploaded');
  if (file.size > 5 * 1024 * 1024) throw badRequest('Photos must be under 5 MB');
  if (!file.type.startsWith('image/')) throw badRequest('Only images are allowed');
  const saved = await saveUpload(file, 'reviews');
  return json({ url: saved.url }, 201);
});
