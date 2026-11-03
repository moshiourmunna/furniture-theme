import type { MetadataRoute } from 'next';
import { prisma } from '@shekor/db';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

const STATIC = ['', '/shop', '/collections', '/brands', '/projects', '/gallery', '/catalogues', '/craft', '/studio', '/about', '/interior-design', '/trade', '/custom', '/consultation', '/showrooms', '/journal', '/faq', '/contact', '/track'];

/** Bilingual sitemap: every URL is listed once per locale with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections, brands, projects, posts, catalogues, pages] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.project.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    prisma.catalogue.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { isPublished: true, isPolicy: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const entries: { path: string; lastModified?: Date; priority: number }[] = [
    ...STATIC.map((p) => ({ path: p, priority: p === '' ? 1 : 0.7 })),
    ...products.map((r) => ({ path: `/p/${r.slug}`, lastModified: r.updatedAt, priority: 0.8 })),
    ...categories.map((r) => ({ path: `/shop/${r.slug}`, lastModified: r.updatedAt, priority: 0.7 })),
    ...collections.map((r) => ({ path: `/collections/${r.slug}`, lastModified: r.updatedAt, priority: 0.7 })),
    ...brands.map((r) => ({ path: `/brands/${r.slug}`, lastModified: r.updatedAt, priority: 0.6 })),
    ...projects.map((r) => ({ path: `/projects/${r.slug}`, lastModified: r.updatedAt, priority: 0.6 })),
    ...posts.map((r) => ({ path: `/journal/${r.slug}`, lastModified: r.updatedAt, priority: 0.5 })),
    ...catalogues.map((r) => ({ path: `/catalogues/${r.slug}`, lastModified: r.updatedAt, priority: 0.5 })),
    ...pages.map((r) => ({ path: `/policy/${r.slug}`, lastModified: r.updatedAt, priority: 0.3 })),
  ];
  return entries.flatMap((e) => (['en', 'bn'] as const).map((l) => ({
    url: `${SITE_URL}/${l}${e.path}`, lastModified: e.lastModified, priority: e.priority,
    alternates: { languages: { en: `${SITE_URL}/en${e.path}`, bn: `${SITE_URL}/bn${e.path}`, 'x-default': `${SITE_URL}/en${e.path}` } },
  })));
}
