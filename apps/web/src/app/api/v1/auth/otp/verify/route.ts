import { prisma } from '@shekor/db';
import { otpVerifySchema } from '@shekor/shared';
import { api } from '@/server/route';
import { ApiError, json, readJson } from '@/server/http';
import { classifyIdentifier, createSession, findByIdentifier, publicUser, verifyOtp } from '@/server/auth';
import { rateLimit } from '@/server/security';

/** Verifies a login/verify OTP and signs the customer in. (Reset codes are consumed by /auth/password/reset.) */
export const POST = api(async (req) => {
  rateLimit(req, 'otp-verify', 15, 10 * 60_000);
  const d = await readJson(req, otpVerifySchema);
  if (d.purpose === 'reset') throw new ApiError(400, 'bad_request', 'Use /auth/password/reset for reset codes');
  const id = classifyIdentifier(d.target);
  const user = await findByIdentifier(id);
  if (!user || !(await verifyOtp(id.value, d.purpose, d.code))) throw new ApiError(401, 'invalid_otp', 'That code is incorrect or has expired');
  const updated = await prisma.user.update({ where: { id: user.id }, data: id.kind === 'phone' ? { phoneVerified: user.phoneVerified ?? new Date() } : { emailVerified: user.emailVerified ?? new Date() } });
  const res = json({ user: publicUser(updated) });
  await createSession(res, req, user.id, 'store');
  return res;
});
