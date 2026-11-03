import { prisma } from '@shekor/db';
import { changePasswordSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { ApiError, json, readJson } from '@/server/http';
import { hashPassword, requireUser, verifyPassword } from '@/server/auth';
import { rateLimit } from '@/server/security';

export const POST = api(async (req) => {
  const user = await requireUser(req);
  rateLimit(req, 'pw-change', 5, 10 * 60_000, String(user.id));
  const d = await readJson(req, changePasswordSchema);
  if (!(await verifyPassword(d.currentPassword, user.passwordHash))) throw new ApiError(422, 'validation_error', 'Current password is incorrect', { fields: { currentPassword: 'incorrect' } });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(d.newPassword) } });
  return json({ ok: true });
});
