import { z } from 'zod';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, notFound, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';

export const GET = api<{ id: string }>(async (req, { params }) => {
  await requireStaff(req, 'customers.read');
  const u = await prisma.user.findFirst({
    where: { id: Number((await params).id), kind: 'CUSTOMER' },
    select: { id: true, name: true, email: true, phone: true, tier: true, loyaltyPoints: true, isActive: true, createdAt: true, lastLoginAt: true, marketingOptIn: true, addresses: true, orders: { orderBy: { createdAt: 'desc' }, take: 50 }, reviews: { take: 20, orderBy: { createdAt: 'desc' } } },
  });
  if (!u) throw notFound('Customer not found');
  return json(u);
});

export const PATCH = api<{ id: string }>(async (req, { params }) => {
  const staff = await requireStaff(req, 'customers.write');
  const id = Number((await params).id);
  const d = await readJson(req, z.object({ isActive: z.boolean().optional(), pointsAdjust: z.number().int().min(-100000).max(100000).optional(), reason: z.string().max(120).optional() }));
  const u = await prisma.user.findFirst({ where: { id, kind: 'CUSTOMER' } });
  if (!u) throw notFound();
  if (d.isActive !== undefined) {
    await prisma.user.update({ where: { id }, data: { isActive: d.isActive } });
    if (!d.isActive) await prisma.session.deleteMany({ where: { userId: id } });
  }
  if (d.pointsAdjust) {
    await prisma.loyaltyTransaction.create({ data: { userId: id, points: d.pointsAdjust, reason: d.reason || 'Manual adjustment' } });
    await prisma.user.update({ where: { id }, data: { loyaltyPoints: { increment: d.pointsAdjust } } });
  }
  await audit(req, staff.id, 'update', 'customer', id, `Updated customer ${u.name}`, d);
  return json({ ok: true });
});
