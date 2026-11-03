import { api } from '@/server/route';
import { intParam, json } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { dashboard } from '@/server/admin/reports';

export const GET = api(async (req) => {
  await requireStaff(req, 'dashboard.read');
  return json(await dashboard(intParam(new URL(req.url).searchParams.get('range'), 30, 7, 365)));
});
