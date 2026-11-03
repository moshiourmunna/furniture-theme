import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrand } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Hero, JsonLd, SectionHead } from '@/components/ui';
import { ProductGrid } from '@/components/product-card';
import { CollectionCard } from '@/components/showcase';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const b = await getBrand((await params).slug);
  if (!b) return {};
  const f = pf(locale);
  return pageMeta({ locale, path: `/brands/${b.slug}`, title: f(b, 'name'), description: f(b, 'tagline') || f(b, 'story').slice(0, 160), image: b.image });
}

export default async function BrandPage({ params }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const b = await getBrand((await params).slug);
  if (!b) notFound();
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Brands', 'ব্র্যান্ড'), path: '/brands' }, { name: f(b, 'name') }];
  return (
    <>
      <Hero image={b.image ?? '/media/img/hero-2.webp'} alt={f(b, 'name')} eyebrow={`${b.kind === 'own' ? t('A Shekor label', 'শেকড় লেবেল') : t('Partner maker', 'পার্টনার নির্মাতা')}${b.since ? ` · ${t('since', 'থেকে')} ${num(locale, b.since)}` : ''}`} title={f(b, 'name')} sub={f(b, 'tagline')} height="h-[70svh]">
        <a href="#pieces" className="btn btn-light">{t('Shop the brand', 'ব্র্যান্ডের পিস দেখুন')}</a>
        {b.catalogue && <Link href={lp(locale, `/catalogues/${b.catalogue.slug}`)} className="link-line text-white">{t('Brand catalogue', 'ব্র্যান্ড ক্যাটালগ')}</Link>}
      </Hero>
      <section className="container py-20 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3"><Breadcrumbs locale={locale} items={crumbs} /></div>
        <div className="lg:col-span-8 lg:col-start-5 prose-sk text-lg">{(f(b, 'story') || f(b, 'tagline')).split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      </section>
      {b.collections.length > 0 && <section className="container"><SectionHead locale={locale} eyebrow={t('Collections', 'কালেকশন')} title={t(`Collections by ${b.nameEn}`, `${b.nameBn}-এর কালেকশন`)} /><div className="grid md:grid-cols-3 gap-8">{b.collections.map((c) => <CollectionCard key={c.slug} c={c} locale={locale} ratio="aspect-[4/3]" />)}</div></section>}
      <section className="container mt-24 scroll-mt-24" id="pieces"><SectionHead locale={locale} eyebrow={t('Pieces', 'পিস')} title={t('From this brand', 'এই ব্র্যান্ডের পিস')} href={`/shop?brand=${b.slug}`} />
        {b.products.length ? <ProductGrid items={b.products} locale={locale} /> : <p className="text-muted">{t('Pieces from this brand are available by consultation.', 'এই ব্র্যান্ডের পিস পরামর্শের মাধ্যমে পাওয়া যায়।')} <Link className="link" href={lp(locale, '/consultation')}>{t('Book one', 'বুক করুন')}</Link></p>}
      </section>
      {b.gallery.length > 0 && <section className="container mt-24"><SectionHead locale={locale} eyebrow={t('Gallery', 'গ্যালারি')} title={t('In the home', 'ঘরে ঘরে')} href={`/gallery/brand/${b.slug}`} /><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{b.gallery.map((g) => <Link key={g.id} href={lp(locale, `/gallery/brand/${b.slug}`)}><Figure src={g.image} alt={f(g, 'title')} ratio="aspect-square" sizes="33vw" /></Link>)}</div></section>}
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'Brand', name: b.nameEn, alternateName: b.nameBn, slogan: b.taglineEn, logo: abs('/brand/shekor-icon-light.svg'), url: abs(`/${locale}/brands/${b.slug}`) }]} />
    </>
  );
}
