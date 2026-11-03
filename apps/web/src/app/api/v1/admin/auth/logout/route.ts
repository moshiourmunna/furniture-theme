import { api } from '@/server/route';
import { json } from '@/server/http';
import { destroySession } from '@/server/auth';

export const POST = api(async (req) => {
  const res = json({ ok: true });
  await destroySession(res, req, 'admin');
  return res;
});
