import type { Metadata } from 'next';
import Link from 'next/link';
import { listBrands } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Intro, JsonLd } from '@/components/ui';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/brands', title: t('Brands & partners', 'ব্র্যান্ড ও পার্টনার'), description: t('The Shekor family of brands — Atelier, Studio, Contract, Kids — and our partner makers in Bangladesh.', 'শেকড়ের ব্র্যান্ড পরিবার — অ্যাটেলিয়ার, স্টুডিও, কন্ট্রাক্ট, কিডস — এবং বাংলাদেশের পার্টনার নির্মাতারা।') });
}

export default async function Brands({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const brands = await listBrands();
  const own = brands.filter((b) => b.kind === 'own');
  const partners = brands.filter((b) => b.kind !== 'own');
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Brands', 'ব্র্যান্ড') }];
  const card = (b: (typeof brands)[number], i: number) => (
    <Link key={b.slug} href={lp(locale, `/brands/${b.slug}`)} className={`group block ${i % 2 ? 'md:mt-24' : ''}`} data-reveal data-testid="brand-card">
      <Figure src={b.image ?? '/media/img/hero-2.webp'} alt={f(b, 'name')} ratio="aspect-[4/3]" sizes="(min-width:768px) 45vw, 90vw" />
      <div className="mt-5 flex items-baseline justify-between gap-4"><h3 className="h-display text-3xl">{f(b, 'name')}</h3><span className="label-sm text-muted">{b.since ? `${t('Since', 'থেকে')} ${num(locale, b.since)}` : ''}</span></div>
      <p className="text-muted mt-2 max-w-md">{f(b, 'tagline')}</p>
      <p className="text-xs text-muted mt-2">{num(locale, b._count.products)} {t('pieces', 'পিস')} · {num(locale, b._count.collections)} {t('collections', 'কালেকশন')}</p>
    </Link>
  );
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Brands', 'ব্র্যান্ড')} title={t('One house, several hands', 'এক ঘর, অনেক হাত')} sub={t('Our own labels for every kind of space, and a few partner workshops whose craft we admire.', 'প্রতিটি জায়গার জন্য আমাদের নিজস্ব লেবেল, আর কিছু পার্টনার কারখানা যাদের কারুশিল্পকে আমরা শ্রদ্ধা করি।')} />
      <section className="container"><p className="eyebrow mb-8">{t('Shekor labels', 'শেকড় লেবেল')}</p><div className="grid md:grid-cols-2 gap-x-8 gap-y-16">{own.map(card)}</div></section>
      {partners.length > 0 && <section className="container mt-28"><p className="eyebrow mb-8">{t('Partner makers', 'পার্টনার নির্মাতা')}</p><div className="grid md:grid-cols-2 gap-x-8 gap-y-16">{partners.map(card)}</div></section>}
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
