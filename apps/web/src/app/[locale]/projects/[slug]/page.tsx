import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Hero, JsonLd, SectionHead } from '@/components/ui';
import { Rail } from '@/components/product-card';
import { ProjectCard, projectType } from '@/components/showcase';
import { LightboxGrid } from '@/components/lightbox-grid';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const p = await getProject((await params).slug);
  if (!p) return {};
  const f = pf(locale);
  return pageMeta({ locale, path: `/projects/${p.slug}`, title: f(p, 'title'), description: f(p, 'scope') || f(p, 'story').slice(0, 160), image: p.heroImage, type: 'article' });
}

export default async function ProjectPage({ params }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const imgs = (Array.isArray(p.images) ? (p.images as string[]) : []).map((u, i) => ({ url: u, alt: `${f(p, 'title')} — ${num(locale, i + 1)}` }));
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Projects', 'প্রজেক্ট'), path: '/projects' }, { name: f(p, 'title') }];
  return (
    <>
      <Hero image={p.heroImage ?? '/media/img/hero-2.webp'} alt={f(p, 'title')} eyebrow={`${projectType(locale, p.type)} · ${f(p, 'city')}`} title={f(p, 'title')} sub={f(p, 'scope')} height="h-[80svh]" />
      <section className="container py-20 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3">
          <Breadcrumbs locale={locale} items={crumbs} />
          <dl className="mt-10 space-y-5 text-sm">
            {([[t('Type', 'ধরন'), projectType(locale, p.type)], [t('City', 'শহর'), f(p, 'city')], [t('Year', 'বছর'), p.year ? num(locale, p.year) : null], [t('Area', 'আয়তন'), p.area ? num(locale, p.area) : null]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k} className="border-t border-line pt-3"><dt className="label-sm text-muted">{k}</dt><dd className="mt-1">{v}</dd></div>)}
            {p.collections.length > 0 && <div className="border-t border-line pt-3"><dt className="label-sm text-muted">{t('Collections', 'কালেকশন')}</dt><dd className="mt-1 flex flex-wrap gap-x-3">{p.collections.map((c) => <Link key={c.slug} className="link" href={lp(locale, `/collections/${c.slug}`)}>{f(c, 'name')}</Link>)}</dd></div>}
          </dl>
        </div>
        <div className="lg:col-span-8 lg:col-start-5 prose-sk text-lg">{(f(p, 'story') || f(p, 'scope')).split(/\n\n+/).map((x, i) => <p key={i}>{x}</p>)}</div>
      </section>
      {imgs.length > 0 && <section className="container"><LightboxGrid images={imgs} /></section>}
      {p.products.length > 0 && <section className="container mt-24"><SectionHead locale={locale} eyebrow={t('Shop the look', 'লুকটি কিনুন')} title={t('Pieces in this project', 'এই প্রজেক্টের পিস')} /><Rail items={p.products} locale={locale} /></section>}
      <section className="container mt-24"><SectionHead locale={locale} eyebrow={t('More projects', 'আরও প্রজেক্ট')} title={t('Keep exploring', 'আরও দেখুন')} href="/projects" /><div className="grid md:grid-cols-3 gap-10">{p.more.map((x) => <ProjectCard key={x.slug} p={x} locale={locale} />)}</div></section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'Article', headline: p.titleEn, image: [abs(p.heroImage ?? ''), ...imgs.map((i) => abs(i.url))], author: { '@id': abs('/#org') }, publisher: { '@id': abs('/#org') }, about: p.scopeEn }]} />
    </>
  );
}
