import { prisma } from '@shekor/db';
import { registerSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { conflict, json, readJson } from '@/server/http';
import { hashPassword, issueOtp } from '@/server/auth';
import { rateLimit } from '@/server/security';
import { sendOtp } from '@/server/notify';
import { env } from '@/server/env';

export const POST = api(async (req) => {
  rateLimit(req, 'register', 5, 10 * 60_000);
  const d = await readJson(req, registerSchema);
  const exists = await prisma.user.findFirst({ where: { OR: [{ phone: d.phone }, ...(d.email ? [{ email: d.email }] : [])] } });
  if (exists) throw conflict('An account with this phone or email already exists — sign in instead');
  await prisma.user.create({ data: { name: d.name, phone: d.phone, email: d.email ?? null, passwordHash: await hashPassword(d.password), marketingOptIn: d.marketingOptIn } });
  const code = await issueOtp(d.phone, 'verify');
  await sendOtp(d.phone, code);
  return json({ next: 'verify', target: d.phone, ...(env.exposeDevOtp ? { devOtp: code } : {}) }, 201);
});
