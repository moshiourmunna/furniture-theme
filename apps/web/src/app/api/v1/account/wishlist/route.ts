import { z } from 'zod';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { requireUser } from '@/server/auth';
import { cardInclude, toCard } from '@/server/services/catalog';

export const GET = api(async (req) => {
  const user = await requireUser(req);
  const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, include: { product: { include: cardInclude } }, orderBy: { createdAt: 'desc' } });
  return json({ items: items.map((i) => toCard(i.product)) });
});

/** Add one or many (merges the guest wishlist after sign-in). */
export const POST = api(async (req) => {
  const user = await requireUser(req);
  const { productIds } = await readJson(req, z.object({ productIds: z.array(z.number().int().positive()).min(1).max(100) }));
  const valid = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  await prisma.wishlistItem.createMany({ data: valid.map((p) => ({ userId: user.id, productId: p.id })), skipDuplicates: true });
  return json({ ok: true });
});

export const DELETE = api(async (req) => {
  const user = await requireUser(req);
  const id = Number(new URL(req.url).searchParams.get('productId'));
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId: id } });
  return json({ ok: true });
});
