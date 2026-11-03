import { prisma } from '@shekor/db';
import { reviewSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { json, notFound, readJson } from '@/server/http';
import { requireUser } from '@/server/auth';
import { rateLimit } from '@/server/security';

export const GET = api<{ slug: string }>(async (req, { params }) => {
  const p = await prisma.product.findUnique({ where: { slug: (await params).slug }, select: { id: true } });
  if (!p) throw notFound();
  const sp = new URL(req.url).searchParams;
  const rating = Number(sp.get('rating')) || undefined;
  const withPhotos = sp.get('photos') === '1';
  const reviews = await prisma.review.findMany({ where: { productId: p.id, status: 'approved', ...(rating ? { rating } : {}) }, orderBy: { createdAt: 'desc' }, take: 50 });
  return json({ items: withPhotos ? reviews.filter((r) => Array.isArray(r.photos) && (r.photos as unknown[]).length) : reviews });
});

/** Signed-in customers can review; verified-buyer badge if they have a delivered order with this product. Goes to moderation. */
export const POST = api<{ slug: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  rateLimit(req, 'review', 5, 60 * 60_000, String(user.id));
  const body = await readJson(req, reviewSchema);
  const p = await prisma.product.findUnique({ where: { slug: (await params).slug }, select: { id: true } });
  if (!p) throw notFound();
  const bought = await prisma.orderItem.count({ where: { productId: p.id, order: { userId: user.id, status: 'DELIVERED' } } });
  const r = await prisma.review.create({
    data: { productId: p.id, userId: user.id, authorName: user.name, location: body.location, rating: body.rating, title: body.title, body: body.body, photos: body.photos ?? [], verified: bought > 0, status: 'pending' },
  });
  return json({ review: r, message: 'Thank you — your review will appear after moderation.' }, 201);
});
