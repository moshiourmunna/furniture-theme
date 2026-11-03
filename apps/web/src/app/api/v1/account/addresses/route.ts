import { prisma } from '@shekor/db';
import { addressSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { badRequest, json, readJson } from '@/server/http';
import { requireUser } from '@/server/auth';

export const GET = api(async (req) => {
  const user = await requireUser(req);
  return json({ items: await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }) });
});

export const POST = api(async (req) => {
  const user = await requireUser(req);
  const d = await readJson(req, addressSchema);
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) throw badRequest('You can save up to 10 addresses');
  const isDefault = d.isDefault || count === 0;
  if (isDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  return json(await prisma.address.create({ data: { ...d, isDefault, userId: user.id } }), 201);
});
