import { prisma } from '@shekor/db';
import { BD_DIVISIONS, ORDER_STATUSES, ORDER_TRANSITIONS } from '@shekor/shared';
import { api } from '@/server/route';
import { json } from '@/server/http';
import { requireStaff } from '@/server/auth';

/** Select options for admin forms. */
export const GET = api(async (req) => {
  await requireStaff(req);
  const sel = { id: true, slug: true, nameEn: true } as const;
  const [categories, brands, collections, designers, rooms, materials, showrooms, products] = await Promise.all([
    prisma.category.findMany({ select: sel, orderBy: { sortOrder: 'asc' } }),
    prisma.brand.findMany({ select: sel, orderBy: { sortOrder: 'asc' } }),
    prisma.collection.findMany({ select: sel, orderBy: { sortOrder: 'asc' } }),
    prisma.designer.findMany({ select: sel, orderBy: { sortOrder: 'asc' } }),
    prisma.room.findMany({ select: sel, orderBy: { sortOrder: 'asc' } }),
    prisma.material.findMany({ select: sel, orderBy: { nameEn: 'asc' } }),
    prisma.showroom.findMany({ select: sel, orderBy: { sortOrder: 'asc' } }),
    prisma.product.findMany({ select: { id: true, slug: true, nameEn: true }, orderBy: { nameEn: 'asc' } }),
  ]);
  return json({ categories, brands, collections, designers, rooms, materials, showrooms, products, divisions: BD_DIVISIONS, orderStatuses: ORDER_STATUSES, transitions: ORDER_TRANSITIONS });
});
