import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, lp, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, JsonLd } from '@/components/ui';
import { CatalogView, itemListLd } from '@/components/shop/catalog-view';
import { parseFilters, taxonomy } from '@/server/services/catalog';

type Props = LocaleParams & { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  const sp = await searchParams;
  const filtered = Object.keys(sp).some((k) => k !== 'page');
  return pageMeta({ locale, path: '/shop', title: t('Furniture — solid-wood pieces for every room', 'ফার্নিচার — প্রতিটি ঘরের জন্য সলিড-কাঠের পিস'), description: t('Shop sofas, beds, dining, almirahs and more in Segun, Mahogany and Gorjon. 0% EMI, free assembly in Dhaka, 10-year frame warranty.', 'সেগুন, মেহগনি ও গর্জনে সোফা, খাট, ডাইনিং, আলমারি ও আরও অনেক কিছু। ০% ইএমআই, ঢাকায় ফ্রি অ্যাসেম্বলি, ১০ বছরের ফ্রেম ওয়ারেন্টি।'), noindex: filtered });
}

export default async function Shop({ params, searchParams }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const sp = await searchParams;
  const tx = await taxonomy();
  const roots = tx.categories.filter((c) => !c.parentId);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Furniture', 'ফার্নিচার') }];
  const activeCat = typeof sp.category === 'string' ? sp.category : '';
  return (
    <>
      <div className="container pt-6">
        <Breadcrumbs locale={locale} items={crumbs} />
        <h1 className="h-display text-3xl md:text-5xl mt-5">{t('Furniture', 'ফার্নিচার')}</h1>
        <p className="text-muted mt-2 max-w-2xl">{t('Solid-wood pieces in Segun, Mahogany and Gorjon — handcrafted in Bangladesh with a 10-year frame warranty, 0% EMI and free assembly in Dhaka.', 'সেগুন, মেহগনি ও গর্জন কাঠের সলিড পিস — বাংলাদেশে হাতে তৈরি, ১০ বছরের ফ্রেম ওয়ারেন্টি, ০% ইএমআই ও ঢাকায় ফ্রি অ্যাসেম্বলি।')}</p>
        <div className="mt-6 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
          <Link href={lp(locale, '/shop')} className={`chip shrink-0 ${!activeCat ? 'chip-active' : ''}`}>{t('All', 'সব')}</Link>
          {roots.map((c) => <Link key={c.slug} href={lp(locale, `/shop/${c.slug}`)} className="chip shrink-0">{f(c, 'name')}</Link>)}
        </div>
      </div>
      <CatalogView locale={locale} searchParams={sp} basePath="/shop" />
      <JsonLd data={[breadcrumbLd(locale, crumbs), await itemListLd(locale, 'Furniture', parseFilters(sp))]} />
    </>
  );
}
