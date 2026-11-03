import { api } from '@/server/route';
import { json } from '@/server/http';
import { getUser, publicUser } from '@/server/auth';

export const GET = api(async (req) => {
  const u = await getUser(req, 'store');
  return json({ user: u ? publicUser(u) : null });
});
