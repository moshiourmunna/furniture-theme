import { prisma, type Prisma, type OrderStatus } from '@shekor/db';
import { ORDER_STATUSES } from '@shekor/shared';
import { api } from '@/server/route';
import { intParam, json } from '@/server/http';
import { requireStaff } from '@/server/auth';

export const GET = api(async (req) => {
  await requireStaff(req, 'orders.read');
  const sp = new URL(req.url).searchParams;
  const page = intParam(sp.get('page'), 1);
  const pageSize = intParam(sp.get('pageSize'), 25, 1, 100);
  const q = sp.get('q')?.trim();
  const status = sp.get('status');
  const where: Prisma.OrderWhereInput = {
    ...(q ? { OR: [{ orderNo: { contains: q } }, { customerName: { contains: q } }, { phone: { contains: q } }] } : {}),
    ...(status && (ORDER_STATUSES as readonly string[]).includes(status) ? { status: status as OrderStatus } : {}),
    ...(sp.get('payment') ? { paymentMethod: sp.get('payment')! } : {}),
    ...(sp.get('paymentStatus') ? { paymentStatus: sp.get('paymentStatus') as Prisma.OrderWhereInput['paymentStatus'] } : {}),
  };
  const [items, total, counts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { items: true } } } }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
  ]);
  return json({ items, total, page, pageSize, statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count])) });
});
