'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '../providers';
import { OrderView, type OrderData } from './order-view';

export function TrackPage() {
  const { t, locale, me } = useStore();
  const sp = useSearchParams();
  const [orderNo, setOrderNo] = useState(sp.get('order') ?? '');
  const [phone, setPhone] = useState('');
  const [o, setO] = useState<OrderData | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (me?.phone && !phone) setPhone(me.phone); }, [me, phone]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { setO(await api<OrderData>(`/orders/track?orderNo=${encodeURIComponent(orderNo.trim())}&phone=${encodeURIComponent(phone.trim())}`)); }
    catch { setO(null); setErr(t('We couldn’t find an order with these details. Check the order number and the phone used at checkout.', 'এই তথ্যে কোনো অর্ডার পাওয়া যায়নি। অর্ডার নম্বর ও চেকআউটের ফোন নম্বর মিলিয়ে দেখুন।')); }
    finally { setBusy(false); }
  };
  return (
    <div className="container pt-8">
      <div className="max-w-xl">
        <p className="eyebrow">{t('Order tracking', 'অর্ডার ট্র্যাকিং')}</p>
        <h1 className="h-display text-4xl md:text-5xl mt-3">{t('Where’s my furniture?', 'আমার ফার্নিচার কোথায়?')}</h1>
        <p className="text-muted mt-3">{t('Enter your order number (e.g. SHK-284716) and the mobile number used at checkout.', 'অর্ডার নম্বর (যেমন SHK-284716) ও চেকআউটের মোবাইল নম্বর দিন।')}</p>
        <form onSubmit={submit} className="mt-8 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" data-testid="track-form">
          <div><label htmlFor="tr-no" className="label">{t('Order number', 'অর্ডার নম্বর')}</label><input id="tr-no" className="input uppercase" required value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="SHK-" /></div>
          <div><label htmlFor="tr-ph" className="label">{t('Mobile number', 'মোবাইল নম্বর')}</label><input id="tr-ph" className="input" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></div>
          <button type="submit" className="btn btn-primary" disabled={busy} data-testid="track-submit">{t('Track', 'ট্র্যাক')}</button>
        </form>
        {err && <p className="text-sm text-sale mt-4" role="alert" data-testid="track-error">{err}</p>}
      </div>
      {o && <div className="mt-12"><h2 className="h-serif text-2xl mb-6">{t('Order', 'অর্ডার')} {o.orderNo}</h2><OrderView locale={locale} o={o} /></div>}
    </div>
  );
}
