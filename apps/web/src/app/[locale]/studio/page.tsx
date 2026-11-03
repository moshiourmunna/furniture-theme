import type { Metadata } from 'next';
import Link from 'next/link';
import { listDesigners } from '@/server/services/content';
import { getLocale, lp, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Intro, JsonLd } from '@/components/ui';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/studio', title: t('Studio & designers', 'স্টুডিও ও ডিজাইনার'), description: t('Meet the Shekor design studio — the designers behind our collections.', 'শেকড় ডিজাইন স্টুডিওর সাথে পরিচিত হন — আমাদের কালেকশনের পেছনের ডিজাইনাররা।') });
}

export default async function Studio({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const ds = await listDesigners();
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Studio & designers', 'স্টুডিও ও ডিজাইনার') }];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Studio', 'স্টুডিও')} title={t('The people who draw the pieces', 'যাঁরা পিসগুলো আঁকেন')} sub={t('Every Shekor piece begins as a pencil sketch in our Banani studio, then becomes a full-size prototype in Gazipur before it is ever sold.', 'প্রতিটি শেকড় পিস শুরু হয় বনানী স্টুডিওর পেন্সিল স্কেচে, তারপর বিক্রির আগে গাজীপুরে পূর্ণ মাপের প্রোটোটাইপ হয়।')} />
      <section className="container grid md:grid-cols-3 gap-x-8 gap-y-16">
        {ds.map((d, i) => (
          <article key={d.slug} className={i % 3 === 1 ? 'md:mt-20' : ''} data-reveal>
            <Figure src={d.image ?? '/media/img/about-workshop.webp'} alt={f(d, 'name')} ratio="aspect-[3/4]" sizes="(min-width:768px) 30vw, 90vw" />
            <h2 className="h-display text-3xl mt-5">{f(d, 'name')}</h2>
            <p className="label-sm text-muted mt-1">{f(d, 'role')}</p>
            <p className="text-muted mt-3 leading-relaxed">{f(d, 'bio')}</p>
            {d.collections.length > 0 && <p className="text-sm mt-3">{t('Collections', 'কালেকশন')}: {d.collections.map((c, k) => <span key={c.slug}>{k > 0 && ', '}<Link className="link" href={lp(locale, `/collections/${c.slug}`)}>{f(c, 'name')}</Link></span>)}</p>}
          </article>
        ))}
      </section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), ...ds.map((d) => ({ '@context': 'https://schema.org', '@type': 'Person', name: d.nameEn, jobTitle: d.roleEn, worksFor: { '@type': 'Organization', name: 'Shekor' } }))]} />
    </>
  );
}
