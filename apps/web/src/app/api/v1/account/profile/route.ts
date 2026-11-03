import { prisma } from '@shekor/db';
import { profileSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { conflict, json, readJson } from '@/server/http';
import { publicUser, requireUser } from '@/server/auth';

export const GET = api(async (req) => json({ user: publicUser(await requireUser(req)) }));

export const PATCH = api(async (req) => {
  const user = await requireUser(req);
  const d = await readJson(req, profileSchema);
  if (d.email && d.email !== user.email && (await prisma.user.findUnique({ where: { email: d.email } }))) throw conflict('This email is already used by another account');
  const u = await prisma.user.update({ where: { id: user.id }, data: { ...d, email: d.email ?? user.email, ...(d.email && d.email !== user.email ? { emailVerified: null } : {}) } });
  return json({ user: publicUser(u) });
});

/** Account deletion: anonymises personal data, keeps order records for accounting. */
export const DELETE = api(async (req) => {
  const user = await requireUser(req);
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.address.deleteMany({ where: { userId: user.id } }),
    prisma.wishlistItem.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({ where: { id: user.id }, data: { isActive: false, name: 'Deleted user', email: null, phone: null, passwordHash: null } }),
  ]);
  const res = json({ ok: true });
  res.cookies.set('shekor_sid', '', { path: '/', maxAge: 0 });
  return res;
});
