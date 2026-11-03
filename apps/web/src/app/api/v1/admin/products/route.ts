import { prisma, type Prisma } from '@shekor/db';
import { api } from '@/server/route';
import { intParam, json, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { revalidateStorefront } from '@/server/revalidate';
import { productInput, saveProduct } from '@/server/admin/products';

export const GET = api(async (req) => {
  await requireStaff(req, 'products.read');
  const sp = new URL(req.url).searchParams;
  const page = intParam(sp.get('page'), 1);
  const pageSize = intParam(sp.get('pageSize'), 25, 1, 100);
  const q = sp.get('q')?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ nameEn: { contains: q } }, { nameBn: { contains: q } }, { sku: { contains: q } }] } : {}),
    ...(sp.get('categoryId') ? { categoryId: Number(sp.get('categoryId')) } : {}),
    ...(sp.get('status') === 'active' ? { isActive: true } : sp.get('status') === 'draft' ? { isActive: false } : {}),
    ...(sp.get('stock') ? { stockStatus: sp.get('stock') as Prisma.ProductWhereInput['stockStatus'] } : {}),
  };
  const sort = sp.get('sort') ?? 'updatedAt';
  const orderBy: Prisma.ProductOrderByWithRelationInput = ['price', 'nameEn', 'soldCount', 'updatedAt', 'createdAt'].includes(sort) ? { [sort]: sp.get('order') === 'asc' ? 'asc' : 'desc' } : { updatedAt: 'desc' };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { category: { select: { nameEn: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' } }, variants: { select: { stockQty: true } } } }),
    prisma.product.count({ where }),
  ]);
  return json({ items: items.map((p) => ({ ...p, stockTotal: p.variants.reduce((a, v) => a + v.stockQty, 0) })), total, page, pageSize });
});

export const POST = api(async (req) => {
  const user = await requireStaff(req, 'products.write');
  const input = await readJson(req, productInput);
  const p = await saveProduct(input);
  await audit(req, user.id, 'create', 'product', p!.id, `Created ${p!.nameEn}`);
  revalidateStorefront();
  return json(p, 201);
});
