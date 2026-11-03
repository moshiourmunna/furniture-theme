import { z } from 'zod';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, notFound, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { orderInclude } from '@/server/services/orders';

export const GET = api<{ id: string }>(async (req, { params }) => {
  await requireStaff(req, 'orders.read');
  const o = await prisma.order.findUnique({ where: { id: Number((await params).id) }, include: { ...orderInclude, user: { select: { id: true, name: true, email: true, phone: true, tier: true } } } });
  if (!o) throw notFound('Order not found');
  const actors = await prisma.user.findMany({ where: { id: { in: o.history.map((h) => h.actorId).filter((x): x is number => !!x) } }, select: { id: true, name: true } });
  return json({ ...o, actors: Object.fromEntries(actors.map((a) => [a.id, a.name])) });
});

/** Edit delivery details / notes (not money or items). */
export const PATCH = api<{ id: string }>(async (req, { params }) => {
  const user = await requireStaff(req, 'orders.write');
  const id = Number((await params).id);
  const d = await readJson(req, z.object({ deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), deliverySlot: z.enum(['morning', 'afternoon', 'evening']).optional(), notes: z.string().max(500).optional() }));
  const o = await prisma.order.update({ where: { id }, data: { ...d, deliveryDate: d.deliveryDate ? new Date(`${d.deliveryDate}T00:00:00+06:00`) : undefined } });
  await audit(req, user.id, 'update', 'order', id, `Updated delivery details for ${o.orderNo}`);
  return json(o);
});
