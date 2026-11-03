import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollection, listCollections } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Hero, JsonLd, SectionHead } from '@/components/ui';
import { ProductGrid } from '@/components/product-card';
import { CollectionCard, ProjectCard } from '@/components/showcase';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const c = await getCollection((await params).slug);
  if (!c) return {};
  const f = pf(locale);
  return pageMeta({ locale, path: `/collections/${c.slug}`, title: `${f(c, 'name')} ${tr(locale)('collection', 'কালেকশন')}`, description: f(c, 'intro') || f(c, 'name'), image: c.heroImage });
}

export default async function CollectionPage({ params }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const c = await getCollection((await params).slug);
  if (!c) notFound();
  const others = (await listCollections()).filter((x) => x.slug !== c.slug).slice(0, 3);
  const mood = (Array.isArray(c.moodImages) ? (c.moodImages as string[]) : []).concat(['/media/img/look-1.webp', '/media/img/look-2.webp', '/media/img/look-3.webp']).slice(0, 3);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Collections', 'কালেকশন'), path: '/collections' }, { name: f(c, 'name') }];
  return (
    <>
      <Hero image={c.heroImage ?? '/media/img/hero-1.webp'} alt={`${f(c, 'name')} ${t('collection', 'কালেকশন')}`} eyebrow={`${c.brand ? f(c.brand, 'name') : 'Shekor'} · ${t('Collection', 'কালেকশন')} ${num(locale, c.year ?? '')}`} title={f(c, 'name')} sub={f(c, 'intro')} height="h-[88svh]">
        <a href="#pieces" className="btn btn-light">{t('Shop the collection', 'কালেকশন কিনুন')}</a>
        {c.catalogue && <Link href={lp(locale, `/catalogues/${c.catalogue.slug}`)} className="link-line text-white">{t('View lookbook', 'লুকবুক দেখুন')}</Link>}
      </Hero>
      <section className="container py-24 md:py-32 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3">
          <Breadcrumbs locale={locale} items={crumbs} />
          <dl className="mt-10 space-y-5 text-sm">
            {c.brand && <div className="border-t border-line pt-3"><dt className="label-sm text-muted">{t('Brand', 'ব্র্যান্ড')}</dt><dd className="mt-1"><Link className="link" href={lp(locale, `/brands/${c.brand.slug}`)}>{f(c.brand, 'name')}</Link></dd></div>}
            {c.designer && <div className="border-t border-line pt-3"><dt className="label-sm text-muted">{t('Designer', 'ডিজাইনার')}</dt><dd className="mt-1"><Link className="link" href={lp(locale, '/studio')}>{f(c.designer, 'name')}</Link></dd></div>}
            {c.year && <div className="border-t border-line pt-3"><dt className="label-sm text-muted">{t('Year', 'বছর')}</dt><dd className="mt-1">{num(locale, c.year)}</dd></div>}
            <div className="border-t border-line pt-3"><dt className="label-sm text-muted">{t('Pieces', 'পিস')}</dt><dd className="mt-1">{num(locale, c.products.length)}</dd></div>
          </dl>
        </div>
        <div className="lg:col-span-8 lg:col-start-5">
          <p className="h-display text-3xl md:text-[44px] leading-[1.15]" data-reveal>{t('“We wanted rooms that feel like the shade of a tree — calm, cool and unhurried. Everything is softened: the arms, the edges, even the light.”', '“আমরা চেয়েছিলাম ঘরগুলো যেন গাছের ছায়ার মতো লাগে — শান্ত, শীতল, ধীর। সবকিছু নরম: হাতল, কিনারা, এমনকি আলোও।”')}</p>
          {c.designer && <p className="label-sm text-muted mt-6">— {f(c.designer, 'name')}, {f(c.designer, 'role')}</p>}
        </div>
      </section>
      <section className="container grid md:grid-cols-12 gap-6 md:gap-8">
        <div className="md:col-span-8"><Figure src={mood[0]} alt={`${f(c, 'name')} — ${t('mood', 'মুড')}`} ratio="aspect-[16/10]" sizes="(min-width:768px) 60vw, 90vw" /></div>
        <div className="md:col-span-4 md:mt-24"><Figure src={mood[1]} alt={`${f(c, 'name')} — ${t('detail', 'ডিটেইল')}`} ratio="aspect-[3/4]" sizes="(min-width:768px) 30vw, 90vw" /></div>
        <div className="md:col-span-5 md:col-start-3 md:-mt-10"><Figure src={mood[2]} alt={`${f(c, 'name')} — ${t('room', 'রুম')}`} ratio="aspect-[4/3]" sizes="(min-width:768px) 40vw, 90vw" /></div>
        <div className="md:col-span-4 self-end">
          <p className="text-muted leading-relaxed" data-reveal>{t('Frames in seasoned Segun, cushions in Tangail handloom, brass details spun in Old Dhaka. Every piece can be made in your size and finish.', 'শুকানো সেগুনের ফ্রেম, টাঙ্গাইলের তাঁতের কুশন, পুরান ঢাকায় তৈরি ব্রাসের ডিটেইল। প্রতিটি পিস আপনার মাপ ও ফিনিশে বানানো যায়।')}</p>
          <Link href={lp(locale, '/custom')} className="link-line mt-6">{t('Make it bespoke', 'বেসপোক করুন')}</Link>
        </div>
      </section>
      <section className="container mt-28 scroll-mt-24" id="pieces">
        <SectionHead locale={locale} eyebrow={t('The pieces', 'পিসগুলো')} title={t(`Shop ${c.nameEn}`, `${c.nameBn} কিনুন`)} href={`/shop?collection=${c.slug}`} />
        <ProductGrid items={c.products} locale={locale} />
      </section>
      {c.projects.length > 0 && (
        <section className="container mt-28">
          <SectionHead locale={locale} eyebrow={t('In real spaces', 'বাস্তব জায়গায়')} title={t('Projects featuring this collection', 'এই কালেকশনের প্রজেক্ট')} href="/projects" />
          <div className="grid md:grid-cols-3 gap-10">{c.projects.slice(0, 3).map((p) => <ProjectCard key={p.slug} p={p} locale={locale} />)}</div>
        </section>
      )}
      <section className="container mt-28">
        <SectionHead locale={locale} eyebrow={t('Continue exploring', 'আরও দেখুন')} title={t('Other collections', 'অন্যান্য কালেকশন')} href="/collections" />
        <div className="grid md:grid-cols-3 gap-8">{others.map((x) => <CollectionCard key={x.slug} c={x} locale={locale} ratio="aspect-[4/3]" />)}</div>
      </section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.nameEn, description: c.introEn, image: abs(c.heroImage ?? ''), mainEntity: { '@type': 'ItemList', itemListElement: c.products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${locale}/p/${p.slug}`), name: p.nameEn })) } }]} />
    </>
  );
}
