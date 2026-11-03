import { api } from '@/server/route';
import { badRequest, json, notFound } from '@/server/http';
import * as c from '@/server/services/content';

/**
 * GET /api/v1/content?type=collections|brands|designers|projects|gallery|catalogues|showrooms|blog|faqs|policies|banners|settings|home
 *     &slug=<slug> for a single collection/brand/project/catalogue/blog/page.
 * One read endpoint for showcase & CMS content (used by the mobile app and client components).
 */
export const GET = api(async (req) => {
  const sp = new URL(req.url).searchParams;
  const type = sp.get('type') ?? '';
  const slug = sp.get('slug');
  const one = async <T,>(p: Promise<T | null>) => { const r = await p; if (!r) throw notFound(); return json(r); };
  switch (type) {
    case 'home': return json(await c.homeData());
    case 'collections': return slug ? one(c.getCollection(slug)) : json(await c.listCollections());
    case 'brands': return slug ? one(c.getBrand(slug)) : json(await c.listBrands());
    case 'designers': return json(await c.listDesigners());
    case 'projects': return slug ? one(c.getProject(slug)) : json(await c.listProjects(sp.get('projectType') ?? undefined));
    case 'gallery': return json(await c.listGallery(Object.fromEntries(c.GALLERY_FACETS.map((f) => [f, sp.get(f) ?? undefined]))));
    case 'catalogues': return slug ? one(c.getCatalogue(slug)) : json(await c.listCatalogues());
    case 'showrooms': return json(await c.listShowrooms());
    case 'blog': return slug ? one(c.getPost(slug)) : json(await c.listPosts());
    case 'pages': if (!slug) throw badRequest('slug required'); return one(c.getPage(slug));
    case 'policies': return json(await c.listPolicies());
    case 'faqs': return json(await c.listFaqs());
    case 'banners': return json(await c.listBanners(sp.get('placement') ?? 'home-hero'));
    case 'settings': { const s = await c.getSettings(); return json({ store: s.store, seo: s.seo, social: s.social, payments: s.payments }); }
    case 'delivery-zones': return json(await c.listZones());
    default: throw badRequest('Unknown content type');
  }
});
