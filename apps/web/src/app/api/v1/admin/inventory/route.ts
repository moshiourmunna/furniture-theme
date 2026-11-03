import { z } from 'zod';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { badRequest, intParam, json, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { revalidateStorefront } from '@/server/revalidate';

export const GET = api(async (req) => {
  await requireStaff(req, 'inventory.read');
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q')?.trim();
  const low = sp.get('low') === '1';
  const page = intParam(sp.get('page'), 1);
  const where = {
    ...(q ? { OR: [{ sku: { contains: q } }, { product: { nameEn: { contains: q } } }] } : {}),
    ...(low ? { stockQty: { lte: 3 }, product: { stockStatus: { not: 'MADE_TO_ORDER' as const } } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.productVariant.findMany({ where, include: { product: { select: { id: true, nameEn: true, stockStatus: true } }, movements: { orderBy: { createdAt: 'desc' }, take: 3 } }, orderBy: { stockQty: 'asc' }, skip: (page - 1) * 50, take: 50 }),
    prisma.productVariant.count({ where }),
  ]);
  return json({ items, total, page, pageSize: 50 });
});

/** POST: stock adjustment with reason; writes a stock movement + audit log. */
export const POST = api(async (req) => {
  const user = await requireStaff(req, 'inventory.write');
  const d = await readJson(req, z.object({ variantId: z.number().int().positive(), delta: z.number().int().min(-10000).max(10000), reason: z.enum(['adjustment', 'restock', 'damage', 'transfer']) }));
  const v = await prisma.productVariant.findUnique({ where: { id: d.variantId } });
  if (!v) throw badRequest('Variant not found');
  if (v.stockQty + d.delta < 0) throw badRequest('Stock cannot go below zero');
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.productVariant.update({ where: { id: v.id }, data: { stockQty: { increment: d.delta } } });
    await tx.stockMovement.create({ data: { variantId: v.id, delta: d.delta, reason: d.reason, ref: `staff:${user.id}` } });
    return u;
  });
  await audit(req, user.id, 'stock_adjust', 'variant', v.id, `${v.sku} ${d.delta > 0 ? '+' : ''}${d.delta} (${d.reason})`);
  revalidateStorefront();
  return json(updated);
});
