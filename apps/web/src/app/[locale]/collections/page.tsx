import type { Metadata } from 'next';
import Link from 'next/link';
import { listBrands, listCollections } from '@/server/services/content';
import { getLocale, lp, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Intro, JsonLd } from '@/components/ui';
import { CollectionCard } from '@/components/showcase';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/collections', title: t('Collections', 'কালেকশন'), description: t('Explore Shekor furniture collections: Aranya, Padma, Nodi, Shimul, Kormo and Baranda — solid wood, made in Bangladesh.', 'শেকড় ফার্নিচার কালেকশন: অরণ্য, পদ্মা, নদী, শিমুল, কর্ম ও বারান্দা — সলিড কাঠ, বাংলাদেশে তৈরি।') });
}

export default async function Collections({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const [cs, brands] = await Promise.all([listCollections(), listBrands()]);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Collections', 'কালেকশন') }];
  const layout: [string, string, boolean][] = [['md:col-span-7', 'aspect-[4/5]', true], ['md:col-span-5 md:mt-48', 'aspect-[3/4]', false], ['md:col-span-5', 'aspect-[3/4]', false], ['md:col-span-7 md:mt-24', 'aspect-[4/3]', true], ['md:col-span-6', 'aspect-[4/3]', false], ['md:col-span-6 md:mt-32', 'aspect-[4/3]', false]];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Collections', 'কালেকশন')} title={t('Collections', 'কালেকশন')} sub={t('Each collection begins with a place in Bangladesh — a forest, a river, a verandah — and is drawn, prototyped and made in our Gazipur workshop.', 'প্রতিটি কালেকশন শুরু হয় বাংলাদেশের কোনো জায়গা থেকে — বন, নদী, বারান্দা — আর আঁকা, প্রোটোটাইপ ও তৈরি হয় আমাদের গাজীপুর কারখানায়।')} />
      <section className="container">
        <div className="flex flex-wrap gap-2 mb-12 border-t border-line pt-6">{brands.slice(0, 4).map((b) => <Link key={b.slug} href={lp(locale, `/brands/${b.slug}`)} className="chip">{f(b, 'name')}</Link>)}</div>
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-20">
          {cs.map((c, i) => { const l = layout[i % layout.length]; return <div key={c.slug} className={l[0]}><CollectionCard c={c} locale={locale} ratio={l[1]} big={l[2]} /></div>; })}
        </div>
      </section>
      <section className="container mt-28 grid md:grid-cols-2 gap-10 items-center border-t border-line pt-16">
        <h2 className="h-display text-4xl md:text-5xl">{t('Prefer it in print?', 'ছাপা কপি চান?')}</h2>
        <div className="md:justify-self-end flex flex-wrap gap-3"><Link href={lp(locale, '/catalogues')} className="btn btn-primary">{t('Browse catalogues', 'ক্যাটালগ দেখুন')}</Link><Link href={lp(locale, '/catalogues#request')} className="btn btn-outline">{t('Request a printed copy', 'ছাপা কপির অনুরোধ')}</Link></div>
      </section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Shekor collections', hasPart: cs.map((c) => ({ '@type': 'CreativeWork', name: c.nameEn, url: abs(`/${locale}/collections/${c.slug}`) })) }]} />
    </>
  );
}
