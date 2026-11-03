import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json } from '@/server/http';
import { requireUser } from '@/server/auth';

export const GET = api(async (req) => {
  const user = await requireUser(req);
  const txns = await prisma.loyaltyTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  return json({ points: user.loyaltyPoints, tier: user.tier, transactions: txns });
});
