'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { lp, money } from '@/lib/i18n';
import { useStore } from '../providers';

interface Session { provider: 'bkash' | 'nagad' | 'card'; amount: number; status: string; kind: string; order: { orderNo: string; customerName: string; total: number } }
const BRAND = { bkash: ['bKash', '#E2136E'], nagad: ['Nagad', '#EC1C24'], card: ['SSLCommerz', '#1A4D8F'] } as const;

/** Simulated payment gateway (PAYMENT_MODE=mock). Real gateways redirect to their own hosted pages instead. */
export function PayMock() {
  const { t, locale } = useStore();
  const sp = useSearchParams();
  const router = useRouter();
  const session = sp.get('session') ?? '';
  const [s, setS] = useState<Session | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState('');
  useEffect(() => { api<Session>(`/payments/mock/session?session=${encodeURIComponent(session)}`).then(setS).catch((e) => setErr(e.message)); }, [session]);
  const finish = async (outcome: 'success' | 'fail' | 'cancel') => {
    setBusy(true);
    try {
      const r = await api<{ orderNo: string; token: string; status: string }>('/payments/mock/complete', { body: { session, outcome } });
      router.replace(lp(locale, `/order/${r.orderNo}?token=${r.token}&payment=${r.status}`));
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  if (err) return <div className="container py-24 text-center"><h1 className="h-display text-3xl">{t('Payment session not found', 'পেমেন্ট সেশন পাওয়া যায়নি')}</h1><p className="text-muted mt-2">{err}</p></div>;
  if (!s) return <div className="container py-24 text-center text-muted">{t('Connecting to the payment gateway…', 'পেমেন্ট গেটওয়েতে যুক্ত হচ্ছে…')}</div>;
  const [name, color] = BRAND[s.provider];
  return (
    <div className="container py-16 max-w-md" data-testid="pay-mock">
      <div className="card overflow-hidden">
        <div className="p-6 text-white" style={{ background: color }}><p className="text-xs uppercase tracking-widest opacity-80">{t('Test gateway', 'টেস্ট গেটওয়ে')}</p><h1 className="text-2xl font-semibold mt-1">{name}</h1></div>
        <div className="p-6 space-y-5">
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-muted">{t('Merchant', 'মার্চেন্ট')}</dt><dd>Shekor Furniture</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t('Order', 'অর্ডার')}</dt><dd>{s.order.orderNo}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>{t('Amount', 'পরিমাণ')}</dt><dd data-testid="pay-amount">{money(locale, s.amount)}</dd></div>
          </dl>
          {s.status !== 'initiated' ? <p className="text-sm">{t('This payment was already processed.', 'এই পেমেন্ট আগেই সম্পন্ন হয়েছে।')}</p> : (
            <>
              {s.provider === 'card' ? <p className="text-sm text-muted">{t('Card form is simulated. Use any test card.', 'কার্ড ফর্মটি সিমুলেটেড।')}</p> : (
                <div><label htmlFor="pin" className="label">{t('Wallet PIN (any 4–5 digits)', 'ওয়ালেট পিন (যেকোনো ৪–৫ সংখ্যা)')}</label><input id="pin" className="input" inputMode="numeric" type="password" maxLength={5} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} autoComplete="off" /></div>
              )}
              <button type="button" className="btn w-full text-white" style={{ background: color }} disabled={busy || (s.provider !== 'card' && pin.length < 4)} onClick={() => finish('success')} data-testid="pay-confirm">{t('Confirm payment', 'পেমেন্ট নিশ্চিত করুন')}</button>
              <div className="flex gap-3"><button type="button" className="btn btn-outline btn-sm flex-1" disabled={busy} onClick={() => finish('fail')} data-testid="pay-fail">{t('Simulate failure', 'ব্যর্থতা সিমুলেট')}</button><button type="button" className="btn btn-ghost btn-sm flex-1" disabled={busy} onClick={() => finish('cancel')} data-testid="pay-cancel">{t('Cancel', 'বাতিল')}</button></div>
            </>
          )}
          <p className="text-xs text-muted flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" />{t('Development mock — no real money moves.', 'ডেভেলপমেন্ট মক — কোনো আসল টাকা লেনদেন হয় না।')}</p>
        </div>
      </div>
    </div>
  );
}
