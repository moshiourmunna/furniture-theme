import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { trackOrder } from '@/server/services/orders';
import { OrderView, type OrderData } from '@/components/commerce/order-view';
import { RetryPayment } from '@/components/commerce/retry-pay';
import { getLocale, lp, money, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type P = LocaleParams<{ orderNo: string }> & { searchParams: Promise<{ token?: string; placed?: string; payment?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/track', title: tr(locale)('Your order', 'আপনার অর্ডার'), description: '', noindex: true });
}

export default async function OrderPage({ params, searchParams }: P) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const { orderNo } = await params;
  const sp = await searchParams;
  if (!sp.token) notFound();
  const o = await trackOrder(orderNo, sp.token);
  if (!o) notFound();
  const failed = sp.payment === 'failed' || sp.payment === 'cancelled' || o.paymentStatus === 'FAILED';
  const due = o.status !== 'CANCELLED' && o.paymentMethod !== 'bank' && o.paymentMethod !== 'cod' ? o.paymentStatus === 'FAILED' || (o.paymentStatus === 'PENDING' && o.amountPaid === 0) : o.paymentMethod === 'cod' && !!o.advancePercent && o.amountPaid === 0;
  return (
    <div className="container pt-8 space-y-8" data-testid="order-page">
      <header className="text-center max-w-2xl mx-auto py-6">
        {failed ? <XCircle className="w-12 h-12 mx-auto text-sale" /> : <CheckCircle2 className="w-12 h-12 mx-auto text-success" />}
        <h1 className="h-display text-4xl md:text-5xl mt-4" data-testid="order-heading">
          {failed ? t('Payment didn’t go through', 'পেমেন্ট সম্পন্ন হয়নি') : sp.placed || sp.payment ? t('Thank you — your order is in', 'ধন্যবাদ — আপনার অর্ডার হয়েছে') : t('Your order', 'আপনার অর্ডার')}
        </h1>
        <p className="text-muted mt-3">{t('Order', 'অর্ডার')} <strong className="text-ink" data-testid="order-no">{o.orderNo}</strong> · {t('we’ve sent an SMS to', 'এসএমএস পাঠানো হয়েছে')} {o.phone}.</p>
        {o.paymentMethod === 'bank' && <p className="text-sm mt-3 bg-surface-2 p-4">{t(`Please transfer ${money('en', o.total)} to BRAC Bank A/C 1501 2024 5566 001 with reference ${o.orderNo}. We confirm within one working day.`, `অনুগ্রহ করে ${money('bn', o.total)} ব্র্যাক ব্যাংক হিসাব ১৫০১ ২০২৪ ৫৫৬৬ ০০১-এ রেফারেন্স ${o.orderNo} দিয়ে পাঠান।`)}</p>}
        {due && <div className="mt-6 flex justify-center"><RetryPayment orderNo={o.orderNo} token={o.trackingToken} /></div>}
        <div className="mt-6 flex justify-center gap-3 flex-wrap"><Link className="btn btn-outline btn-sm" href={lp(locale, `/track?order=${o.orderNo}`)}>{t('Track this order', 'অর্ডার ট্র্যাক করুন')}</Link><Link className="btn btn-ghost btn-sm" href={lp(locale, '/shop')}>{t('Continue shopping', 'কেনাকাটা চালিয়ে যান')}</Link></div>
      </header>
      <OrderView locale={locale} o={o as unknown as OrderData} />
    </div>
  );
}
