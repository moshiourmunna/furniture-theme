import { z } from 'zod';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { ApiError, json, readJson } from '@/server/http';
import { classifyIdentifier, createSession, findByIdentifier, verifyPassword } from '@/server/auth';
import { rateLimit } from '@/server/security';
import { audit } from '@/server/audit';

export const POST = api(async (req) => {
  rateLimit(req, 'admin-login', 8, 15 * 60_000);
  const d = await readJson(req, z.object({ identifier: z.string().trim().min(3).max(191), password: z.string().min(1).max(72) }));
  const id = classifyIdentifier(d.identifier);
  const user = await findByIdentifier(id);
  const ok = await verifyPassword(d.password, user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok || user.kind !== 'STAFF' || !user.isActive) {
    await audit(req, user?.id ?? null, 'login_failed', 'auth', null, `Failed admin login for ${id.value}`);
    throw new ApiError(401, 'invalid_credentials', 'Incorrect email or password');
  }
  const role = user.roleId ? await prisma.role.findUnique({ where: { id: user.roleId }, include: { permissions: { include: { permission: true } } } }) : null;
  const res = json({ user: { id: user.id, name: user.name, email: user.email, role: role?.name ?? null, permissions: role?.permissions.map((p) => p.permission.code) ?? [] } });
  await createSession(res, req, user.id, 'admin');
  await audit(req, user.id, 'login', 'auth', user.id, 'Admin signed in');
  await prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
  return res;
});
