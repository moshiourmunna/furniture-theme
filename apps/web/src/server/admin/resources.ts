import 'server-only';
import { z, type ZodObject, type ZodRawShape } from 'zod';
import { prisma } from '@shekor/db';
import { slugify } from '@shekor/shared';
import { cleanHtml } from '../sanitize';

const str = (max = 191) => z.string().trim().max(max);
const req = (max = 191) => z.string().trim().min(1, 'Required').max(max);
const opt = (max = 191) => z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
const slug = z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes');
const int = z.coerce.number().int();
const bool = z.coerce.boolean();
const strList = z.array(z.string().trim().max(255)).max(60);
const date = z.union([z.string(), z.date()]).nullish().transform((v) => (v ? new Date(v) : null));

export interface ResourceDef {
  model: string; // prisma delegate
  group: string; // permission group → `${group}.read` / `${group}.write`
  schema: ZodObject<ZodRawShape>;
  search: string[];
  orderBy: Record<string, 'asc' | 'desc'>[];
  filters?: string[]; // exact-match query filters (e.g. status)
  include?: Record<string, unknown>;
  html?: string[]; // rich-text fields sanitized on write
  slugFrom?: string; // auto-generate slug from this field when blank
  label: (r: Record<string, unknown>) => string;
  readOnly?: boolean;
  noCreate?: boolean;
  validate?: (d: Record<string, unknown>) => Record<string, string> | null;
}

const bilingual = (name: string, max = 191, required = true) => ({ [`${name}En`]: required ? req(max) : opt(max), [`${name}Bn`]: required ? req(max) : opt(max) });
const seo = { metaTitleEn: opt(191), metaTitleBn: opt(191), metaDescEn: opt(320), metaDescBn: opt(320) };

export const RESOURCES: Record<string, ResourceDef> = {
  categories: {
    model: 'category', group: 'catalog', search: ['nameEn', 'nameBn', 'slug'], orderBy: [{ sortOrder: 'asc' }], slugFrom: 'nameEn', label: (r) => String(r.nameEn),
    include: { _count: { select: { products: true } } },
    schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), descEn: opt(5000), descBn: opt(5000), image: opt(255), icon: opt(40), parentId: int.nullish(), sortOrder: int.default(0), isActive: bool.default(true), ...seo }),
  },
  rooms: { model: 'room', group: 'catalog', search: ['nameEn', 'slug'], orderBy: [{ sortOrder: 'asc' }], slugFrom: 'nameEn', label: (r) => String(r.nameEn), schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), image: opt(255), sortOrder: int.default(0) }) },
  materials: { model: 'material', group: 'catalog', search: ['nameEn', 'slug'], orderBy: [{ nameEn: 'asc' }], slugFrom: 'nameEn', label: (r) => String(r.nameEn), schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), careEn: opt(5000), careBn: opt(5000) }) },
  brands: {
    model: 'brand', group: 'catalog', search: ['nameEn', 'nameBn', 'slug'], orderBy: [{ sortOrder: 'asc' }], slugFrom: 'nameEn', label: (r) => String(r.nameEn),
    include: { _count: { select: { products: true } } },
    schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), kind: z.enum(['own', 'partner']).default('own'), ...bilingual('tagline', 255, false), storyEn: opt(10000), storyBn: opt(10000), image: opt(255), since: opt(60), sortOrder: int.default(0), isActive: bool.default(true) }),
  },
  designers: { model: 'designer', group: 'catalog', search: ['nameEn', 'slug'], orderBy: [{ sortOrder: 'asc' }], slugFrom: 'nameEn', label: (r) => String(r.nameEn), schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), ...bilingual('role', 160, false), bioEn: opt(5000), bioBn: opt(5000), image: opt(255), sortOrder: int.default(0) }) },
  collections: {
    model: 'collection', group: 'catalog', search: ['nameEn', 'nameBn', 'slug'], orderBy: [{ sortOrder: 'asc' }], slugFrom: 'nameEn', label: (r) => String(r.nameEn),
    include: { brand: { select: { nameEn: true } }, _count: { select: { products: true } } },
    schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), introEn: opt(5000), introBn: opt(5000), year: opt(10), heroImage: opt(255), moodImages: strList.default([]), brandId: int.nullish(), designerId: int.nullish(), isFeatured: bool.default(false), isActive: bool.default(true), sortOrder: int.default(0) }),
  },
  projects: {
    model: 'project', group: 'showcase', search: ['titleEn', 'titleBn', 'slug', 'cityEn'], orderBy: [{ sortOrder: 'asc' }], filters: ['type'], slugFrom: 'titleEn', html: ['storyEn', 'storyBn'], label: (r) => String(r.titleEn),
    schema: z.object({ slug: slug.optional(), ...bilingual('title', 191), type: z.enum(['residential', 'hospitality', 'corporate', 'retail']), ...bilingual('city', 120, false), year: opt(10), area: opt(60), scopeEn: opt(5000), scopeBn: opt(5000), storyEn: opt(50000), storyBn: opt(50000), heroImage: opt(255), images: strList.default([]), collectionSlugs: strList.default([]), isFeatured: bool.default(false), isActive: bool.default(true), sortOrder: int.default(0) }),
  },
  gallery: {
    model: 'galleryItem', group: 'showcase', search: ['titleEn', 'titleBn'], orderBy: [{ sortOrder: 'asc' }], filters: ['category', 'brandSlug', 'collectionSlug'], label: (r) => String(r.titleEn),
    include: { product: { select: { nameEn: true, slug: true } } },
    schema: z.object({ image: req(255), ...bilingual('title', 191), category: req(40), brandSlug: opt(80), collectionSlug: opt(80), room: opt(40), material: opt(40), projectType: opt(20), productId: int.nullish(), hotspotX: int.min(0).max(100).nullish(), hotspotY: int.min(0).max(100).nullish(), tall: bool.default(false), sortOrder: int.default(0), isActive: bool.default(true) }),
  },
  catalogues: {
    model: 'catalogue', group: 'showcase', search: ['titleEn', 'slug'], orderBy: [{ sortOrder: 'asc' }], filters: ['kind'], slugFrom: 'titleEn', label: (r) => String(r.titleEn),
    schema: z.object({ slug: slug.optional(), kind: z.enum(['master', 'category', 'brand', 'collection']), ref: opt(80), ...bilingual('title', 191), season: opt(10), coverImage: opt(255), pdfUrl: req(255), pageImages: strList.default([]), pages: int.min(0).default(0), sizeKb: int.min(0).default(0), isActive: bool.default(true), sortOrder: int.default(0) }),
  },
  'catalogue-requests': { model: 'catalogueRequest', group: 'leads', search: ['name', 'phone'], orderBy: [{ createdAt: 'desc' }], filters: ['status'], label: (r) => String(r.name), noCreate: true, schema: z.object({ status: z.enum(['new', 'dispatched', 'closed']) }) },
  banners: {
    model: 'banner', group: 'content', search: ['titleEn'], orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }], filters: ['placement'], label: (r) => String(r.titleEn),
    schema: z.object({ placement: req(40).default('home-hero'), ...bilingual('title', 191), ...bilingual('subtitle', 320, false), ...bilingual('cta', 60, false), href: opt(255), image: req(255), startsAt: date, endsAt: date, isActive: bool.default(true), sortOrder: int.default(0) }),
  },
  pages: {
    model: 'page', group: 'content', search: ['titleEn', 'slug'], orderBy: [{ id: 'asc' }], slugFrom: 'titleEn', html: ['bodyEn', 'bodyBn'], label: (r) => String(r.titleEn),
    schema: z.object({ slug: slug.optional(), ...bilingual('title', 191), bodyEn: req(200000), bodyBn: req(200000), metaDescEn: opt(320), metaDescBn: opt(320), isPolicy: bool.default(false), isPublished: bool.default(true) }),
  },
  blog: {
    model: 'blogPost', group: 'content', search: ['titleEn', 'titleBn', 'slug'], orderBy: [{ publishedAt: 'desc' }], slugFrom: 'titleEn', html: ['bodyEn', 'bodyBn'], label: (r) => String(r.titleEn),
    schema: z.object({ slug: slug.optional(), ...bilingual('title', 191), ...bilingual('excerpt', 320, false), bodyEn: req(200000), bodyBn: req(200000), ...bilingual('category', 60), coverImage: opt(255), authorName: str(120).default('Shekor Studio'), readMinutes: int.min(1).max(120).default(5), isPublished: bool.default(true), publishedAt: date.transform((d) => d ?? new Date()) }),
  },
  faqs: { model: 'faq', group: 'content', search: ['questionEn', 'questionBn'], orderBy: [{ sortOrder: 'asc' }], label: (r) => String(r.questionEn), schema: z.object({ ...bilingual('group', 60), ...bilingual('question', 320), answerEn: req(5000), answerBn: req(5000), sortOrder: int.default(0), isActive: bool.default(true) }) },
  coupons: {
    model: 'coupon', group: 'marketing', search: ['code'], orderBy: [{ createdAt: 'desc' }], label: (r) => String(r.code),
    schema: z.object({ code: req(40).transform((v) => v.toUpperCase()).pipe(z.string().regex(/^[A-Z0-9_-]+$/, 'Letters, numbers, - and _')), ...bilingual('description', 191, false), type: z.enum(['percent', 'fixed', 'shipping']), value: int.min(0), minSubtotal: int.min(0).default(0), maxDiscount: int.min(0).nullish(), usageLimit: int.min(1).nullish(), perUserLimit: int.min(1).nullish(), startsAt: date, endsAt: date, isActive: bool.default(true) }),
    validate: (d) => (d.type === 'percent' && Number(d.value) > 100 ? { value: 'Percent must be ≤ 100' } : null),
  },
  newsletter: { model: 'newsletterSubscriber', group: 'marketing', search: ['email'], orderBy: [{ createdAt: 'desc' }], label: (r) => String(r.email), noCreate: true, schema: z.object({ locale: z.enum(['en', 'bn']) }) },
  'delivery-zones': {
    model: 'deliveryZone', group: 'delivery', search: ['nameEn', 'code'], orderBy: [{ sortOrder: 'asc' }], label: (r) => String(r.nameEn),
    schema: z.object({ code: slug, ...bilingual('name', 120), divisions: strList.min(1), districts: strList.default([]), charge: int.min(0), freeOver: int.min(0).nullish(), assemblyFee: int.min(0).default(0), leadDaysMin: int.min(0).default(2), leadDaysMax: int.min(0).default(5), codAvailable: bool.default(true), isActive: bool.default(true), sortOrder: int.default(0) }),
  },
  showrooms: {
    model: 'showroom', group: 'showrooms', search: ['nameEn', 'city'], orderBy: [{ sortOrder: 'asc' }], filters: ['city'], slugFrom: 'nameEn', label: (r) => String(r.nameEn),
    schema: z.object({ slug: slug.optional(), ...bilingual('name', 120), city: req(40), ...bilingual('address', 255), phone: req(20), hours: str(60).default('10:00–21:00'), isFlagship: bool.default(false), lat: z.coerce.number().min(20).max(27), lng: z.coerce.number().min(88).max(93), image: opt(255), services: strList.default([]), isActive: bool.default(true), sortOrder: int.default(0) }),
  },
  reviews: {
    model: 'review', group: 'reviews', search: ['authorName', 'title'], orderBy: [{ createdAt: 'desc' }], filters: ['status'], label: (r) => String(r.title), noCreate: true,
    include: { product: { select: { nameEn: true, slug: true } } },
    schema: z.object({ status: z.enum(['pending', 'approved', 'rejected']), reply: opt(4000) }),
  },
  quotes: { model: 'customOrderRequest', group: 'leads', search: ['name', 'phone', 'ref', 'pieceType'], orderBy: [{ createdAt: 'desc' }], filters: ['status'], label: (r) => String(r.ref), noCreate: true, schema: z.object({ status: z.enum(['new', 'measured', 'quoted', 'approved', 'production', 'closed']), quoteAmount: int.min(0).nullish(), adminNotes: opt(5000) }) },
  consultations: { model: 'consultationBooking', group: 'leads', search: ['name', 'phone', 'ref'], orderBy: [{ date: 'desc' }], filters: ['status', 'mode'], label: (r) => String(r.ref), noCreate: true, include: { showroom: { select: { nameEn: true } } }, schema: z.object({ status: z.enum(['requested', 'confirmed', 'completed', 'cancelled']), date: date, timeSlot: str(20).optional() }) },
  'trade-inquiries': { model: 'tradeInquiry', group: 'leads', search: ['company', 'contactName', 'ref'], orderBy: [{ createdAt: 'desc' }], filters: ['status', 'sector'], label: (r) => String(r.company), noCreate: true, schema: z.object({ status: z.enum(['new', 'contacted', 'proposal', 'won', 'lost']) }) },
  'contact-messages': { model: 'contactMessage', group: 'leads', search: ['name', 'subject', 'email'], orderBy: [{ createdAt: 'desc' }], filters: ['status'], label: (r) => String(r.subject), noCreate: true, schema: z.object({ status: z.enum(['new', 'replied', 'closed']) }) },
};

export function prepareData(def: ResourceDef, data: Record<string, unknown>, isCreate: boolean) {
  const out = { ...data };
  if (def.slugFrom && 'slug' in def.schema.shape) {
    if (isCreate && !out.slug && out[def.slugFrom]) out.slug = slugify(String(out[def.slugFrom]));
  }
  for (const f of def.html ?? []) if (typeof out[f] === 'string') out[f] = cleanHtml(out[f] as string);
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const delegate = (def: ResourceDef) => (prisma as any)[def.model];
