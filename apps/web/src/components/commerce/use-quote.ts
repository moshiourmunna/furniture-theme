'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CartLine } from '../providers';

export interface QuoteLine { productId: number; variantId: number | null; slug: string; nameEn: string; nameBn: string; variantEn: string | null; variantBn: string | null; image: string | null; qty: number; unitPrice: number; lineTotal: number; madeToOrder: boolean; leadTimeDays: number; stockQty: number; emiAvailable: boolean }
export interface Quote {
  lines: QuoteLine[]; issues: { productId: number; code: string }[];
  coupon: { code: string; ok: boolean; reason?: string; discount?: number } | null;
  zone: { id: number; nameEn: string; nameBn: string; leadDaysMin: number; leadDaysMax: number; codAvailable: boolean; freeOver: number | null } | null;
  totals: { subtotal: number; discount: number; deliveryCharge: number; assemblyCharge: number; total: number; payNow: number; advancePercent: number };
  freeShipping: boolean;
}
export interface QuoteOpts { couponCode?: string; division?: string; district?: string; assembly?: boolean; paymentMethod?: string; paymentPlan?: 'full' | 'advance'; advancePercent?: number }

/** Server-priced quote for the current bag (debounced). Client prices are display-only; the server is authoritative. */
export function useQuote(cart: CartLine[], ready: boolean, opts: QuoteOpts) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([cart.map((l) => [l.productId, l.variantId, l.qty]), opts]);
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!cart.length) { setQuote(null); return; }
    const ac = new AbortController();
    setLoading(true);
    const id = setTimeout(() => {
      api<Quote>('/cart/quote', { body: { items: cart.map((l) => ({ productId: l.productId, variantId: l.variantId ?? undefined, qty: l.qty })), ...opts, couponCode: opts.couponCode || undefined }, signal: ac.signal })
        .then(setQuote).catch(() => {}).finally(() => setLoading(false));
    }, 250);
    return () => { clearTimeout(id); ac.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return { quote, loading };
}

export const COUPON_REASON: Record<string, [string, string]> = {
  not_found: ['This code doesn’t exist', 'এই কোডটি নেই'], expired: ['This code has expired', 'এই কোডের মেয়াদ শেষ'], not_started: ['This code isn’t active yet', 'এই কোড এখনো চালু হয়নি'],
  inactive: ['This code is no longer active', 'এই কোড আর চালু নেই'], min_subtotal: ['Your bag is below the minimum for this code', 'এই কোডের জন্য ন্যূনতম অর্ডার পূরণ হয়নি'],
  limit_reached: ['This code has been fully used', 'এই কোডের ব্যবহার সীমা শেষ'], per_user_limit: ['You’ve already used this code', 'আপনি এই কোড আগেই ব্যবহার করেছেন'],
};
