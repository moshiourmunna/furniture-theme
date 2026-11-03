import type { Metadata } from 'next';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui';
import { CatalogView } from '@/components/shop/catalog-view';
import { SearchBox } from '@/components/shop/search-box';

type Props = LocaleParams & { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/search', title: t('Search', 'খুঁজুন'), description: t('Search Shekor furniture.', 'শেকড় ফার্নিচার খুঁজুন।'), noindex: true });
}

export default async function SearchPage({ params, searchParams }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  return (
    <>
      <div className="container pt-6">
        <Breadcrumbs locale={locale} items={[{ name: t('Home', 'হোম'), path: '/' }, { name: t('Search', 'খুঁজুন') }]} />
        <h1 className="h-display text-3xl md:text-5xl mt-5">{q ? <>{t('Results for', 'ফলাফল:')} “{q}”</> : t('Search', 'খুঁজুন')}</h1>
        <SearchBox initial={q} />
      </div>
      <CatalogView locale={locale} searchParams={sp} basePath="/search" />
    </>
  );
}
