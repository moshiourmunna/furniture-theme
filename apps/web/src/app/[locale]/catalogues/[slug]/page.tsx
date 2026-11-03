import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogue } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, JsonLd } from '@/components/ui';
import { Flipbook } from '@/components/flipbook';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const c = await getCatalogue((await params).slug);
  if (!c) return {};
  const f = pf(locale);
  const t = tr(locale);
  return pageMeta({ locale, path: `/catalogues/${c.slug}`, title: f(c, 'title'), description: t(`Read the ${c.titleEn} online — ${c.pages} pages. Download the PDF or request a printed copy.`, `${c.titleBn} অনলাইনে পড়ুন — ${num('bn', c.pages)} পৃষ্ঠা। পিডিএফ ডাউনলোড বা ছাপা কপি চান।`), image: Array.isArray(c.pageImages) ? (c.pageImages as string[])[0] : c.coverImage });
}

export default async function CataloguePage({ params }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const c = await getCatalogue((await params).slug);
  if (!c) notFound();
  const pages = Array.isArray(c.pageImages) ? (c.pageImages as string[]) : [];
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Catalogues', 'ক্যাটালগ'), path: '/catalogues' }, { name: f(c, 'title') }];
  return (
    <>
      <div className="container pt-6 pb-6 flex flex-wrap items-end justify-between gap-4">
        <div><Breadcrumbs locale={locale} items={crumbs} /><h1 className="h-display text-3xl md:text-5xl mt-4">{f(c, 'title')}</h1><p className="text-sm text-muted mt-2">{num(locale, c.pages)} {t('pages', 'পৃষ্ঠা')} · PDF {num(locale, (c.sizeKb / 1024).toFixed(1))} MB · {num(locale, c.downloads)} {t('downloads', 'ডাউনলোড')}</p></div>
        <div className="flex flex-wrap gap-3"><a href={`/api/v1/catalogues/${c.slug}/download`} className="btn btn-primary" data-testid="download-pdf">{t('Download PDF', 'পিডিএফ ডাউনলোড')}</a><Link href={lp(locale, '/catalogues#request')} className="btn btn-outline">{t('Request print', 'ছাপা কপি চান')}</Link></div>
      </div>
      {pages.length ? <Flipbook pages={pages} title={f(c, 'title')} pdfHref={`/api/v1/catalogues/${c.slug}/download`} /> : <p className="container text-muted">{t('Preview unavailable — download the PDF.', 'প্রিভিউ নেই — পিডিএফ ডাউনলোড করুন।')}</p>}
      <p className="container text-xs text-muted mt-4">{t('Tip: use ← → keys or swipe to turn pages.', 'টিপস: পৃষ্ঠা উল্টাতে ← → কী বা সোয়াইপ ব্যবহার করুন।')}</p>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'DigitalDocument', name: c.titleEn, encodingFormat: 'application/pdf', url: abs(c.pdfUrl), numberOfPages: c.pages, publisher: { '@id': abs('/#org') } }]} />
    </>
  );
}
