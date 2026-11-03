import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, listPosts } from '@/server/services/content';
import { cleanHtml } from '@/server/sanitize';
import { date, getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, JsonLd } from '@/components/ui';
import { Prose } from '@/components/editorial';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const p = await getPost((await params).slug);
  if (!p) return {};
  const f = pf(locale);
  return pageMeta({ locale, path: `/journal/${p.slug}`, title: f(p, 'title'), description: f(p, 'excerpt'), image: p.coverImage, type: 'article' });
}

export default async function Post({ params }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const p = await getPost((await params).slug);
  if (!p) notFound();
  const more = (await listPosts(4)).filter((x) => x.slug !== p.slug).slice(0, 3);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Journal', 'জার্নাল'), path: '/journal' }, { name: f(p, 'title') }];
  return (
    <article>
      <header className="container-narrow pt-10 md:pt-16">
        <Breadcrumbs locale={locale} items={crumbs} />
        <p className="label-sm text-muted mt-8">{f(p, 'category')} · {date(locale, p.publishedAt)} · {num(locale, p.readMinutes)} {t('min read', 'মিনিট পড়া')}</p>
        <h1 className="h-display text-4xl md:text-6xl mt-4 leading-[1.05]">{f(p, 'title')}</h1>
        {f(p, 'excerpt') && <p className="text-lg text-muted mt-6">{f(p, 'excerpt')}</p>}
        <p className="text-sm mt-6">{t('By', 'লিখেছেন')} {p.authorName}</p>
      </header>
      <div className="container mt-10"><Figure src={p.coverImage ?? '/media/img/hero-2.webp'} alt={f(p, 'title')} ratio="aspect-[16/8]" sizes="100vw" priority /></div>
      <div className="container-narrow mt-12 text-[17px]"><Prose html={cleanHtml(f(p, 'body'))} /></div>
      {more.length > 0 && (
        <aside className="container mt-24 border-t border-line pt-12">
          <h2 className="h-display text-3xl mb-8">{t('Keep reading', 'আরও পড়ুন')}</h2>
          <div className="grid md:grid-cols-3 gap-8">{more.map((m) => <Link key={m.slug} href={lp(locale, `/journal/${m.slug}`)} className="group"><Figure src={m.coverImage ?? '/media/img/hero-2.webp'} alt={f(m, 'title')} ratio="aspect-[4/3]" sizes="30vw" /><h3 className="h-serif text-xl mt-4 group-hover:text-accent">{f(m, 'title')}</h3></Link>)}</div>
        </aside>
      )}
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: f(p, 'title'), description: f(p, 'excerpt'), image: abs(p.coverImage ?? ''), datePublished: p.publishedAt.toISOString(), dateModified: p.updatedAt.toISOString(), author: { '@type': 'Person', name: p.authorName }, publisher: { '@id': abs('/#org') }, inLanguage: locale === 'bn' ? 'bn-BD' : 'en', mainEntityOfPage: abs(`/${locale}/journal/${p.slug}`) }]} />
    </article>
  );
}
