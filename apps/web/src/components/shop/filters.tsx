'use client';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../providers';

export interface FacetOption { slug: string; nameEn: string; nameBn: string; count: number }
export interface FacetData { category?: FacetOption[]; room: FacetOption[]; material: FacetOption[]; brand: FacetOption[]; priceRange: { min: number; max: number } }

const ARRAY_KEYS = ['category', 'room', 'material', 'brand'] as const;
const FLAG_KEYS: [string, string, string][] = [['inStock', 'In stock only', 'শুধু স্টকে আছে'], ['emi', '0% EMI available', '০% ইএমআই আছে'], ['sale', 'On sale', 'ছাড়ে আছে']];

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const push = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete('page');
    const qs = p.toString();
    start(() => router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false }));
  };
  return { sp, push, pending };
}

function Group({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="border-b border-line py-4 group/f" open={open}>
      <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm">{title}<ChevronDown className="w-4 h-4 group-open/f:rotate-180 transition" /></summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

function Panel({ facets, prefix }: { facets: FacetData; prefix: string }) {
  const { t, locale } = useStore();
  const { sp, push } = useFilterNav();
  const sel = (k: string) => (sp.get(k) ?? '').split(',').filter(Boolean);
  const toggle = (k: string, v: string) => push((p) => {
    const cur = new Set((p.get(k) ?? '').split(',').filter(Boolean));
    if (cur.has(v)) cur.delete(v); else cur.add(v);
    if (cur.size) p.set(k, [...cur].join(',')); else p.delete(k);
  });
  const [minP, setMin] = useState(sp.get('minPrice') ?? '');
  const [maxP, setMax] = useState(sp.get('maxPrice') ?? '');
  // keep inputs in sync when the URL changes (e.g. "Clear all")
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMin(sp.get('minPrice') ?? ''); setMax(sp.get('maxPrice') ?? ''); }, [sp]);
  const n = (v: number) => (locale === 'bn' ? String(v).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : String(v));
  const checks = (k: string, items: FacetOption[]) => (
    <ul className="space-y-2.5">
      {items.map((o) => (
        <li key={o.slug}>
          <label className={`flex items-center gap-2.5 text-sm cursor-pointer ${o.count === 0 && !sel(k).includes(o.slug) ? 'opacity-50' : ''}`}>
            <input type="checkbox" className="w-4 h-4 rounded accent-[rgb(var(--primary))]" checked={sel(k).includes(o.slug)} onChange={() => toggle(k, o.slug)} data-testid={`f-${k}-${o.slug}`} />
            <span className="flex-1">{locale === 'bn' ? o.nameBn : o.nameEn}</span><span className="text-xs text-muted">{n(o.count)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <Group title={t('Availability & offers', 'প্রাপ্যতা ও অফার')}>
        {FLAG_KEYS.map(([k, en, bn]) => {
          const on = sp.get(k) === '1';
          return (
            <label key={k} className="flex items-center justify-between text-sm py-1.5">{t(en, bn)}
              <button type="button" role="switch" aria-checked={on} aria-label={t(en, bn)} data-switch data-testid={`f-${k}`} onClick={() => push((p) => (on ? p.delete(k) : p.set(k, '1')))} />
            </label>
          );
        })}
      </Group>
      <Group title={t('Price', 'মূল্য')}>
        <form className="flex items-end gap-2 text-sm" onSubmit={(e) => { e.preventDefault(); push((p) => { if (minP) p.set('minPrice', minP); else p.delete('minPrice'); if (maxP) p.set('maxPrice', maxP); else p.delete('maxPrice'); }); }}>
          <label className="flex-1 text-xs text-muted">{t('Min ৳', 'সর্বনিম্ন ৳')}<input id={`${prefix}-min`} inputMode="numeric" className="input h-10 mt-1" value={minP} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} placeholder={n(facets.priceRange.min)} /></label>
          <label className="flex-1 text-xs text-muted">{t('Max ৳', 'সর্বোচ্চ ৳')}<input id={`${prefix}-max`} inputMode="numeric" className="input h-10 mt-1" value={maxP} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} placeholder={n(facets.priceRange.max)} /></label>
          <button type="submit" className="btn btn-outline btn-sm h-10" data-testid="f-price-apply">{t('Go', 'যান')}</button>
        </form>
      </Group>
      {facets.category && facets.category.length > 0 && <Group title={t('Category', 'ক্যাটাগরি')}>{checks('category', facets.category)}</Group>}
      <Group title={t('Room', 'রুম')}>{checks('room', facets.room)}</Group>
      <Group title={t('Wood & material', 'কাঠ ও উপকরণ')}>{checks('material', facets.material)}</Group>
      <Group title={t('Brand', 'ব্র্যান্ড')} open={false}>{checks('brand', facets.brand)}</Group>
      <Group title={t('Customer rating', 'গ্রাহক রেটিং')} open={false}>
        <ul className="space-y-2.5">
          {[4, 3].map((r) => (
            <li key={r}><label className="flex items-center gap-2.5 text-sm cursor-pointer"><input type="radio" name={`${prefix}-rating`} className="w-4 h-4 accent-[rgb(var(--primary))]" checked={sp.get('rating') === String(r)} onChange={() => push((p) => p.set('rating', String(r)))} />{t(`${r}★ & above`, `${n(r)}★ ও তার বেশি`)}</label></li>
          ))}
        </ul>
      </Group>
    </>
  );
}

export function FiltersSidebar({ facets }: { facets: FacetData }) {
  const { t } = useStore();
  const { push } = useFilterNav();
  return (
    <aside className="hidden lg:block" aria-label={t('Filters', 'ফিল্টার')}>
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        <div className="flex items-center justify-between pb-2"><p className="font-semibold">{t('Filters', 'ফিল্টার')}</p><button type="button" className="text-sm text-muted link" onClick={() => push(clearAll)}>{t('Clear all', 'সব মুছুন')}</button></div>
        <Panel facets={facets} prefix="d" />
      </div>
    </aside>
  );
}

function clearAll(p: URLSearchParams) {
  for (const k of [...ARRAY_KEYS, 'minPrice', 'maxPrice', 'inStock', 'emi', 'sale', 'rating']) p.delete(k);
}

export function Toolbar({ total, facets, activeCount }: { total: number; facets: FacetData; activeCount: number }) {
  const { t, locale } = useStore();
  const { sp, push, pending } = useFilterNav();
  const [open, setOpen] = useState(false);
  const n = (v: number) => (locale === 'bn' ? String(v).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : String(v));
  const sorts: [string, string, string][] = [['featured', 'Recommended', 'প্রস্তাবিত'], ['price-asc', 'Price: low to high', 'দাম: কম থেকে বেশি'], ['price-desc', 'Price: high to low', 'দাম: বেশি থেকে কম'], ['newest', 'Newest', 'নতুন'], ['rating', 'Best rated', 'সেরা রেটিং'], ['bestselling', 'Most popular', 'জনপ্রিয়']];
  useEffect(() => {
    if (!open) return;
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => { document.body.style.overflow = o; document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <>
      <div className={`flex flex-wrap items-center gap-3 justify-between pb-4 border-b border-line ${pending ? 'opacity-60' : ''}`}>
        <p className="text-sm text-muted" aria-live="polite"><span className="text-ink font-semibold" data-testid="result-count">{n(total)}</span> {t(total === 1 ? 'piece' : 'pieces', 'টি পিস')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm lg:hidden" onClick={() => setOpen(true)} data-testid="open-filters"><SlidersHorizontal className="w-4 h-4" />{t('Filters', 'ফিল্টার')}{activeCount > 0 && <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] grid place-items-center">{n(activeCount)}</span>}</button>
          <label htmlFor="sort" className="sr-only">{t('Sort by', 'সাজান')}</label>
          <select id="sort" className="input h-10 w-auto pr-8 rounded-full text-sm" value={sp.get('sort') ?? 'featured'} onChange={(e) => push((p) => (e.target.value === 'featured' ? p.delete('sort') : p.set('sort', e.target.value)))} data-testid="sort">
            {sorts.map(([v, en, bn]) => <option key={v} value={v}>{t(en, bn)}</option>)}
          </select>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('Filters', 'ফিল্টার')} data-testid="filter-drawer">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl bg-bg flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-5 h-14 border-b border-line"><p className="font-semibold">{t('Filters', 'ফিল্টার')}</p><button type="button" className="btn-icon -mr-2" onClick={() => setOpen(false)} aria-label={t('Close filters', 'ফিল্টার বন্ধ করুন')}><X /></button></div>
            <div className="flex-1 overflow-y-auto px-5"><Panel facets={facets} prefix="m" /></div>
            <div className="p-4 border-t border-line grid grid-cols-2 gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button type="button" className="btn btn-outline" onClick={() => push(clearAll)}>{t('Clear all', 'সব মুছুন')}</button>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>{t(`Show ${total} results`, `${n(total)}টি ফলাফল দেখুন`)}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AppliedChips({ chips }: { chips: { key: string; value?: string; label: string }[] }) {
  const { t } = useStore();
  const { push } = useFilterNav();
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 py-4" data-testid="applied-filters">
      {chips.map((c) => (
        <button key={`${c.key}-${c.value ?? ''}`} type="button" className="chip h-8 text-xs bg-surface-2" aria-label={`${t('Remove filter', 'ফিল্টার সরান')}: ${c.label}`} onClick={() => push((p) => {
          if (!c.value) { p.delete(c.key); return; }
          const cur = (p.get(c.key) ?? '').split(',').filter((x) => x && x !== c.value);
          if (cur.length) p.set(c.key, cur.join(',')); else p.delete(c.key);
        })}>{c.label}<X className="w-3.5 h-3.5" /></button>
      ))}
      <button type="button" className="text-xs link text-muted" onClick={() => push(clearAll)}>{t('Clear all', 'সব মুছুন')}</button>
    </div>
  );
}
