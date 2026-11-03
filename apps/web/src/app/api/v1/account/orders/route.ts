import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json } from '@/server/http';
import { requireUser } from '@/server/auth';

export const GET = api(async (req) => {
  const user = await requireUser(req);
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { items: true } });
  return json({ items: orders });
});
