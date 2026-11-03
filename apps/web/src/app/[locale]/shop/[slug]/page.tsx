import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@shekor/db';
import { getLocale, lp, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, JsonLd } from '@/components/ui';
import { CatalogView, itemListLd } from '@/components/shop/catalog-view';
import { parseFilters } from '@/server/services/catalog';
import { Faqs, faqLd } from '@/components/faqs';

type Props = LocaleParams<{ slug: string }> & { searchParams: Promise<Record<string, string | string[] | undefined>> };
const getCat = (slug: string) => prisma.category.findFirst({ where: { slug, isActive: true }, include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }, parent: true } });

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const { slug } = await params;
  const c = await getCat(slug);
  if (!c) return {};
  const f = pf(locale);
  const sp = await searchParams;
  return pageMeta({ locale, path: `/shop/${slug}`, title: (locale === 'bn' ? c.metaTitleBn : c.metaTitleEn) || f(c, 'name'), description: (locale === 'bn' ? c.metaDescBn : c.metaDescEn) || f(c, 'desc') || f(c, 'name'), image: c.image, noindex: Object.keys(sp).some((k) => k !== 'page') });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const locale = await getLocale(params);
  const { slug } = await params;
  const c = await getCat(slug);
  if (!c) notFound();
  const t = tr(locale);
  const f = pf(locale);
  const sp = await searchParams;
  const slugs = [c.slug, ...c.children.map((x) => x.slug)];
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Furniture', 'ফার্নিচার'), path: '/shop' }, ...(c.parent ? [{ name: f(c.parent, 'name'), path: `/shop/${c.parent.slug}` }] : []), { name: f(c, 'name') }];
  const faqs = await prisma.faq.findMany({ where: { isActive: true, groupEn: { in: ['Orders & payment', 'Delivery & assembly'] } }, take: 3, orderBy: { sortOrder: 'asc' } });
  return (
    <>
      <div className="container pt-6">
        <Breadcrumbs locale={locale} items={crumbs} />
        <h1 className="h-display text-3xl md:text-5xl mt-5">{f(c, 'name')}</h1>
        {f(c, 'desc') && <p className="text-muted mt-2 max-w-2xl">{f(c, 'desc')}</p>}
        {c.children.length > 0 && (
          <div className="mt-6 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
            <Link href={lp(locale, `/shop/${c.slug}`)} className="chip chip-active shrink-0">{t('All', 'সব')} {f(c, 'name')}</Link>
            {c.children.map((x) => <Link key={x.slug} href={lp(locale, `/shop/${x.slug}`)} className="chip shrink-0">{f(x, 'name')}</Link>)}
          </div>
        )}
      </div>
      <CatalogView locale={locale} searchParams={sp} basePath={`/shop/${c.slug}`} fixed={{ category: slugs }} showCategoryFacet={false} />
      {faqs.length > 0 && <section className="container mt-20 max-w-3xl"><h2 className="h-display text-3xl mb-4">{t('Questions, answered', 'প্রশ্ন ও উত্তর')}</h2><Faqs locale={locale} items={faqs} /></section>}
      <JsonLd data={[breadcrumbLd(locale, crumbs), await itemListLd(locale, c.nameEn, { ...parseFilters(sp), category: slugs }), ...(faqs.length ? [faqLd(locale, faqs)] : [])]} />
    </>
  );
}

