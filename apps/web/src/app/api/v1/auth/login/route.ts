import { loginSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { ApiError, json, readJson } from '@/server/http';
import { classifyIdentifier, createSession, findByIdentifier, publicUser, verifyPassword } from '@/server/auth';
import { rateLimit } from '@/server/security';

export const POST = api(async (req) => {
  rateLimit(req, 'login', 10, 10 * 60_000);
  const d = await readJson(req, loginSchema);
  const id = classifyIdentifier(d.identifier);
  rateLimit(req, 'login-id', 8, 10 * 60_000, id.value);
  const user = await findByIdentifier(id);
  const ok = await verifyPassword(d.password, user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok || !user.isActive || user.kind !== 'CUSTOMER') throw new ApiError(401, 'invalid_credentials', 'Incorrect email/phone or password');
  const res = json({ user: publicUser(user) });
  await createSession(res, req, user.id, 'store');
  return res;
});
