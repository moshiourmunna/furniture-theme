'use client';
import { useEffect, useState } from 'react';
import { useStore } from '../providers';
import { api } from '@/lib/api';
import type { ProductCardDTO } from '@/server/services/catalog';
import { ClientProductCard } from './client-card';

export function Tabs({ tabs }: { tabs: { key: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const { t } = useStore();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length];
    setActive(n.key);
    document.getElementById(`tab-${n.key}`)?.focus();
  };
  return (
    <section className="container mt-16">
      <div className="flex overflow-x-auto no-scrollbar border-b border-line" role="tablist" aria-label={t('Product details', 'পণ্যের বিস্তারিত')}>
        {tabs.map((x, i) => (
          <button key={x.key} id={`tab-${x.key}`} type="button" role="tab" aria-controls={`panel-${x.key}`} aria-selected={active === x.key} tabIndex={active === x.key ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => setActive(x.key)}
            className={`shrink-0 px-1 py-3 mr-6 border-b-2 text-sm font-semibold ${active === x.key ? 'border-ink text-ink' : 'border-transparent text-muted'}`} data-testid={`tab-${x.key}`}>{x.label}</button>
        ))}
      </div>
      {tabs.map((x) => <div key={x.key} role="tabpanel" id={`panel-${x.key}`} aria-labelledby={`tab-${x.key}`} hidden={active !== x.key} className="pt-6">{x.content}</div>)}
    </section>
  );
}

/** Records the product in localStorage and shows the other recently viewed pieces. */
export function RecentlyViewed({ id }: { id: number }) {
  const { t } = useStore();
  const [items, setItems] = useState<ProductCardDTO[]>([]);
  useEffect(() => {
    let ids: number[] = [];
    try { ids = JSON.parse(localStorage.getItem('shekor-recent') || '[]'); } catch { /* ignore */ }
    const others = ids.filter((x) => x !== id).slice(0, 4);
    try { localStorage.setItem('shekor-recent', JSON.stringify([id, ...others].slice(0, 12))); } catch { /* ignore */ }
    if (others.length) api<{ items: ProductCardDTO[] }>(`/products?ids=${others.join(',')}&pageSize=4`).then((r) => setItems(others.map((o) => r.items.find((x) => x.id === o)).filter(Boolean) as ProductCardDTO[])).catch(() => {});
  }, [id]);
  if (!items.length) return null;
  return (
    <section className="container mt-20">
      <p className="eyebrow mb-4">{t('History', 'ইতিহাস')}</p><h2 className="h-display text-4xl mb-10">{t('Recently viewed', 'সম্প্রতি দেখা')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">{items.map((p) => <ClientProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}
