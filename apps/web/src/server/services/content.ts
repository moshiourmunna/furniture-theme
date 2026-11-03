import 'server-only';
import { prisma } from '@shekor/db';
import { cardInclude, toCard } from './catalog';

export const GALLERY_FACETS = ['category', 'brand', 'collection', 'room', 'material', 'type'] as const;
export type GalleryFacet = (typeof GALLERY_FACETS)[number];

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as {
    store?: { name: string; legalName: string; phone: string; whatsapp: string; email: string; address: string; tradeLicence: string; bin: string };
    seo?: { titleEn: string; titleBn: string; descriptionEn: string; descriptionBn: string; ogImage: string; twitter: string };
    social?: Record<string, string>;
    payments?: Record<string, boolean | number>;
    [k: string]: unknown;
  };
}

export const listBanners = (placement: string) => {
  const now = new Date();
  return prisma.banner.findMany({
    where: { placement, isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    orderBy: { sortOrder: 'asc' },
  });
};

export const listCollections = () => prisma.collection.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: { brand: true, designer: true, _count: { select: { products: true } } } });
export async function getCollection(slug: string) {
  const c = await prisma.collection.findFirst({ where: { slug, isActive: true }, include: { brand: true, designer: true } });
  if (!c) return null;
  const [products, projects, catalogue] = await Promise.all([
    prisma.product.findMany({ where: { collectionId: c.id, isActive: true }, include: cardInclude, orderBy: { soldCount: 'desc' } }),
    prisma.project.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.catalogue.findFirst({ where: { kind: 'collection', ref: slug, isActive: true } }),
  ]);
  return { ...c, products: products.map(toCard), projects: projects.filter((p) => ((p.collectionSlugs as string[]) ?? []).includes(slug)), catalogue };
}

export const listBrands = () => prisma.brand.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true, collections: true } } } });
export async function getBrand(slug: string) {
  const b = await prisma.brand.findFirst({ where: { slug, isActive: true }, include: { collections: { where: { isActive: true } } } });
  if (!b) return null;
  const [products, gallery, catalogue] = await Promise.all([
    prisma.product.findMany({ where: { brandId: b.id, isActive: true }, include: cardInclude, orderBy: { soldCount: 'desc' }, take: 12 }),
    prisma.galleryItem.findMany({ where: { brandSlug: slug, isActive: true }, take: 6, orderBy: { sortOrder: 'asc' } }),
    prisma.catalogue.findFirst({ where: { kind: 'brand', ref: slug, isActive: true } }),
  ]);
  return { ...b, products: products.map(toCard), gallery, catalogue };
}

export const listDesigners = () => prisma.designer.findMany({ orderBy: { sortOrder: 'asc' }, include: { collections: true } });

export const listProjects = (type?: string) =>
  prisma.project.findMany({ where: { isActive: true, ...(type ? { type } : {}) }, orderBy: { sortOrder: 'asc' } });
export async function getProject(slug: string) {
  const p = await prisma.project.findFirst({ where: { slug, isActive: true } });
  if (!p) return null;
  const slugs = (p.collectionSlugs as string[]) ?? [];
  const [collections, products, more] = await Promise.all([
    prisma.collection.findMany({ where: { slug: { in: slugs } } }),
    prisma.product.findMany({ where: { isActive: true, collection: { slug: { in: slugs } } }, include: cardInclude, take: 4, orderBy: { soldCount: 'desc' } }),
    prisma.project.findMany({ where: { isActive: true, id: { not: p.id } }, take: 3, orderBy: { sortOrder: 'asc' } }),
  ]);
  return { ...p, collections, products: products.map(toCard), more };
}

export async function listGallery(filter: Partial<Record<GalleryFacet, string>>) {
  const items = await prisma.galleryItem.findMany({
    where: {
      isActive: true,
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.brand ? { brandSlug: filter.brand } : {}),
      ...(filter.collection ? { collectionSlug: filter.collection } : {}),
      ...(filter.room ? { room: filter.room } : {}),
      ...(filter.material ? { material: filter.material } : {}),
      ...(filter.type ? { projectType: filter.type } : {}),
    },
    include: { product: { select: { slug: true, nameEn: true, nameBn: true, price: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  return items;
}

export const listCatalogues = () => prisma.catalogue.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
export const getCatalogue = (slug: string) => prisma.catalogue.findFirst({ where: { slug, isActive: true } });

export const listShowrooms = () => prisma.showroom.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
export const listPosts = (take = 50) => prisma.blogPost.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take });
export const getPost = (slug: string) => prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
export const getPage = (slug: string) => prisma.page.findFirst({ where: { slug, isPublished: true } });
export const listPolicies = () => prisma.page.findMany({ where: { isPolicy: true, isPublished: true }, orderBy: { id: 'asc' } });
export const listFaqs = () => prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
export const listZones = () => prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });

export async function homeData() {
  const [heroes, promo, featured, newest, collections, projects, gallery, posts, categories, rooms, catalogues, showrooms] = await Promise.all([
    listBanners('home-hero'),
    listBanners('home-promo'),
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, include: cardInclude, take: 8, orderBy: { soldCount: 'desc' } }),
    prisma.product.findMany({ where: { isActive: true }, include: cardInclude, take: 4, orderBy: { publishedAt: 'desc' } }),
    prisma.collection.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 6, include: { brand: true } }),
    prisma.project.findMany({ where: { isActive: true }, orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }], take: 3 }),
    prisma.galleryItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 6 }),
    listPosts(3),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 8 }),
    prisma.room.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.catalogue.findFirst({ where: { kind: 'master', isActive: true } }),
    prisma.showroom.count({ where: { isActive: true } }),
  ]);
  return { heroes, promo: promo[0] ?? null, featured: featured.map(toCard), newest: newest.map(toCard), collections, projects, gallery, posts, categories, rooms, master: catalogues, showroomCount: showrooms };
}
