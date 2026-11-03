import 'server-only';
import { prisma, type Prisma } from '@shekor/db';

export const PAGE_SIZE = 24;
export const SORTS = ['featured', 'newest', 'price-asc', 'price-desc', 'rating', 'bestselling'] as const;
export type Sort = (typeof SORTS)[number];

export interface ProductFilters {
  q?: string;
  category?: string[];
  room?: string[];
  material?: string[];
  brand?: string[];
  collection?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sale?: boolean;
  emi?: boolean;
  rating?: number;
  ids?: number[];
  sort?: Sort;
  page?: number;
  pageSize?: number;
}

const list = (v: string | string[] | null | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(',') : []).map((s) => s.trim()).filter(Boolean).slice(0, 20);
const num = (v: string | null | undefined) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

/** Parse filters from URLSearchParams or a Next.js searchParams object. */
export function parseFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): ProductFilters {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.getAll(k).join(',') || null : (sp[k] as string | string[] | undefined) ?? null);
  const one = (k: string) => { const v = get(k); return Array.isArray(v) ? v[0] : v; };
  const sort = one('sort') as Sort;
  return {
    q: one('q')?.slice(0, 100) || undefined,
    category: list(get('category')), room: list(get('room')), material: list(get('material')), brand: list(get('brand')), collection: list(get('collection')),
    minPrice: num(one('minPrice')), maxPrice: num(one('maxPrice')),
    inStock: one('inStock') === '1', sale: one('sale') === '1', emi: one('emi') === '1',
    rating: num(one('rating')), ids: list(get('ids')).map(Number).filter(Number.isFinite),
    sort: SORTS.includes(sort) ? sort : 'featured', page: Math.max(1, num(one('page')) ?? 1),
  };
}

function where(f: ProductFilters, omit?: 'category' | 'material' | 'brand' | 'room'): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (f.q) {
    const terms = f.q.split(/\s+/).filter(Boolean).slice(0, 5);
    for (const t of terms)
      and.push({ OR: [{ nameEn: { contains: t } }, { nameBn: { contains: t } }, { category: { nameEn: { contains: t } } }, { category: { nameBn: { contains: t } } }, { material: { nameEn: { contains: t } } }, { collection: { nameEn: { contains: t } } }, { sku: { contains: t } }] });
  }
  if (f.category?.length && omit !== 'category') and.push({ category: { slug: { in: f.category } } });
  if (f.room?.length && omit !== 'room') and.push({ room: { slug: { in: f.room } } });
  if (f.material?.length && omit !== 'material') and.push({ material: { slug: { in: f.material } } });
  if (f.brand?.length && omit !== 'brand') and.push({ brand: { slug: { in: f.brand } } });
  if (f.collection?.length) and.push({ collection: { slug: { in: f.collection } } });
  if (f.minPrice != null) and.push({ price: { gte: f.minPrice } });
  if (f.maxPrice != null) and.push({ price: { lte: f.maxPrice } });
  if (f.inStock) and.push({ stockStatus: { in: ['IN_STOCK', 'LOW'] } });
  if (f.sale) and.push({ compareAtPrice: { not: null } });
  if (f.emi) and.push({ emiAvailable: true });
  if (f.rating) and.push({ ratingAvg: { gte: f.rating } });
  if (f.ids?.length) and.push({ id: { in: f.ids } });
  return { AND: and };
}

const ORDER: Record<Sort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: 'desc' }, { soldCount: 'desc' }, { id: 'asc' }],
  newest: [{ publishedAt: 'desc' }, { id: 'desc' }],
  'price-asc': [{ price: 'asc' }, { id: 'asc' }],
  'price-desc': [{ price: 'desc' }, { id: 'asc' }],
  rating: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
  bestselling: [{ soldCount: 'desc' }, { id: 'asc' }],
};

export const cardInclude = {
  images: { orderBy: { sortOrder: 'asc' }, take: 2 },
  material: true,
  variants: { orderBy: { sortOrder: 'asc' }, select: { id: true, swatchHex: true, nameEn: true, nameBn: true, isDefault: true, stockQty: true, priceDelta: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;
export function toCard(p: CardRow) {
  return {
    id: p.id, slug: p.slug, sku: p.sku, nameEn: p.nameEn, nameBn: p.nameBn, price: p.price, compareAtPrice: p.compareAtPrice, badge: p.badge,
    stockStatus: p.stockStatus, leadTimeDays: p.leadTimeDays, ratingAvg: Number(p.ratingAvg), ratingCount: p.ratingCount, emiAvailable: p.emiAvailable,
    image: p.images[0]?.url ?? null, altImage: p.images[1]?.url ?? null,
    materialEn: p.material?.nameEn ?? null, materialBn: p.material?.nameBn ?? null,
    swatches: p.variants.map((v) => ({ id: v.id, hex: v.swatchHex, nameEn: v.nameEn, nameBn: v.nameBn })),
    defaultVariantId: (p.variants.find((v) => v.isDefault) ?? p.variants[0])?.id ?? null,
    widthCm: p.widthCm, depthCm: p.depthCm, heightCm: p.heightCm, seats: p.seats, warrantyYears: p.warrantyYears,
  };
}
export type ProductCardDTO = ReturnType<typeof toCard>;

export async function listProducts(f: ProductFilters) {
  const pageSize = Math.min(48, f.pageSize ?? PAGE_SIZE);
  const page = f.page ?? 1;
  const w = where(f);
  const [total, rows, priceAgg] = await Promise.all([
    prisma.product.count({ where: w }),
    prisma.product.findMany({ where: w, include: cardInclude, orderBy: ORDER[f.sort ?? 'featured'], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.product.aggregate({ where: { isActive: true }, _min: { price: true }, _max: { price: true } }),
  ]);
  return { items: rows.map(toCard), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)), priceRange: { min: priceAgg._min.price ?? 0, max: priceAgg._max.price ?? 0 } };
}

/** Facet counts — each facet ignores its own selection (standard multi-select faceting). */
export async function facetCounts(f: ProductFilters) {
  const [cats, mats, brands, rooms] = await Promise.all([
    prisma.product.groupBy({ by: ['categoryId'], where: where(f, 'category'), _count: true }),
    prisma.product.groupBy({ by: ['materialId'], where: where(f, 'material'), _count: true }),
    prisma.product.groupBy({ by: ['brandId'], where: where(f, 'brand'), _count: true }),
    prisma.product.groupBy({ by: ['roomId'], where: where(f, 'room'), _count: true }),
  ]);
  const m = (rows: { _count: number }[], key: string) => Object.fromEntries(rows.map((r) => [(r as unknown as Record<string, number>)[key], r._count]));
  return { category: m(cats, 'categoryId'), material: m(mats, 'materialId'), brand: m(brands, 'brandId'), room: m(rooms, 'roomId') };
}

export async function taxonomy() {
  const [categories, rooms, materials, brands, collections] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.room.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.material.findMany({ orderBy: { nameEn: 'asc' } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.collection.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);
  return { categories, rooms, materials, brands, collections };
}

export async function getProduct(slug: string) {
  const p = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } }, variants: { orderBy: { sortOrder: 'asc' } }, category: true, room: true, material: true, brand: true,
      collection: { include: { designer: true } },
    },
  });
  if (!p) return null;
  const [reviews, ratingDist, related] = await Promise.all([
    prisma.review.findMany({ where: { productId: p.id, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.review.groupBy({ by: ['rating'], where: { productId: p.id, status: 'approved' }, _count: true }),
    prisma.product.findMany({ where: { isActive: true, id: { not: p.id }, OR: [{ categoryId: p.categoryId }, ...(p.collectionId ? [{ collectionId: p.collectionId }] : [])] }, include: cardInclude, take: 4, orderBy: { soldCount: 'desc' } }),
  ]);
  return {
    ...p, ratingAvg: Number(p.ratingAvg), weightKg: p.weightKg ? Number(p.weightKg) : null,
    reviews, ratingDist: Object.fromEntries(ratingDist.map((r) => [r.rating, r._count])), related: related.map(toCard),
  };
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export async function suggest(q: string) {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return { products: [], categories: [], collections: [] };
  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, OR: [{ nameEn: { contains: term } }, { nameBn: { contains: term } }] }, include: cardInclude, take: 6, orderBy: { soldCount: 'desc' } }),
    prisma.category.findMany({ where: { OR: [{ nameEn: { contains: term } }, { nameBn: { contains: term } }] }, take: 4 }),
    prisma.collection.findMany({ where: { OR: [{ nameEn: { contains: term } }, { nameBn: { contains: term } }] }, take: 3 }),
  ]);
  return { products: products.map(toCard), categories, collections };
}
