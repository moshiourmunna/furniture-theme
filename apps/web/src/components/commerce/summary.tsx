'use client';
import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { money } from '@/lib/i18n';
import { useStore } from '../providers';
import { COUPON_REASON, type Quote } from './use-quote';

export function OrderSummary({ quote, loading, coupon, setCoupon, children, showPayNow }: { quote: Quote | null; loading: boolean; coupon: string; setCoupon: (c: string) => void; children?: React.ReactNode; showPayNow?: boolean }) {
  const { t, locale } = useStore();
  const [code, setCode] = useState(coupon);
  const tt = quote?.totals;
  const row = (label: string, value: React.ReactNode, cls = '') => <div className={`flex justify-between gap-4 text-sm ${cls}`}><dt className="text-muted">{label}</dt><dd>{value}</dd></div>;
  const reason = quote?.coupon && !quote.coupon.ok ? COUPON_REASON[quote.coupon.reason ?? ''] ?? ['This code can’t be applied', 'এই কোড প্রযোজ্য নয়'] : null;
  return (
    <aside className="card p-6 space-y-5 lg:sticky lg:top-28" aria-label={t('Order summary', 'অর্ডার সারাংশ')} aria-busy={loading} data-testid="order-summary">
      <h2 className="label-sm">{t('Order summary', 'অর্ডার সারাংশ')}</h2>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setCoupon(code.trim().toUpperCase()); }}>
        <label htmlFor="coupon" className="sr-only">{t('Coupon code', 'কুপন কোড')}</label>
        <div className="relative flex-1"><Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input id="coupon" className="input h-11 pl-9 uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('Coupon code', 'কুপন কোড')} data-testid="coupon-input" /></div>
        <button type="submit" className="btn btn-outline btn-sm h-11" data-testid="coupon-apply">{t('Apply', 'প্রয়োগ')}</button>
      </form>
      {quote?.coupon?.ok && <p className="flex items-center justify-between text-sm text-success" data-testid="coupon-ok"><span>{t('Applied', 'প্রয়োগ হয়েছে')}: <strong>{quote.coupon.code}</strong></span><button type="button" onClick={() => { setCode(''); setCoupon(''); }} aria-label={t('Remove coupon', 'কুপন সরান')}><X className="w-4 h-4" /></button></p>}
      {reason && <p className="text-sm text-sale" role="alert" data-testid="coupon-error">{t(...reason)}</p>}
      <dl className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
        {row(t('Subtotal', 'সাবটোটাল'), tt ? money(locale, tt.subtotal) : '—')}
        {tt && tt.discount > 0 && row(t('Discount', 'ছাড়'), `−${money(locale, tt.discount)}`, 'text-success')}
        {row(t('Delivery', 'ডেলিভারি'), !quote?.zone ? t('Calculated at checkout', 'চেকআউটে হিসাব হবে') : tt?.deliveryCharge ? money(locale, tt.deliveryCharge) : t('Free', 'ফ্রি'))}
        {tt && tt.assemblyCharge > 0 && row(t('Assembly', 'অ্যাসেম্বলি'), money(locale, tt.assemblyCharge))}
        <div className="flex justify-between gap-4 pt-3 border-t border-line text-base font-semibold"><dt>{t('Total', 'মোট')}</dt><dd data-testid="summary-total">{tt ? money(locale, tt.total) : '—'}</dd></div>
        {showPayNow && tt && tt.payNow !== tt.total && (
          <>
            {row(t(`Pay now (${tt.advancePercent}% advance)`, `এখন পরিশোধ (${tt.advancePercent}% অগ্রিম)`), <strong data-testid="summary-paynow">{money(locale, tt.payNow)}</strong>)}
            {row(t('Due on delivery', 'ডেলিভারিতে বাকি'), money(locale, tt.total - tt.payNow))}
          </>
        )}
      </dl>
      {children}
    </aside>
  );
}
