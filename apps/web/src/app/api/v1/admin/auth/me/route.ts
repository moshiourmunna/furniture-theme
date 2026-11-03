import { api } from '@/server/route';
import { json } from '@/server/http';
import { getUser } from '@/server/auth';

// Returns { user: null } (200) when signed out so the admin's boot check doesn't log a 401 on every visit to /login.
export const GET = api(async (req) => {
  const u = await getUser(req, 'admin');
  return json({ user: u ? { id: u.id, name: u.name, email: u.email, role: u.roleName, permissions: u.permissions } : null });
});
