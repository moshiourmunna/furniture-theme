import Image from 'next/image';
import { Check, Circle, X } from 'lucide-react';
import { ORDER_STATUS_LABEL, ORDER_TIMELINE, DELIVERY_SLOTS, type OrderStatusCode } from '@shekor/shared';
import { date, money, num, tr, type Locale } from '@/lib/i18n';

export interface OrderData {
  orderNo: string; status: OrderStatusCode; paymentStatus: string; paymentMethod: string; advancePercent: number | null; createdAt: string | Date;
  customerName: string; phone: string; email: string | null; division: string; district: string; area: string; line1: string; zoneName: string | null;
  deliveryDate: string | Date | null; deliverySlot: string | null; assembly: boolean; subtotal: number; discount: number; deliveryCharge: number; assemblyCharge: number; total: number; amountPaid: number; couponCode: string | null;
  items: { id: number; nameEn: string; nameBn: string; variantName: string | null; image: string | null; qty: number; lineTotal: number }[];
  history: { id: number; status: OrderStatusCode; note: string | null; createdAt: string | Date }[];
}

export const PAY_STATUS: Record<string, [string, string]> = { UNPAID: ['Pay on delivery', 'ডেলিভারিতে পরিশোধ'], PENDING: ['Awaiting payment', 'পেমেন্টের অপেক্ষায়'], PARTIAL: ['Advance paid', 'অগ্রিম পরিশোধিত'], PAID: ['Paid', 'পরিশোধিত'], FAILED: ['Payment failed', 'পেমেন্ট ব্যর্থ'], REFUNDED: ['Refunded', 'ফেরত দেওয়া হয়েছে'] };
export const PAY_METHOD: Record<string, [string, string]> = { bkash: ['bKash', 'বিকাশ'], nagad: ['Nagad', 'নগদ'], card: ['Card', 'কার্ড'], cod: ['Cash on delivery', 'ক্যাশ অন ডেলিভারি'], bank: ['Bank transfer', 'ব্যাংক ট্রান্সফার'] };

export function StatusBadge({ locale, status }: { locale: Locale; status: OrderStatusCode }) {
  const cls = status === 'DELIVERED' ? 'bg-success/15 text-success' : status === 'CANCELLED' || status === 'RETURNED' ? 'bg-sale/15 text-sale' : 'bg-primary/10 text-primary';
  return <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${cls}`} data-testid="order-status">{tr(locale)(...ORDER_STATUS_LABEL[status])}</span>;
}

export function OrderView({ locale, o }: { locale: Locale; o: OrderData }) {
  const t = tr(locale);
  const reached = new Set(o.history.map((h) => h.status));
  const terminal = o.status === 'CANCELLED' || o.status === 'RETURNED';
  const curIdx = ORDER_TIMELINE.indexOf(o.status);
  const slot = DELIVERY_SLOTS.find((s) => s.code === o.deliverySlot);
  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8" data-testid="order-view">
      <div className="space-y-8">
        <section className="card p-6" aria-label={t('Progress', 'অগ্রগতি')}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="label-sm">{t('Progress', 'অগ্রগতি')}</h2><StatusBadge locale={locale} status={o.status} /></div>
          {terminal ? <p className="mt-4 flex items-center gap-2 text-sale"><X className="w-5 h-5" />{t(...ORDER_STATUS_LABEL[o.status])}</p> : (
            <ol className="mt-6 grid gap-0">
              {ORDER_TIMELINE.map((s, i) => {
                const done = i <= curIdx || reached.has(s);
                const h = [...o.history].reverse().find((x) => x.status === s);
                return (
                  <li key={s} className="flex gap-4 pb-5 last:pb-0 relative">
                    {i < ORDER_TIMELINE.length - 1 && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${i < curIdx ? 'bg-primary' : 'bg-line'}`} aria-hidden />}
                    <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${done ? 'bg-primary text-white' : 'border border-line text-muted'}`}>{done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-2 h-2" />}</span>
                    <div><p className={done ? 'font-medium' : 'text-muted'}>{t(...ORDER_STATUS_LABEL[s])}{i === curIdx && <span className="sr-only"> ({t('current', 'বর্তমান')})</span>}</p>{h && <p className="text-xs text-muted">{date(locale, h.createdAt, true)}{h.note ? ` · ${h.note}` : ''}</p>}</div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <section className="card p-6">
          <h2 className="label-sm mb-4">{t('Items', 'পণ্য')}</h2>
          <ul className="divide-y divide-line">{o.items.map((i) => <li key={i.id} className="py-3 flex gap-4 items-center"><span className="relative w-16 h-20 bg-surface-2 shrink-0">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</span><span className="flex-1"><span className="block">{locale === 'bn' ? i.nameBn : i.nameEn}</span><span className="text-xs text-muted">{i.variantName ? `${i.variantName} · ` : ''}× {num(locale, i.qty)}</span></span><span>{money(locale, i.lineTotal)}</span></li>)}</ul>
        </section>
      </div>
      <aside className="space-y-6">
        <section className="card p-6 text-sm space-y-2">
          <h2 className="label-sm mb-2">{t('Payment', 'পেমেন্ট')}</h2>
          <div className="flex justify-between"><span className="text-muted">{t('Subtotal', 'সাবটোটাল')}</span><span>{money(locale, o.subtotal)}</span></div>
          {o.discount > 0 && <div className="flex justify-between text-success"><span>{t('Discount', 'ছাড়')} {o.couponCode && `(${o.couponCode})`}</span><span>−{money(locale, o.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">{t('Delivery', 'ডেলিভারি')}</span><span>{o.deliveryCharge ? money(locale, o.deliveryCharge) : t('Free', 'ফ্রি')}</span></div>
          {o.assemblyCharge > 0 && <div className="flex justify-between"><span className="text-muted">{t('Assembly', 'অ্যাসেম্বলি')}</span><span>{money(locale, o.assemblyCharge)}</span></div>}
          <div className="flex justify-between font-semibold text-base border-t border-line pt-2"><span>{t('Total', 'মোট')}</span><span data-testid="order-total">{money(locale, o.total)}</span></div>
          <div className="flex justify-between"><span className="text-muted">{t('Paid', 'পরিশোধিত')}</span><span data-testid="order-paid">{money(locale, o.amountPaid)}</span></div>
          {o.total - o.amountPaid > 0 && <div className="flex justify-between"><span className="text-muted">{t('Balance due', 'বাকি')}</span><span>{money(locale, o.total - o.amountPaid)}</span></div>}
          <p className="pt-2">{t(...(PAY_METHOD[o.paymentMethod] ?? [o.paymentMethod, o.paymentMethod]))} · <span data-testid="payment-status">{t(...(PAY_STATUS[o.paymentStatus] ?? [o.paymentStatus, o.paymentStatus]))}</span></p>
        </section>
        <section className="card p-6 text-sm space-y-1">
          <h2 className="label-sm mb-2">{t('Delivery', 'ডেলিভারি')}</h2>
          <p>{o.customerName} · {o.phone}</p>
          <p className="text-muted">{o.line1}, {o.area}, {o.district}, {o.division}</p>
          {o.deliveryDate && <p className="pt-2">{date(locale, o.deliveryDate)}{slot ? ` · ${t(slot.en, slot.bn)}` : ''}</p>}
          {o.assembly && <p className="text-muted">{t('Assembly included', 'অ্যাসেম্বলিসহ')}</p>}
        </section>
      </aside>
    </div>
  );
}
