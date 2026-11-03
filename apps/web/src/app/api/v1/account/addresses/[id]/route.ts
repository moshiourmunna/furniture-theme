import { prisma } from '@shekor/db';
import { addressSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { json, notFound, readJson } from '@/server/http';
import { requireUser } from '@/server/auth';

async function own(req: Request, id: string) {
  const user = await requireUser(req);
  const a = await prisma.address.findFirst({ where: { id: Number(id), userId: user.id } });
  if (!a) throw notFound('Address not found');
  return { user, a };
}

export const PUT = api<{ id: string }>(async (req, { params }) => {
  const { user, a } = await own(req, (await params).id);
  const d = await readJson(req, addressSchema);
  if (d.isDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  return json(await prisma.address.update({ where: { id: a.id }, data: d }));
});

export const DELETE = api<{ id: string }>(async (req, { params }) => {
  const { user, a } = await own(req, (await params).id);
  await prisma.address.delete({ where: { id: a.id } });
  if (a.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return json({ ok: true });
});
