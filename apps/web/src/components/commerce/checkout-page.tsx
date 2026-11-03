'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, CreditCard, Lock, Smartphone, Truck, Wallet } from 'lucide-react';
import { BD_DIVISIONS, BD_PHONE_RE, DELIVERY_SLOTS, EMI_MIN_ORDER, normalizePhone } from '@shekor/shared';
import { api, ApiClientError } from '@/lib/api';
import { lp, money, num } from '@/lib/i18n';
import { useStore } from '../providers';
import { useQuote } from './use-quote';
import { OrderSummary } from './summary';

type Method = 'bkash' | 'nagad' | 'card' | 'cod' | 'bank';
interface SavedAddress { id: number; label: string; name: string; phone: string; division: string; district: string; area: string; line1: string; isDefault: boolean }

const ymd = (d: Date) => new Date(d.getTime() + 6 * 3600_000).toISOString().slice(0, 10);

export function CheckoutPage() {
  const { t, locale, cart, cartReady, me, meLoaded, clearCart } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [c, setC] = useState({ name: '', phone: '', email: '' });
  const [a, setA] = useState({ division: 'Dhaka', district: 'Dhaka', area: '', line1: '' });
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [saveAddress, setSaveAddress] = useState(true);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [assembly, setAssembly] = useState(true);
  const [method, setMethod] = useState<Method>('bkash');
  const [plan, setPlan] = useState<'full' | 'advance'>('full');
  const [adv, setAdv] = useState(20);
  const [coupon, setCoupon] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
   
  useEffect(() => { try { setCoupon(sessionStorage.getItem('shekor-coupon') ?? ''); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!me) return;
     
    setC((x) => ({ name: x.name || me.name, phone: x.phone || me.phone || '', email: x.email || me.email || '' }));
     
    api<{ items: SavedAddress[] }>('/account/addresses').then((r) => {
      setSaved(r.items);
      const d = r.items.find((x) => x.isDefault) ?? r.items[0];
      if (d) setA({ division: d.division, district: d.district, area: d.area, line1: d.line1 });
    }).catch(() => {});
  }, [me]);
  const { quote, loading } = useQuote(cart, cartReady, { couponCode: coupon, division: a.division, district: a.district, assembly, paymentMethod: method, paymentPlan: plan, advancePercent: plan === 'advance' ? adv : undefined });
  const lead = useMemo(() => Math.max(quote?.zone?.leadDaysMin ?? 2, ...(quote?.lines.filter((l) => l.madeToOrder).map((l) => l.leadTimeDays) ?? [0])), [quote]);
  const minDate = ymd(new Date(Date.now() + lead * 86400_000));
   
  useEffect(() => { if (!date || date < minDate) setDate(minDate); }, [minDate, date]);
  const codOk = quote?.zone?.codAvailable ?? true;
   
  useEffect(() => { if (method === 'cod' && !codOk) setMethod('bkash'); }, [codOk, method]);
  const districts = BD_DIVISIONS.find((d) => d.en === a.division)?.districts ?? [];
  const total = quote?.totals.total ?? 0;

  if (!cartReady) return <div className="container py-24 text-center text-muted">{t('Loading…', 'লোড হচ্ছে…')}</div>;
  if (!cart.length) return <div className="container py-24 text-center"><h1 className="h-display text-4xl">{t('Your bag is empty', 'আপনার ব্যাগ খালি')}</h1><Link className="btn btn-primary mt-8" href={lp(locale, '/shop')}>{t('Shop furniture', 'ফার্নিচার কিনুন')}</Link></div>;

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (c.name.trim().length < 2) e.name = t('Enter your full name', 'পুরো নাম লিখুন');
    if (!BD_PHONE_RE.test(normalizePhone(c.phone))) e.phone = t('Enter a valid Bangladeshi mobile number (01XXXXXXXXX)', 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
    if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) e.email = t('Enter a valid email', 'সঠিক ইমেইল দিন');
    if (a.area.trim().length < 2) e.area = t('Enter your area / thana', 'এলাকা / থানা লিখুন');
    if (a.line1.trim().length < 4) e.line1 = t('Enter house, road and floor', 'বাড়ি, রোড ও তলা লিখুন');
    setErrors(e);
    if (Object.keys(e).length) document.getElementById(`co-${Object.keys(e)[0]}`)?.focus();
    return !Object.keys(e).length;
  };
  const place = async () => {
    if (!terms) { setErrors({ terms: t('Please accept the terms to continue', 'চালিয়ে যেতে শর্তাবলি গ্রহণ করুন') }); return; }
    setBusy(true); setErrors({});
    try {
      const r = await api<{ orderNo: string; trackingToken: string; redirectUrl: string | null }>('/checkout', { body: {
        items: cart.map((l) => ({ productId: l.productId, variantId: l.variantId ?? undefined, qty: l.qty })),
        customer: { name: c.name, phone: normalizePhone(c.phone), email: c.email || undefined }, address: a, deliveryDate: date, deliverySlot: slot, assembly,
        paymentMethod: method, paymentPlan: method === 'cod' ? 'full' : plan, advancePercent: method !== 'cod' && plan === 'advance' ? adv : undefined,
        couponCode: coupon || undefined, notes: notes || undefined, saveAddress: !!me && saveAddress, locale, acceptTerms: true,
      } });
      clearCart();
      try { sessionStorage.removeItem('shekor-coupon'); } catch { /* ignore */ }
      if (r.redirectUrl) window.location.assign(r.redirectUrl);
      else router.push(lp(locale, `/order/${r.orderNo}?token=${r.trackingToken}&placed=1`));
    } catch (x) {
      const e = x as ApiClientError;
      setErrors({ _form: e.code === 'cart_changed' ? t('Some items changed availability. Please review your bag.', 'কিছু পণ্যের প্রাপ্যতা বদলেছে। ব্যাগটি দেখে নিন।') : e.message });
      setBusy(false);
    }
  };

  const methods: [Method, string, string, string, string, React.ComponentType<{ className?: string }>][] = [
    ['bkash', 'bKash', 'বিকাশ', 'Pay instantly from your bKash wallet', 'বিকাশ ওয়ালেট থেকে সঙ্গে সঙ্গে পরিশোধ', Smartphone],
    ['nagad', 'Nagad', 'নগদ', 'Pay instantly from your Nagad wallet', 'নগদ ওয়ালেট থেকে সঙ্গে সঙ্গে পরিশোধ', Smartphone],
    ['card', 'Card / 0% EMI', 'কার্ড / ০% ইএমআই', total >= EMI_MIN_ORDER ? 'Visa, Mastercard, Amex — choose EMI at the gateway' : 'Visa, Mastercard, Amex via SSLCommerz', total >= EMI_MIN_ORDER ? 'ভিসা, মাস্টারকার্ড, অ্যামেক্স — গেটওয়েতে ইএমআই বেছে নিন' : 'SSLCommerz-এর মাধ্যমে কার্ড', CreditCard],
    ['cod', 'Cash on delivery', 'ক্যাশ অন ডেলিভারি', total >= 50000 ? '20% advance via bKash now, balance on delivery' : 'Pay in cash when your furniture arrives', total >= 50000 ? 'এখন বিকাশে ২০% অগ্রিম, বাকি ডেলিভারিতে' : 'ফার্নিচার পৌঁছালে নগদে পরিশোধ', Wallet],
    ['bank', 'Bank transfer', 'ব্যাংক ট্রান্সফার', 'We email a proforma invoice; we confirm once funds arrive', 'প্রোফর্মা চালান ইমেইলে পাঠাব; টাকা পৌঁছালে নিশ্চিত করব', Building2],
  ];
  const stepHead = (n: number, en: string, bn: string) => (
    <div className="flex items-center justify-between">
      <h2 className="h-display text-2xl flex items-center gap-3"><span className={`w-8 h-8 rounded-full grid place-items-center text-sm font-sans ${step >= n ? 'bg-ink text-bg' : 'border border-line text-muted'}`}>{num(locale, n)}</span>{t(en, bn)}</h2>
      {step > n && <button type="button" className="text-sm link" onClick={() => setStep(n)}>{t('Edit', 'সম্পাদনা')}</button>}
    </div>
  );
  const err = (k: string) => errors[k] && <p id={`co-${k}-err`} className="text-xs text-sale mt-1" role="alert">{errors[k]}</p>;
  const input = (k: string, label: string, value: string, set: (v: string) => void, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label htmlFor={`co-${k}`} className="label">{label}</label><input id={`co-${k}`} className="input" value={value} onChange={(e) => set(e.target.value)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `co-${k}-err` : undefined} {...extra} />{err(k)}</div>
  );

  return (
    <div className="container pt-8 grid lg:grid-cols-[1fr_380px] gap-10" data-testid="checkout">
      <div className="space-y-6">
        <h1 className="h-display text-4xl md:text-5xl flex items-center gap-3">{t('Checkout', 'চেকআউট')} <Lock className="w-5 h-5 text-muted" aria-label={t('Secure', 'নিরাপদ')} /></h1>
        {meLoaded && !me && <p className="text-sm text-muted">{t('Have an account?', 'অ্যাকাউন্ট আছে?')} <Link className="link" href={lp(locale, '/login?next=/' + locale + '/checkout')}>{t('Sign in', 'সাইন ইন')}</Link> {t('for faster checkout and loyalty points — or continue as a guest.', 'দ্রুত চেকআউট ও লয়্যালটি পয়েন্টের জন্য — অথবা অতিথি হিসেবে চালিয়ে যান।')}</p>}

        <section className="card p-6 space-y-5" aria-labelledby="s1">
          <div id="s1">{stepHead(1, 'Contact & address', 'যোগাযোগ ও ঠিকানা')}</div>
          {step === 1 ? (
            <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); if (validate1()) setStep(2); }} data-testid="step-address">
              {saved.length > 0 && (
                <div><p className="label">{t('Saved addresses', 'সংরক্ষিত ঠিকানা')}</p><div className="flex flex-wrap gap-2">{saved.map((s) => <button key={s.id} type="button" className={`chip ${s.line1 === a.line1 && s.district === a.district ? 'chip-active' : ''}`} onClick={() => setA({ division: s.division, district: s.district, area: s.area, line1: s.line1 })}>{s.label} · {s.area}</button>)}</div></div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {input('name', t('Full name', 'পুরো নাম'), c.name, (v) => setC({ ...c, name: v }), { autoComplete: 'name', required: true })}
                {input('phone', t('Mobile number', 'মোবাইল নম্বর'), c.phone, (v) => setC({ ...c, phone: v }), { autoComplete: 'tel', inputMode: 'tel', placeholder: '01XXXXXXXXX', required: true })}
              </div>
              {input('email', t('Email (for receipt, optional)', 'ইমেইল (রসিদের জন্য, ঐচ্ছিক)'), c.email, (v) => setC({ ...c, email: v }), { type: 'email', autoComplete: 'email' })}
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label htmlFor="co-division" className="label">{t('Division', 'বিভাগ')}</label><select id="co-division" className="input" value={a.division} onChange={(e) => setA({ ...a, division: e.target.value, district: BD_DIVISIONS.find((d) => d.en === e.target.value)?.districts[0] ?? '' })}>{BD_DIVISIONS.map((d) => <option key={d.en} value={d.en}>{locale === 'bn' ? d.bn : d.en}</option>)}</select></div>
                <div><label htmlFor="co-district" className="label">{t('District', 'জেলা')}</label><select id="co-district" className="input" value={a.district} onChange={(e) => setA({ ...a, district: e.target.value })}>{districts.map((d) => <option key={d}>{d}</option>)}</select></div>
              </div>
              {input('area', t('Area / thana', 'এলাকা / থানা'), a.area, (v) => setA({ ...a, area: v }), { placeholder: t('e.g. Banani', 'যেমন: বনানী'), required: true })}
              {input('line1', t('House, road, floor', 'বাড়ি, রোড, তলা'), a.line1, (v) => setA({ ...a, line1: v }), { autoComplete: 'street-address', required: true })}
              {me && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />{t('Save this address to my account', 'এই ঠিকানা আমার অ্যাকাউন্টে রাখুন')}</label>}
              <button type="submit" className="btn btn-primary" data-testid="to-delivery">{t('Continue to delivery', 'ডেলিভারিতে যান')}</button>
            </form>
          ) : <p className="text-sm text-muted">{c.name} · {c.phone}<br />{a.line1}, {a.area}, {a.district}</p>}
        </section>

        <section className="card p-6 space-y-5" aria-labelledby="s2">
          <div id="s2">{stepHead(2, 'Delivery', 'ডেলিভারি')}</div>
          {step === 2 && (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setStep(3); }} data-testid="step-delivery">
              {quote?.zone && <p className="text-sm flex gap-2"><Truck className="w-5 h-5 text-primary shrink-0" />{t(`${quote.zone.nameEn}: ${quote.zone.leadDaysMin}–${quote.zone.leadDaysMax} days.`, `${quote.zone.nameBn}: ${num('bn', quote.zone.leadDaysMin)}–${num('bn', quote.zone.leadDaysMax)} দিন।`)} {quote.lines.some((l) => l.madeToOrder) && t('Includes made-to-order pieces — earliest date adjusted.', 'অর্ডারে তৈরি পিস আছে — প্রথম তারিখ সমন্বয় করা হয়েছে।')}</p>}
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label htmlFor="co-date" className="label">{t('Preferred delivery date', 'পছন্দের ডেলিভারি তারিখ')}</label><input id="co-date" type="date" className="input" min={minDate} value={date} onChange={(e) => setDate(e.target.value < minDate ? minDate : e.target.value)} data-testid="delivery-date" /></div>
                <fieldset><legend className="label">{t('Time slot', 'সময়')}</legend><div className="grid gap-2">{DELIVERY_SLOTS.map((s) => <label key={s.code} className={`flex items-center gap-2 border px-3 h-11 text-sm cursor-pointer ${slot === s.code ? 'border-primary ring-1 ring-primary' : 'border-line'}`}><input type="radio" name="slot" className="accent-[rgb(var(--primary))]" checked={slot === s.code} onChange={() => setSlot(s.code)} />{locale === 'bn' ? s.bn : s.en}</label>)}</div></fieldset>
              </div>
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="w-4 h-4 mt-0.5 accent-[rgb(var(--primary))]" checked={assembly} onChange={(e) => setAssembly(e.target.checked)} data-testid="assembly" /><span>{t('Professional assembly on delivery', 'ডেলিভারির সময় প্রফেশনাল অ্যাসেম্বলি')}{quote && <span className="text-muted"> — {quote.totals.assemblyCharge || !assembly ? (assembly ? money(locale, quote.totals.assemblyCharge) : '') : t('free in your area', 'আপনার এলাকায় ফ্রি')}</span>}</span></label>
              <div><label htmlFor="co-notes" className="label">{t('Delivery notes (optional)', 'ডেলিভারি নোট (ঐচ্ছিক)')}</label><textarea id="co-notes" rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('Lift available? Narrow stairs?', 'লিফট আছে? সরু সিঁড়ি?')} maxLength={500} /></div>
              <button type="submit" className="btn btn-primary" data-testid="to-payment">{t('Continue to payment', 'পেমেন্টে যান')}</button>
            </form>
          )}
          {step > 2 && <p className="text-sm text-muted">{date} · {DELIVERY_SLOTS.find((s) => s.code === slot)?.[locale === 'bn' ? 'bn' : 'en']}{assembly ? ` · ${t('with assembly', 'অ্যাসেম্বলিসহ')}` : ''}</p>}
        </section>

        <section className="card p-6 space-y-5" aria-labelledby="s3">
          <div id="s3">{stepHead(3, 'Payment', 'পেমেন্ট')}</div>
          {step === 3 && (
            <div className="space-y-5" data-testid="step-payment">
              <fieldset><legend className="sr-only">{t('Payment method', 'পেমেন্ট পদ্ধতি')}</legend>
                <div className="grid gap-2">{methods.map(([k, en, bn, den, dbn, Icon]) => {
                  const disabled = k === 'cod' && !codOk;
                  return (
                    <label key={k} className={`flex items-start gap-3 border p-4 cursor-pointer ${method === k ? 'border-primary ring-1 ring-primary' : 'border-line'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} data-testid={`pay-${k}`}>
                      <input type="radio" name="method" className="mt-1 accent-[rgb(var(--primary))]" checked={method === k} disabled={disabled} onChange={() => setMethod(k)} />
                      <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><span className="block font-medium">{t(en, bn)}</span><span className="block text-xs text-muted mt-0.5">{disabled ? t('Not available for this area — prepay instead', 'এই এলাকায় নেই — অগ্রিম পরিশোধ করুন') : t(den, dbn)}</span></span>
                    </label>
                  );
                })}</div>
              </fieldset>
              {method !== 'cod' && method !== 'bank' && total >= 20000 && (
                <fieldset className="border border-line p-4"><legend className="label px-1">{t('Payment plan', 'পেমেন্ট প্ল্যান')}</legend>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2"><input type="radio" name="plan" checked={plan === 'full'} onChange={() => setPlan('full')} className="accent-[rgb(var(--primary))]" />{t('Pay in full now', 'এখন পুরো পরিশোধ')}</label>
                    <label className="flex items-center gap-2"><input type="radio" name="plan" checked={plan === 'advance'} onChange={() => setPlan('advance')} className="accent-[rgb(var(--primary))]" data-testid="plan-advance" />{t('Pay an advance, rest on delivery', 'অগ্রিম দিন, বাকি ডেলিভারিতে')}</label>
                  </div>
                  {plan === 'advance' && <div className="mt-3"><label htmlFor="co-adv" className="text-sm">{t('Advance', 'অগ্রিম')}: <strong>{num(locale, adv)}%</strong></label><input id="co-adv" type="range" min={20} max={50} step={5} value={adv} onChange={(e) => setAdv(Number(e.target.value))} className="w-full accent-[rgb(var(--primary))]" /></div>}
                </fieldset>
              )}
              {method === 'bank' && <p className="text-sm bg-surface-2 p-4">{t('Bank: BRAC Bank, Gulshan · A/C Shekor Furniture Ltd. · 1501 2024 5566 001. Use your order number as the reference.', 'ব্যাংক: ব্র্যাক ব্যাংক, গুলশান · হিসাব: শেকড় ফার্নিচার লিমিটেড · ১৫০১ ২০২৪ ৫৫৬৬ ০০১। রেফারেন্স হিসেবে অর্ডার নম্বর দিন।')}</p>}
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="w-4 h-4 mt-0.5 accent-[rgb(var(--primary))]" checked={terms} onChange={(e) => setTerms(e.target.checked)} data-testid="accept-terms" aria-invalid={!!errors.terms} /><span>{t('I agree to the', 'আমি সম্মত')} <Link className="link" href={lp(locale, '/policy/terms')} target="_blank">{t('terms', 'শর্তাবলিতে')}</Link> {t('and', 'এবং')} <Link className="link" href={lp(locale, '/policy/returns')} target="_blank">{t('returns policy', 'রিটার্ন নীতিতে')}</Link>.</span></label>
              {err('terms')}
              {errors._form && <p className="text-sm text-sale" role="alert" data-testid="checkout-error">{errors._form}</p>}
            </div>
          )}
        </section>
      </div>
      <OrderSummary quote={quote} loading={loading} coupon={coupon} setCoupon={(v) => { setCoupon(v); try { sessionStorage.setItem('shekor-coupon', v); } catch { /* ignore */ } }} showPayNow>
        <ul className="space-y-3 max-h-64 overflow-y-auto border-t border-line pt-4">
          {(quote?.lines ?? []).map((l) => <li key={`${l.productId}-${l.variantId}`} className="flex gap-3 text-sm"><span className="relative w-12 h-14 shrink-0 bg-surface-2">{l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />}<span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-bg text-[10px] grid place-items-center">{num(locale, l.qty)}</span></span><span className="flex-1 min-w-0"><span className="block truncate">{locale === 'bn' ? l.nameBn : l.nameEn}</span><span className="text-xs text-muted">{locale === 'bn' ? l.variantBn : l.variantEn}</span></span><span>{money(locale, l.lineTotal)}</span></li>)}
        </ul>
        {step === 3 && <button type="button" className="btn btn-primary btn-lg w-full" disabled={busy || loading || !quote || !!quote.issues.length} onClick={place} data-testid="place-order">{busy ? t('Placing order…', 'অর্ডার হচ্ছে…') : quote && quote.totals.payNow > 0 && method !== 'bank' ? t(`Pay ${money('en', quote.totals.payNow)}`, `${money('bn', quote.totals.payNow)} পরিশোধ করুন`) : t('Place order', 'অর্ডার করুন')}</button>}
        {quote?.issues.length ? <p className="text-sm text-sale">{t('Some items need attention in your bag.', 'ব্যাগের কিছু পণ্যে সমস্যা আছে।')} <Link className="link" href={lp(locale, '/cart')}>{t('Review bag', 'ব্যাগ দেখুন')}</Link></p> : null}
      </OrderSummary>
    </div>
  );
}
