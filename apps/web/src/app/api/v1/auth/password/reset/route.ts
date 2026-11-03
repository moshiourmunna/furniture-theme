import { prisma } from '@shekor/db';
import { resetPasswordSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { ApiError, json, readJson } from '@/server/http';
import { classifyIdentifier, findByIdentifier, hashPassword, verifyOtp } from '@/server/auth';
import { rateLimit } from '@/server/security';

export const POST = api(async (req) => {
  rateLimit(req, 'reset', 10, 10 * 60_000);
  const d = await readJson(req, resetPasswordSchema);
  const id = classifyIdentifier(d.target);
  const user = await findByIdentifier(id);
  if (!user || !(await verifyOtp(id.value, 'reset', d.code))) throw new ApiError(401, 'invalid_otp', 'That code is incorrect or has expired');
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(d.password) } }),
    prisma.session.deleteMany({ where: { userId: user.id } }), // sign out everywhere
  ]);
  return json({ ok: true });
});
