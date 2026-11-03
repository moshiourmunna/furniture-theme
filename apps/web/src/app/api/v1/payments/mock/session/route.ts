import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, notFound } from '@/server/http';

/** Details for the simulated gateway page. */
export const GET = api(async (req) => {
  const id = new URL(req.url).searchParams.get('session') ?? '';
  const p = await prisma.payment.findUnique({ where: { sessionId: id }, include: { order: { select: { orderNo: true, customerName: true, total: true, locale: true } } } });
  if (!p) throw notFound('Payment session not found');
  return json({ provider: p.provider, amount: p.amount, status: p.status, kind: p.kind, order: p.order });
});
