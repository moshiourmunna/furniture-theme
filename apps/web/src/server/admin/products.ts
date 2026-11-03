import 'server-only';
import { z } from 'zod';
import { prisma, type Prisma } from '@shekor/db';
import { slugify } from '@shekor/shared';
import { cleanHtml } from '../sanitize';

const opt = (max: number) => z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
export const variantInput = z.object({
  id: z.number().int().positive().optional(),
  sku: z.string().trim().min(2).max(60),
  nameEn: z.string().trim().min(1).max(120),
  nameBn: z.string().trim().min(1).max(120),
  optionType: z.enum(['finish', 'fabric', 'size', 'colour']).default('finish'),
  swatchHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish(),
  priceDelta: z.coerce.number().int().default(0),
  stockQty: z.coerce.number().int().min(0).default(0),
  lowStockAt: z.coerce.number().int().min(0).default(3),
  isDefault: z.boolean().default(false),
});
export const productInput = z.object({
  slug: z.string().trim().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().or(z.literal('')),
  sku: z.string().trim().min(2).max(40),
  nameEn: z.string().trim().min(2).max(191),
  nameBn: z.string().trim().min(2).max(191),
  shortEn: opt(320), shortBn: opt(320), descriptionEn: opt(50000), descriptionBn: opt(50000),
  categoryId: z.coerce.number().int().positive(),
  roomId: z.coerce.number().int().positive().nullish(),
  materialId: z.coerce.number().int().positive().nullish(),
  brandId: z.coerce.number().int().positive().nullish(),
  collectionId: z.coerce.number().int().positive().nullish(),
  price: z.coerce.number().int().min(0).max(100_000_000),
  compareAtPrice: z.coerce.number().int().min(0).nullish(),
  badge: z.enum(['bestseller', 'new', 'sale', 'made']).nullish(),
  stockStatus: z.enum(['IN_STOCK', 'LOW', 'MADE_TO_ORDER', 'OUT_OF_STOCK']).default('IN_STOCK'),
  leadTimeDays: z.coerce.number().int().min(0).max(180).default(5),
  widthCm: z.coerce.number().int().min(0).nullish(), depthCm: z.coerce.number().int().min(0).nullish(), heightCm: z.coerce.number().int().min(0).nullish(),
  seats: z.coerce.number().int().min(0).nullish(),
  assemblyRequired: z.boolean().default(true), emiAvailable: z.boolean().default(true),
  warrantyYears: z.coerce.number().int().min(0).max(25).default(10),
  isActive: z.boolean().default(true), isFeatured: z.boolean().default(false),
  metaTitleEn: opt(191), metaTitleBn: opt(191), metaDescEn: opt(320), metaDescBn: opt(320),
  images: z.array(z.object({ url: z.string().trim().min(1).max(255), altEn: opt(191), altBn: opt(191) })).max(20).default([]),
  variants: z.array(variantInput).min(1, 'Add at least one variant').max(30),
}).refine((p) => p.compareAtPrice == null || p.compareAtPrice > p.price, { message: 'Compare-at price must be higher than the price', path: ['compareAtPrice'] });
export type ProductInput = z.infer<typeof productInput>;

export const adminProductInclude = { images: { orderBy: { sortOrder: 'asc' } }, variants: { orderBy: { sortOrder: 'asc' } }, category: true, brand: true, collection: true } satisfies Prisma.ProductInclude;

export async function saveProduct(input: ProductInput, id?: number) {
  const { images, variants, ...rest } = input;
  const slug = rest.slug || slugify(rest.nameEn);
  const data = { ...rest, slug, descriptionEn: rest.descriptionEn ? cleanHtml(rest.descriptionEn) : null, descriptionBn: rest.descriptionBn ? cleanHtml(rest.descriptionBn) : null };
  if (!variants.some((v) => v.isDefault)) variants[0].isDefault = true;
  return prisma.$transaction(async (tx) => {
    const p = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
    await tx.productImage.deleteMany({ where: { productId: p.id } });
    if (images.length) await tx.productImage.createMany({ data: images.map((im, i) => ({ ...im, productId: p.id, sortOrder: i })) });
    const keep = variants.filter((v) => v.id).map((v) => v.id!);
    await tx.productVariant.deleteMany({ where: { productId: p.id, id: { notIn: keep.length ? keep : [0] } } });
    for (const [i, v] of variants.entries()) {
      const { id: vid, ...vd } = v;
      const before = vid ? await tx.productVariant.findFirst({ where: { id: vid, productId: p.id } }) : null;
      if (before) {
        await tx.productVariant.update({ where: { id: before.id }, data: { ...vd, sortOrder: i } });
        if (before.stockQty !== vd.stockQty) await tx.stockMovement.create({ data: { variantId: before.id, delta: vd.stockQty - before.stockQty, reason: 'adjustment', ref: 'product-edit' } });
      } else {
        const nv = await tx.productVariant.create({ data: { ...vd, productId: p.id, sortOrder: i } });
        if (vd.stockQty) await tx.stockMovement.create({ data: { variantId: nv.id, delta: vd.stockQty, reason: 'restock', ref: 'product-create' } });
      }
    }
    return tx.product.findUnique({ where: { id: p.id }, include: adminProductInclude });
  });
}
