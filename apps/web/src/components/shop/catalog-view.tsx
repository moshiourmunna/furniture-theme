import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { facetCounts, listProducts, parseFilters, taxonomy, type ProductFilters } from '@/server/services/catalog';
import { lp, money, num, pf, tr, type Locale } from '@/lib/i18n';
import { ProductGrid } from '../product-card';
import { Empty } from '../ui';
import { AppliedChips, FiltersSidebar, Toolbar, type FacetData } from './filters';

type SP = Record<string, string | string[] | undefined>;

export async function CatalogView({ locale, searchParams, basePath, fixed = {}, showCategoryFacet = true }: { locale: Locale; searchParams: SP; basePath: string; fixed?: Partial<ProductFilters>; showCategoryFacet?: boolean }) {
  const t = tr(locale);
  const f = pf(locale);
  const filters: ProductFilters = { ...parseFilters(searchParams), ...fixed };
  const [res, counts, tx] = await Promise.all([listProducts(filters), facetCounts(filters), taxonomy()]);
  const opt = <T extends { id: number; slug: string; nameEn: string; nameBn: string }>(rows: T[], c: Record<string, number>) => rows.map((r) => ({ slug: r.slug, nameEn: r.nameEn, nameBn: r.nameBn, count: c[r.id] ?? 0 }));
  const facets: FacetData = {
    category: showCategoryFacet ? opt(tx.categories, counts.category) : undefined,
    room: opt(tx.rooms, counts.room), material: opt(tx.materials, counts.material).filter((m) => m.count > 0 || filters.material?.includes(m.slug)), brand: opt(tx.brands, counts.brand),
    priceRange: res.priceRange,
  };
  const name = (rows: { slug: string; nameEn: string; nameBn: string }[], s: string) => { const r = rows.find((x) => x.slug === s); return r ? f(r, 'name') : s; };
  const chips: { key: string; value?: string; label: string }[] = [];
  if (showCategoryFacet) for (const s of filters.category ?? []) chips.push({ key: 'category', value: s, label: name(tx.categories, s) });
  for (const s of filters.room ?? []) chips.push({ key: 'room', value: s, label: name(tx.rooms, s) });
  for (const s of filters.material ?? []) chips.push({ key: 'material', value: s, label: name(tx.materials, s) });
  for (const s of filters.brand ?? []) chips.push({ key: 'brand', value: s, label: name(tx.brands, s) });
  if (filters.minPrice != null) chips.push({ key: 'minPrice', label: `≥ ${money(locale, filters.minPrice)}` });
  if (filters.maxPrice != null) chips.push({ key: 'maxPrice', label: `≤ ${money(locale, filters.maxPrice)}` });
  if (filters.inStock) chips.push({ key: 'inStock', label: t('In stock', 'স্টকে আছে') });
  if (filters.emi) chips.push({ key: 'emi', label: t('0% EMI', '০% ইএমআই') });
  if (filters.sale) chips.push({ key: 'sale', label: t('On sale', 'ছাড়ে আছে') });
  if (filters.rating) chips.push({ key: 'rating', label: `${num(locale, filters.rating)}★+` });

  const qs = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v != null && k !== 'page') p.set(k, Array.isArray(v) ? v.join(',') : v);
    if (page > 1) p.set('page', String(page));
    const s = p.toString();
    return lp(locale, `${basePath}${s ? `?${s}` : ''}`);
  };
  const from = (res.page - 1) * res.pageSize + 1;
  const to = Math.min(res.total, res.page * res.pageSize);
  const pages = Array.from({ length: res.pages }, (_, i) => i + 1).filter((p) => p === 1 || p === res.pages || Math.abs(p - res.page) <= 1);

  return (
    <div className="container mt-6 grid lg:grid-cols-[260px_1fr] gap-8">
      <FiltersSidebar facets={facets} />
      <section aria-label={t('Products', 'পণ্য')}>
        <h2 className="sr-only">{t('Products', 'পণ্য')}</h2>
        <Toolbar total={res.total} facets={facets} activeCount={chips.length} />
        <AppliedChips chips={chips} />
        <div className="pt-4">
          {res.items.length ? <ProductGrid items={res.items} locale={locale} eager={3} cols="grid-cols-2 md:grid-cols-3" /> : (
            <Empty title={t('No pieces match these filters', 'এই ফিল্টারে কোনো পিস নেই')}>
              <p>{t('Try removing a filter, or ask us to make it to measure.', 'একটি ফিল্টার সরিয়ে দেখুন, অথবা মাপমতো বানাতে বলুন।')}</p>
              <Link href={lp(locale, '/custom')} className="btn btn-outline mt-4">{t('Request a custom piece', 'কাস্টম পিসের অনুরোধ')}</Link>
            </Empty>
          )}
        </div>
        {res.pages > 1 && (
          <>
            <nav className="mt-12 flex items-center justify-center gap-1 text-sm" aria-label={t('Pagination', 'পৃষ্ঠা নম্বর')} data-testid="pagination">
              {res.page > 1 ? <Link href={qs(res.page - 1)} className="btn-icon" aria-label={t('Previous page', 'আগের পৃষ্ঠা')}><ChevronLeft className="w-4 h-4" /></Link> : <span className="btn-icon opacity-30" aria-hidden><ChevronLeft className="w-4 h-4" /></span>}
              {pages.map((p, i) => (
                <span key={p} className="flex items-center">
                  {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
                  <Link href={qs(p)} className={`w-10 h-10 grid place-items-center rounded-full ${p === res.page ? 'bg-ink text-bg' : 'hover:bg-surface-2'}`} aria-current={p === res.page ? 'page' : undefined}>{num(locale, p)}</Link>
                </span>
              ))}
              {res.page < res.pages ? <Link href={qs(res.page + 1)} className="btn-icon" aria-label={t('Next page', 'পরের পৃষ্ঠা')}><ChevronRight className="w-4 h-4" /></Link> : <span className="btn-icon opacity-30" aria-hidden><ChevronRight className="w-4 h-4" /></span>}
            </nav>
            <p className="text-center text-xs text-muted mt-3">{t(`Showing ${from}–${to} of ${res.total}`, `${num('bn', res.total)}টির মধ্যে ${num('bn', from)}–${num('bn', to)} দেখানো হচ্ছে`)}</p>
          </>
        )}
        <div className="mt-16 bg-accent-soft p-6 md:p-8 flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div><p className="font-display text-xl">{t('Can’t find the right size?', 'সঠিক মাপ পাচ্ছেন না?')}</p><p className="text-sm text-muted">{t('We build any piece to your measurements in 3–6 weeks.', '৩–৬ সপ্তাহে আপনার মাপমতো যেকোনো পিস বানিয়ে দিই।')}</p></div>
          <Link href={lp(locale, '/custom')} className="btn btn-accent">{t('Request custom size', 'কাস্টম মাপের অনুরোধ')}</Link>
        </div>
      </section>
    </div>
  );
}

export async function itemListLd(locale: Locale, name: string, filters: ProductFilters) {
  const { items } = await listProducts(filters);
  const { abs } = await import('@/lib/seo');
  return { '@context': 'https://schema.org', '@type': 'ItemList', name, itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${locale}/p/${p.slug}`), name: locale === 'bn' ? p.nameBn : p.nameEn })) };
}
