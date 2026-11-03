'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { lp, money, num } from '@/lib/i18n';
import { useStore } from '../providers';
import { useQuote } from './use-quote';
import { OrderSummary } from './summary';

export function CartPage() {
  const { t, locale, cart, cartReady, setQty, removeLine, toggleWishlist } = useStore();
  const [coupon, setCoupon] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('shekor-coupon') ?? '' : ''));
  const { quote, loading } = useQuote(cart, cartReady, { couponCode: coupon });
  const applyCoupon = (c: string) => { setCoupon(c); try { sessionStorage.setItem('shekor-coupon', c); } catch { /* ignore */ } };
  if (!cartReady) return <div className="container py-24 text-center text-muted">{t('Loading your bag…', 'আপনার ব্যাগ লোড হচ্ছে…')}</div>;
  if (!cart.length) return (
    <div className="container py-24 text-center" data-testid="cart-empty">
      <h1 className="h-display text-4xl">{t('Your bag is empty', 'আপনার ব্যাগ খালি')}</h1>
      <p className="text-muted mt-3">{t('Find something you’ll keep for a lifetime.', 'সারাজীবন রেখে দেওয়ার মতো কিছু খুঁজে নিন।')}</p>
      <div className="mt-8 flex justify-center gap-3"><Link className="btn btn-primary" href={lp(locale, '/shop')}>{t('Shop furniture', 'ফার্নিচার কিনুন')}</Link><Link className="btn btn-outline" href={lp(locale, '/wishlist')}>{t('View wishlist', 'উইশলিস্ট দেখুন')}</Link></div>
    </div>
  );
  const issue = (pid: number) => quote?.issues.find((i) => i.productId === pid);
  return (
    <div className="container pt-8 grid lg:grid-cols-[1fr_380px] gap-10">
      <section>
        <h1 className="h-display text-4xl md:text-5xl">{t('Your bag', 'আপনার ব্যাগ')} <span className="text-muted text-2xl">({num(locale, cart.reduce((a, l) => a + l.qty, 0))})</span></h1>
        <ul className="mt-8 border-t border-line">
          {cart.map((l) => {
            const q = quote?.lines.find((x) => x.productId === l.productId && x.variantId === l.variantId);
            const is = issue(l.productId);
            return (
              <li key={`${l.productId}-${l.variantId}`} className="py-6 border-b border-line grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr_auto] gap-4 sm:gap-6" data-testid="cart-line">
                <Link href={lp(locale, `/p/${l.slug}`)} className="relative aspect-[4/5] bg-surface-2">{l.image && <Image src={l.image} alt={locale === 'bn' ? l.nameBn : l.nameEn} fill sizes="120px" className="object-cover" />}</Link>
                <div className="min-w-0">
                  <Link href={lp(locale, `/p/${l.slug}`)} className="h-serif text-xl hover:text-accent">{locale === 'bn' ? l.nameBn : l.nameEn}</Link>
                  {l.variantEn && <p className="text-sm text-muted mt-1">{locale === 'bn' ? l.variantBn : l.variantEn}</p>}
                  {q?.madeToOrder && <p className="text-xs text-accent mt-1">{t(`Made to order · about ${q.leadTimeDays} days`, `অর্ডারে তৈরি · প্রায় ${num('bn', q.leadTimeDays)} দিন`)}</p>}
                  {is && <p className="text-sm text-sale mt-2 flex items-center gap-1.5" role="alert"><AlertTriangle className="w-4 h-4" />{is.code === 'out_of_stock' ? t('Not enough stock — reduce the quantity or remove it', 'যথেষ্ট স্টক নেই — পরিমাণ কমান বা সরান') : t('No longer available — please remove it', 'আর পাওয়া যাচ্ছে না — দয়া করে সরান')}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center border border-line h-10">
                      <button type="button" className="w-10 h-full grid place-items-center disabled:opacity-30" disabled={l.qty <= 1} onClick={() => setQty(l.productId, l.variantId, l.qty - 1)} aria-label={t('Decrease quantity', 'পরিমাণ কমান')}><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center text-sm" data-testid="cart-qty">{num(locale, l.qty)}</span>
                      <button type="button" className="w-10 h-full grid place-items-center" onClick={() => setQty(l.productId, l.variantId, l.qty + 1)} aria-label={t('Increase quantity', 'পরিমাণ বাড়ান')}><Plus className="w-4 h-4" /></button>
                    </div>
                    <button type="button" className="text-sm link text-muted" onClick={() => { toggleWishlist(l.productId); removeLine(l.productId, l.variantId); }}>{t('Save for later', 'পরে কিনুন')}</button>
                    <button type="button" className="text-sm link text-muted" onClick={() => removeLine(l.productId, l.variantId)} data-testid="cart-remove">{t('Remove', 'সরান')}</button>
                  </div>
                </div>
                <p className="col-start-2 sm:col-start-auto sm:text-right font-medium">{money(locale, q?.lineTotal ?? l.price * l.qty)}</p>
              </li>
            );
          })}
        </ul>
        <Link href={lp(locale, '/shop')} className="link-line mt-8">{t('Continue shopping', 'কেনাকাটা চালিয়ে যান')}</Link>
      </section>
      <OrderSummary quote={quote} loading={loading} coupon={coupon} setCoupon={applyCoupon}>
        <Link href={lp(locale, '/checkout')} className={`btn btn-primary w-full ${quote?.issues.length ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={!!quote?.issues.length} data-testid="cart-checkout">{t('Checkout', 'চেকআউট')}</Link>
        <p className="text-xs text-muted text-center">{t('bKash · Nagad · Cards · 0% EMI · Cash on delivery', 'বিকাশ · নগদ · কার্ড · ০% ইএমআই · ক্যাশ অন ডেলিভারি')}</p>
      </OrderSummary>
    </div>
  );
}
