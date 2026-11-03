import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, notFound, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { revalidateStorefront } from '@/server/revalidate';
import { adminProductInclude, productInput, saveProduct } from '@/server/admin/products';

export const GET = api<{ id: string }>(async (req, { params }) => {
  await requireStaff(req, 'products.read');
  const p = await prisma.product.findUnique({ where: { id: Number((await params).id) }, include: adminProductInclude });
  if (!p) throw notFound('Product not found');
  return json(p);
});

export const PUT = api<{ id: string }>(async (req, { params }) => {
  const user = await requireStaff(req, 'products.write');
  const id = Number((await params).id);
  if (!(await prisma.product.findUnique({ where: { id } }))) throw notFound('Product not found');
  const p = await saveProduct(await readJson(req, productInput), id);
  await audit(req, user.id, 'update', 'product', id, `Updated ${p!.nameEn}`);
  revalidateStorefront([`/p/${p!.slug}`]);
  return json(p);
});

/** Products with order history are archived (deactivated) instead of hard-deleted. */
export const DELETE = api<{ id: string }>(async (req, { params }) => {
  const user = await requireStaff(req, 'products.write');
  const id = Number((await params).id);
  const p = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!p) throw notFound('Product not found');
  if (p._count.orderItems) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    await audit(req, user.id, 'archive', 'product', id, `Archived ${p.nameEn} (has orders)`);
    revalidateStorefront();
    return json({ ok: true, archived: true });
  }
  await prisma.product.delete({ where: { id } });
  await audit(req, user.id, 'delete', 'product', id, `Deleted ${p.nameEn}`);
  revalidateStorefront();
  return json({ ok: true, archived: false });
});
