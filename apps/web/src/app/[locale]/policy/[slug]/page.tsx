import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPage, listPolicies } from '@/server/services/content';
import { cleanHtml } from '@/server/sanitize';
import { date, getLocale, lp, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, JsonLd } from '@/components/ui';
import { Prose } from '@/components/editorial';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const p = await getPage((await params).slug);
  if (!p || !p.isPolicy) return {};
  const f = pf(locale);
  return pageMeta({ locale, path: `/policy/${p.slug}`, title: f(p, 'title'), description: f(p, 'metaDesc') || f(p, 'title') });
}

export default async function Policy({ params }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const { slug } = await params;
  const [p, all] = await Promise.all([getPage(slug), listPolicies()]);
  if (!p || !p.isPolicy) notFound();
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Policies', 'নীতিমালা') }, { name: f(p, 'title') }];
  return (
    <div className="container pt-6 grid lg:grid-cols-[240px_1fr] gap-10">
      <div className="lg:col-span-2"><Breadcrumbs locale={locale} items={crumbs} /></div>
      <nav aria-label={t('Policies', 'নীতিমালা')} className="lg:sticky lg:top-28 self-start"><ul className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">{all.map((x) => <li key={x.slug}><Link href={lp(locale, `/policy/${x.slug}`)} aria-current={x.slug === slug ? 'page' : undefined} className={`chip shrink-0 lg:w-full ${x.slug === slug ? 'chip-active' : ''}`}>{f(x, 'title')}</Link></li>)}</ul></nav>
      <article className="max-w-3xl">
        <h1 className="h-display text-4xl md:text-5xl">{f(p, 'title')}</h1>
        <p className="text-xs text-muted mt-3">{t('Last updated', 'সর্বশেষ হালনাগাদ')}: {date(locale, p.updatedAt)}</p>
        <div className="mt-8 text-[17px]"><Prose html={cleanHtml(f(p, 'body'))} /></div>
      </article>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </div>
  );
}
