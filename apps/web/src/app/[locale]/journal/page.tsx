import type { Metadata } from 'next';
import Link from 'next/link';
import { listPosts } from '@/server/services/content';
import { date, getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Intro, JsonLd } from '@/components/ui';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/journal', title: t('Journal — notes on living well', 'জার্নাল — সুন্দর জীবনের নোট'), description: t('Guides on choosing wood, caring for furniture and planning rooms in Bangladeshi homes.', 'কাঠ বাছাই, ফার্নিচারের যত্ন ও বাংলাদেশি বাড়িতে ঘর সাজানোর গাইড।') });
}

export default async function Journal({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const posts = await listPosts();
  const [lead, ...rest] = posts;
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Journal', 'জার্নাল') }];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Journal', 'জার্নাল')} title={t('Notes on living well', 'সুন্দর জীবনের নোট')} />
      {lead && (
        <section className="container">
          <Link href={lp(locale, `/journal/${lead.slug}`)} className="group grid lg:grid-cols-12 gap-8 items-center" data-testid="post-card">
            <div className="lg:col-span-7"><Figure src={lead.coverImage ?? '/media/img/hero-2.webp'} alt={f(lead, 'title')} ratio="aspect-[16/10]" sizes="(min-width:1024px) 60vw, 90vw" priority /></div>
            <div className="lg:col-span-5"><p className="label-sm text-muted">{f(lead, 'category')} · {date(locale, lead.publishedAt)}</p><h2 className="h-display text-4xl md:text-5xl mt-3 group-hover:text-accent transition">{f(lead, 'title')}</h2><p className="text-muted mt-4">{f(lead, 'excerpt')}</p></div>
          </Link>
        </section>
      )}
      <section className="container mt-20 grid md:grid-cols-3 gap-x-8 gap-y-14">
        {rest.map((p) => (
          <Link key={p.slug} href={lp(locale, `/journal/${p.slug}`)} className="group block" data-testid="post-card">
            <Figure src={p.coverImage ?? '/media/img/hero-2.webp'} alt={f(p, 'title')} ratio="aspect-[4/3]" sizes="(min-width:768px) 30vw, 90vw" />
            <p className="label-sm text-muted mt-5">{f(p, 'category')} · {num(locale, p.readMinutes)} {t('min read', 'মিনিট পড়া')}</p>
            <h3 className="h-serif text-xl mt-2 group-hover:text-accent transition">{f(p, 'title')}</h3>
          </Link>
        ))}
      </section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'Blog', name: 'Shekor Journal', blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.titleEn, datePublished: p.publishedAt.toISOString() })) }]} />
    </>
  );
}
