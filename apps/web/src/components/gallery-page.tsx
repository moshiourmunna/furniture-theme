import Link from 'next/link';
import { prisma } from '@shekor/db';
import { GALLERY_FACETS, listGallery, type GalleryFacet } from '@/server/services/content';
import { taxonomy } from '@/server/services/catalog';
import { lp, pf, tr, type Locale } from '@/lib/i18n';
import { breadcrumbLd, abs } from '@/lib/seo';
import { Breadcrumbs, Empty, Intro, JsonLd } from './ui';
import { GalleryWall } from './gallery-wall';
import { PROJECT_TYPES } from './showcase';

export const FACET_LABEL: Record<GalleryFacet, [string, string]> = { category: ['Category', 'ক্যাটাগরি'], brand: ['Brand', 'ব্র্যান্ড'], collection: ['Collection', 'কালেকশন'], room: ['Room', 'রুম'], material: ['Material', 'ম্যাটেরিয়াল'], type: ['Project type', 'প্রজেক্টের ধরন'] };

export async function facetOptions(locale: Locale) {
  const tx = await taxonomy();
  const f = pf(locale);
  const m = (rows: { slug: string; nameEn: string; nameBn: string }[]) => rows.map((r) => ({ value: r.slug, label: f(r, 'name') }));
  const GCAT: Record<string, [string, string]> = { living: ['Living', 'বসার ঘর'], bedroom: ['Bedroom', 'শোবার ঘর'], dining: ['Dining', 'ডাইনিং'], kitchen: ['Kitchen', 'রান্নাঘর'], office: ['Office', 'অফিস'], kids: ['Kids', 'শিশুদের ঘর'], outdoor: ['Outdoor', 'আউটডোর'] };
  const cats = (await prisma.galleryItem.findMany({ where: { isActive: true }, distinct: ['category'], select: { category: true } })).map((c) => c.category);
  return {
    category: cats.map((c) => ({ value: c, label: GCAT[c] ? (locale === 'bn' ? GCAT[c][1] : GCAT[c][0]) : c })), brand: m(tx.brands), collection: m(tx.collections), room: m(tx.rooms), material: m(tx.materials),
    type: PROJECT_TYPES.map(([k, en, bn]) => ({ value: k, label: locale === 'bn' ? bn : en })),
  } as Record<GalleryFacet, { value: string; label: string }[]>;
}

export async function GalleryPage({ locale, facet, value }: { locale: Locale; facet?: GalleryFacet; value?: string }) {
  const t = tr(locale);
  const [items, opts] = await Promise.all([listGallery(facet && value ? { [facet]: value } : {}), facetOptions(locale)]);
  const active = facet ?? 'category';
  const valueLabel = facet && value ? opts[facet].find((o) => o.value === value)?.label ?? value : null;
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Gallery', 'গ্যালারি'), ...(valueLabel ? { path: '/gallery' } : {}) }, ...(valueLabel ? [{ name: valueLabel }] : [])];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Gallery', 'গ্যালারি')} title={valueLabel ? `${t('Gallery', 'গ্যালারি')} — ${valueLabel}` : t('Rooms to live in', 'বসবাসের মতো ঘর')} sub={t('Browse by room, collection, brand, material or project — tap a picture to see it large, and shop what you see.', 'রুম, কালেকশন, ব্র্যান্ড, ম্যাটেরিয়াল বা প্রজেক্ট অনুযায়ী দেখুন — বড় করে দেখতে ছবিতে চাপুন, আর পছন্দেরটা কিনুন।')} />
      <section className="container">
        <div className="border-y border-line py-4 space-y-3">
          <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label={t('Browse by', 'যেভাবে দেখবেন')}>
            {GALLERY_FACETS.map((k) => <Link key={k} role="tab" aria-selected={active === k} href={lp(locale, `/gallery/${k}/${opts[k][0]?.value ?? ''}`)} className={`shrink-0 px-3 py-2 text-[12px] uppercase tracking-[0.16em] ${active === k ? 'text-ink border-b-2 border-ink' : 'text-muted hover:text-ink'}`} data-testid={`facet-${k}`}>{t(...FACET_LABEL[k])}</Link>)}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Link href={lp(locale, '/gallery')} className={`chip shrink-0 h-9 ${!value ? 'chip-active' : ''}`}>{t('All', 'সব')}</Link>
            {opts[active].map((o) => <Link key={o.value} href={lp(locale, `/gallery/${active}/${o.value}`)} className={`chip shrink-0 h-9 ${value === o.value ? 'chip-active' : ''}`} aria-current={value === o.value ? 'page' : undefined}>{o.label}</Link>)}
          </div>
        </div>
        <div className="mt-10">{items.length ? <GalleryWall items={items.map((g) => ({ id: g.id, image: g.image, titleEn: g.titleEn, titleBn: g.titleBn, tall: g.tall, hotspotX: g.hotspotX, hotspotY: g.hotspotY, product: g.product }))} /> : <Empty title={t('No pictures here yet', 'এখানে এখনো ছবি নেই')}><Link className="link" href={lp(locale, '/gallery')}>{t('See the full gallery', 'পুরো গ্যালারি দেখুন')}</Link></Empty>}</div>
      </section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'ImageGallery', name: 'Shekor gallery', image: items.slice(0, 20).map((g) => ({ '@type': 'ImageObject', contentUrl: abs(g.image), name: g.titleEn })) }]} />
    </>
  );
}
