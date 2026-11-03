import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, notFound } from '@/server/http';
import { requireUser } from '@/server/auth';
import { orderInclude } from '@/server/services/orders';

export const GET = api<{ orderNo: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const o = await prisma.order.findFirst({ where: { orderNo: (await params).orderNo, userId: user.id }, include: orderInclude });
  if (!o) throw notFound('Order not found');
  return json(o);
});
