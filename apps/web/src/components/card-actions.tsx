'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, GitCompareArrows, Heart, X } from 'lucide-react';
import type { ProductCardDTO } from '@/server/services/catalog';
import { lp, money, pf } from '@/lib/i18n';
import { useStore } from './providers';

export function WishlistButton({ id, className = '' }: { id: number; className?: string }) {
  const { wishlist, toggleWishlist, t } = useStore();
  const on = wishlist.includes(id);
  return (
    <button type="button" onClick={() => toggleWishlist(id)} aria-pressed={on} aria-label={on ? t('Remove from wishlist', 'উইশলিস্ট থেকে সরান') : t('Save to wishlist', 'উইশলিস্টে রাখুন')}
      className={`btn-icon w-9 h-9 text-ink hover:bg-bg/80 ${className}`} data-testid="wishlist-toggle">
      <Heart className="w-[18px] h-[18px]" fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function CardActions({ p }: { p: ProductCardDTO }) {
  const { addToCart, compare, toggleCompare, t, locale } = useStore();
  const [qv, setQv] = useState(false);
  const inCompare = compare.includes(p.id);
  const f = pf(locale);
  const unavailable = p.stockStatus === 'OUT_OF_STOCK';
  const add = () =>
    addToCart({ productId: p.id, variantId: p.defaultVariantId, qty: 1, slug: p.slug, nameEn: p.nameEn, nameBn: p.nameBn, variantEn: p.swatches[0]?.nameEn, variantBn: p.swatches[0]?.nameBn, image: p.image, price: p.price });
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 max-md:hidden translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition duration-500 flex bg-bg/95 border-t border-line">
        <button type="button" disabled={unavailable} onClick={add} className="flex-1 h-12 text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-ink hover:text-bg transition disabled:opacity-50" data-testid="card-add">
          {unavailable ? t('Sold out', 'স্টক শেষ') : t('Add to bag', 'ব্যাগে যোগ করুন')}
        </button>
        <button type="button" onClick={() => setQv(true)} className="w-12 h-12 grid place-items-center border-l border-line hover:bg-surface-2" aria-label={t('Quick view', 'কুইক ভিউ')}><Eye className="w-4 h-4" /></button>
        <button type="button" onClick={() => toggleCompare(p.id)} className={`w-12 h-12 grid place-items-center border-l border-line hover:bg-surface-2 ${inCompare ? 'bg-ink text-bg' : ''}`} aria-pressed={inCompare} aria-label={t('Add to compare', 'তুলনায় যোগ করুন')} data-testid="card-compare"><GitCompareArrows className="w-4 h-4" /></button>
      </div>
      {qv && (
        <Modal title={t('Quick view', 'কুইক ভিউ')} onClose={() => setQv(false)} size="max-w-3xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-[4/5] bg-surface-2">{p.image && <Image src={p.image} alt={f(p, 'name')} fill sizes="(min-width:768px) 400px, 90vw" className="object-cover" />}</div>
            <div className="space-y-3">
              <p className="text-xs text-muted">{f(p, 'material')}</p>
              <p className="h-display text-2xl">{f(p, 'name')}</p>
              <p className="text-xl">{money(locale, p.price)} {p.compareAtPrice ? <s className="text-muted text-base">{money(locale, p.compareAtPrice)}</s> : null}</p>
              {p.widthCm && <p className="text-sm text-muted">{t('W × D × H', 'প্র × গ × উ')}: {p.widthCm} × {p.depthCm} × {p.heightCm} cm</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn btn-primary flex-1" disabled={unavailable} onClick={() => { add(); setQv(false); }}>{t('Add to bag', 'ব্যাগে যোগ করুন')}</button>
                <Link href={lp(locale, `/p/${p.slug}`)} className="btn btn-outline">{t('Details', 'বিস্তারিত')}</Link>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/** Accessible dialog: Esc closes, focus moves in and is restored on close, body scroll locked. */
export function Modal({ title, onClose, children, size = 'max-w-lg' }: { title: string; onClose: () => void; children: React.ReactNode; size?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, a, input, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = o; prev?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={ref} className={`relative w-full ${size} bg-bg shadow-pop max-h-[90vh] overflow-y-auto animate-fade-up`}>
        <div className="sticky top-0 bg-bg flex items-center justify-between px-6 py-4 border-b border-line z-10">
          <h2 className="label-sm">{title}</h2>
          <button type="button" className="btn-icon -mr-2" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
