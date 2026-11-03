'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Minus, X } from 'lucide-react';
import type { ProductCardDTO } from '@/server/services/catalog';
import { api } from '@/lib/api';
import { lp, money, num, pf } from '@/lib/i18n';
import { useStore } from '../providers';
import { ClientProductCard } from '../product/client-card';
import { Stars } from '../ui';

function useCards(ids: number[], ready: boolean) {
  const [items, setItems] = useState<ProductCardDTO[] | null>(null);
  const key = ids.join(',');
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!ids.length) { setItems([]); return; }
    api<{ items: ProductCardDTO[] }>(`/products?ids=${key}&pageSize=48`).then((r) => setItems(ids.map((i) => r.items.find((x) => x.id === i)).filter(Boolean) as ProductCardDTO[])).catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return items;
}

export function WishlistPage() {
  const { t, locale, wishlist, cartReady, me } = useStore();
  const items = useCards(wishlist, cartReady);
  return (
    <div className="container pt-8">
      <h1 className="h-display text-4xl md:text-5xl">{t('Wishlist', 'উইশলিস্ট')} {items && items.length > 0 && <span className="text-muted text-2xl">({num(locale, items.length)})</span>}</h1>
      {!me && <p className="text-sm text-muted mt-3">{t('Saved on this device.', 'এই ডিভাইসে সংরক্ষিত।')} <Link className="link" href={lp(locale, `/login?next=/${locale}/wishlist`)}>{t('Sign in', 'সাইন ইন')}</Link> {t('to keep it across devices.', 'করে সব ডিভাইসে রাখুন।')}</p>}
      {items === null ? <p className="py-20 text-center text-muted">{t('Loading…', 'লোড হচ্ছে…')}</p> : !items.length ? (
        <div className="py-20 text-center" data-testid="wishlist-empty"><p className="h-serif text-2xl">{t('Nothing saved yet', 'এখনো কিছু সংরক্ষিত নেই')}</p><p className="text-muted mt-2">{t('Tap the heart on any piece to keep it here.', 'যেকোনো পিসের হার্ট চাপলে এখানে থাকবে।')}</p><Link className="btn btn-primary mt-8" href={lp(locale, '/shop')}>{t('Explore the shop', 'শপ দেখুন')}</Link></div>
      ) : <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8" data-testid="wishlist-grid">{items.map((p) => <ClientProductCard key={p.id} p={p} />)}</div>}
    </div>
  );
}

export function ComparePage() {
  const { t, locale, compare, toggleCompare, clearCompare, cartReady, addToCart } = useStore();
  const items = useCards(compare, cartReady);
  const f = pf(locale);
  const yes = <Check className="w-4 h-4 text-success" aria-label={t('Yes', 'হ্যাঁ')} />;
  const no = <Minus className="w-4 h-4 text-muted" aria-label={t('No', 'না')} />;
  const stock = (s: string) => s === 'IN_STOCK' ? t('In stock', 'স্টকে আছে') : s === 'LOW' ? t('Low stock', 'স্টক কম') : s === 'MADE_TO_ORDER' ? t('Made to order', 'অর্ডারে তৈরি') : t('Out of stock', 'স্টক নেই');
  const rows: [string, (p: ProductCardDTO) => React.ReactNode][] = [
    [t('Price', 'দাম'), (p) => <span className="font-medium">{money(locale, p.price)}</span>],
    [t('Rating', 'রেটিং'), (p) => p.ratingCount ? <span className="flex items-center gap-2"><Stars value={p.ratingAvg} /><span className="text-xs text-muted">({num(locale, p.ratingCount)})</span></span> : '—'],
    [t('Material', 'উপাদান'), (p) => (locale === 'bn' ? p.materialBn : p.materialEn) ?? '—'],
    [t('Dimensions (W×D×H)', 'মাপ (প্র×গ×উ)'), (p) => p.widthCm ? `${num(locale, p.widthCm)} × ${num(locale, p.depthCm ?? 0)} × ${num(locale, p.heightCm ?? 0)} ${t('cm', 'সেমি')}` : '—'],
    [t('Seats', 'আসন'), (p) => p.seats ? num(locale, p.seats) : '—'],
    [t('Finishes', 'ফিনিশ'), (p) => <span className="flex gap-1">{p.swatches.map((s) => <span key={s.id} title={f(s, 'name')} className="w-4 h-4 rounded-full border border-line" style={{ background: s.hex ?? undefined }} />)}</span>],
    [t('Availability', 'প্রাপ্যতা'), (p) => stock(p.stockStatus)],
    [t('Warranty', 'ওয়ারেন্টি'), (p) => p.warrantyYears ? t(`${p.warrantyYears} years`, `${num('bn', p.warrantyYears)} বছর`) : '—'],
    [t('0% EMI', '০% ইএমআই'), (p) => (p.emiAvailable ? yes : no)],
  ];
  return (
    <div className="container pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="h-display text-4xl md:text-5xl">{t('Compare', 'তুলনা')}</h1>{items && items.length > 0 && <button type="button" className="link text-sm" onClick={clearCompare}>{t('Clear all', 'সব মুছুন')}</button>}</div>
      {items === null ? <p className="py-20 text-center text-muted">{t('Loading…', 'লোড হচ্ছে…')}</p> : !items.length ? (
        <div className="py-20 text-center" data-testid="compare-empty"><p className="h-serif text-2xl">{t('Nothing to compare yet', 'তুলনার জন্য কিছু নেই')}</p><p className="text-muted mt-2">{t('Add up to 4 pieces using “Compare” on any product.', 'যেকোনো পণ্যে “তুলনা” চেপে ৪টি পর্যন্ত যোগ করুন।')}</p><Link className="btn btn-primary mt-8" href={lp(locale, '/shop')}>{t('Explore the shop', 'শপ দেখুন')}</Link></div>
      ) : (
        <div className="mt-10 overflow-x-auto -mx-4 px-4" data-testid="compare-table">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <caption className="sr-only">{t('Product comparison', 'পণ্যের তুলনা')}</caption>
            <thead><tr><th scope="col" className="w-40" />{items.map((p) => (
              <th key={p.id} scope="col" className="align-top text-left font-normal p-3">
                <div className="relative">
                  <button type="button" onClick={() => toggleCompare(p.id)} className="absolute top-1 right-1 z-10 w-8 h-8 grid place-items-center bg-bg/90 rounded-full" aria-label={t(`Remove ${p.nameEn}`, `${p.nameBn} সরান`)}><X className="w-4 h-4" /></button>
                  <Link href={lp(locale, `/p/${p.slug}`)} className="block relative aspect-[4/5] bg-surface-2">{p.image && <Image src={p.image} alt={f(p, 'name')} fill sizes="200px" className="object-cover" />}</Link>
                  <Link href={lp(locale, `/p/${p.slug}`)} className="block h-serif text-lg mt-3 hover:text-accent">{f(p, 'name')}</Link>
                  <button type="button" className="btn btn-outline btn-sm mt-3 w-full" disabled={p.stockStatus === 'OUT_OF_STOCK'} onClick={() => { const v = p.swatches.find((s) => s.id === p.defaultVariantId); addToCart({ productId: p.id, variantId: p.defaultVariantId, qty: 1, slug: p.slug, nameEn: p.nameEn, nameBn: p.nameBn, variantEn: v?.nameEn ?? null, variantBn: v?.nameBn ?? null, image: p.image, price: p.price }); }}>{t('Add to bag', 'ব্যাগে যোগ করুন')}</button>
                </div>
              </th>
            ))}</tr></thead>
            <tbody>{rows.map(([label, fn]) => <tr key={label} className="border-t border-line"><th scope="row" className="text-left font-medium text-muted p-3 align-top">{label}</th>{items.map((p) => <td key={p.id} className="p-3 align-top">{fn(p)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
