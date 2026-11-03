import { api } from '@/server/route';
import { json } from '@/server/http';
import { requireStaff } from '@/server/auth';

export const GET = api(async (req) => {
  const u = await requireStaff(req);
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.roleName, permissions: u.permissions } });
});
