import { api } from '@/server/route';
import { json } from '@/server/http';
import { suggest } from '@/server/services/catalog';
import { rateLimit } from '@/server/security';

export const GET = api(async (req) => {
  rateLimit(req, 'suggest', 120, 60_000);
  return json(await suggest(new URL(req.url).searchParams.get('q') ?? ''));
});
