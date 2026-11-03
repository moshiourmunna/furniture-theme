import { otpRequestSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { classifyIdentifier, findByIdentifier, issueOtp } from '@/server/auth';
import { rateLimit } from '@/server/security';
import { sendOtp } from '@/server/notify';
import { env } from '@/server/env';

/** Sends a 6-digit code by SMS (phone) or email. Response never reveals whether the account exists. */
export const POST = api(async (req) => {
  rateLimit(req, 'otp-ip', 10, 10 * 60_000);
  const d = await readJson(req, otpRequestSchema);
  const id = classifyIdentifier(d.target);
  rateLimit(req, 'otp-target', 3, 10 * 60_000, `${id.value}:${d.purpose}`);
  const user = await findByIdentifier(id);
  let code: string | null = null;
  if (user && user.kind === 'CUSTOMER') {
    code = await issueOtp(id.value, d.purpose);
    await sendOtp(id.value, code, user.locale === 'bn' ? 'bn' : 'en');
  }
  return json({ sent: true, target: id.value, expiresIn: 300, ...(env.exposeDevOtp && code ? { devOtp: code } : {}) });
});
