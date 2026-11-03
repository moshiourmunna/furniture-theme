import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json } from '@/server/http';
import { requireUser } from '@/server/auth';

export const GET = api(async (req) => {
  const user = await requireUser(req);
  const [reviews, toReview] = await Promise.all([
    prisma.review.findMany({ where: { userId: user.id }, include: { product: { select: { slug: true, nameEn: true, nameBn: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.orderItem.findMany({ where: { order: { userId: user.id, status: 'DELIVERED' }, product: { reviews: { none: { userId: user.id } } } }, include: { product: { select: { slug: true, nameEn: true, nameBn: true } } }, distinct: ['productId'] }),
  ]);
  return json({ items: reviews, pending: toReview });
});
