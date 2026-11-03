import { prisma, type Prisma } from '@shekor/db';
import { api } from '@/server/route';
import { intParam, json } from '@/server/http';
import { requireStaff } from '@/server/auth';

export const GET = api(async (req) => {
  await requireStaff(req, 'customers.read');
  const sp = new URL(req.url).searchParams;
  const page = intParam(sp.get('page'), 1);
  const q = sp.get('q')?.trim();
  const where: Prisma.UserWhereInput = { kind: 'CUSTOMER', ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}), ...(sp.get('tier') ? { tier: sp.get('tier')! } : {}) };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 25, take: 25, select: { id: true, name: true, email: true, phone: true, tier: true, loyaltyPoints: true, isActive: true, createdAt: true, lastLoginAt: true, _count: { select: { orders: true } } } }),
    prisma.user.count({ where }),
  ]);
  const spend = await prisma.order.groupBy({ by: ['userId'], where: { userId: { in: users.map((u) => u.id) }, status: { notIn: ['CANCELLED', 'RETURNED'] } }, _sum: { total: true } });
  const m = Object.fromEntries(spend.map((s) => [s.userId, s._sum.total ?? 0]));
  return json({ items: users.map((u) => ({ ...u, lifetimeValue: m[u.id] ?? 0 })), total, page, pageSize: 25 });
});
