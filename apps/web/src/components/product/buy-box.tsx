'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Calculator, GitCompareArrows, Heart, MessageCircle, Minus, PackageCheck, Plus, Ruler, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';
import { BD_DIVISIONS, EMI_MIN_ORDER, EMI_TENURES, emiMonthly, matchZone } from '@shekor/shared';
import { api } from '@/lib/api';
import { lp, money, num } from '@/lib/i18n';
import { useStore } from '../providers';
import { Modal } from '../card-actions';

export interface BuyVariant { id: number; nameEn: string; nameBn: string; optionType: string; swatchHex: string | null; priceDelta: number; stockQty: number; isDefault: boolean }
export interface BuyZone { nameEn: string; nameBn: string; divisions: unknown; districts: unknown; charge: number; freeOver: number | null; leadDaysMin: number; leadDaysMax: number; codAvailable: boolean }
export interface BuyProduct { id: number; slug: string; nameEn: string; nameBn: string; price: number; compareAtPrice: number | null; stockStatus: string; leadTimeDays: number; emiAvailable: boolean; image: string | null; warrantyYears: number; variants: BuyVariant[] }

export function BuyBox({ p, zones, whatsapp }: { p: BuyProduct; zones: BuyZone[]; whatsapp: string }) {
  const { t, locale, addToCart, wishlist, toggleWishlist, compare, toggleCompare, toast } = useStore();
  const router = useRouter();
  const [vid, setVid] = useState<number | null>((p.variants.find((v) => v.isDefault) ?? p.variants[0])?.id ?? null);
  const [qty, setQty] = useState(1);
  const [emi, setEmi] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const v = p.variants.find((x) => x.id === vid) ?? null;
  const unit = p.price + (v?.priceDelta ?? 0);
  const madeToOrder = p.stockStatus === 'MADE_TO_ORDER';
  const variantOut = v ? v.stockQty <= 0 : p.stockStatus === 'OUT_OF_STOCK';
  const canBuy = madeToOrder || !variantOut;
  const maxQty = madeToOrder ? 10 : Math.max(1, Math.min(10, v?.stockQty ?? 10));
  const groups = useMemo(() => {
    const g: Record<string, BuyVariant[]> = {};
    for (const x of p.variants) (g[x.optionType] ??= []).push(x);
    return g;
  }, [p.variants]);
  const line = () => ({ productId: p.id, variantId: v?.id ?? null, qty, slug: p.slug, nameEn: p.nameEn, nameBn: p.nameBn, variantEn: v?.nameEn ?? null, variantBn: v?.nameBn ?? null, image: p.image, price: unit });
  const inWish = wishlist.includes(p.id);
  const inCompare = compare.includes(p.id);
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [delivery, setDelivery] = useState<string | null>(null);
  const districts = BD_DIVISIONS.find((d) => d.en === division)?.districts ?? [];
  useEffect(() => { setQty((q) => Math.min(q, maxQty)); }, [maxQty]);

  const stockLine = madeToOrder
    ? t(`Made to order · ships in about ${p.leadTimeDays} days`, `অর্ডারে তৈরি · প্রায় ${num('bn', p.leadTimeDays)} দিনে পাঠানো হবে`)
    : variantOut ? t('This finish is sold out', 'এই ফিনিশ স্টকে নেই')
    : (v?.stockQty ?? 99) <= 3 ? t(`Only ${v?.stockQty} left in this finish`, `এই ফিনিশে মাত্র ${num('bn', v?.stockQty ?? 0)}টি বাকি`)
    : t('In stock · ready to ship from our Gazipur warehouse', 'স্টকে আছে · গাজীপুর ওয়্যারহাউস থেকে পাঠানোর জন্য প্রস্তুত');

  return (
    <div>
      <div className="flex items-baseline gap-3 mt-4">
        <p className="text-2xl md:text-3xl" data-testid="pdp-price">{money(locale, unit)}</p>
        {p.compareAtPrice && <s className="text-muted">{money(locale, p.compareAtPrice + (v?.priceDelta ?? 0))}</s>}
        {p.compareAtPrice && <span className="badge bg-sale text-white">−{num(locale, Math.round((1 - p.price / p.compareAtPrice) * 100))}%</span>}
      </div>
      {p.emiAvailable && unit >= EMI_MIN_ORDER && (
        <button type="button" className="mt-2 text-sm text-muted inline-flex items-center gap-1.5 hover:text-ink" onClick={() => setEmi(true)} data-testid="open-emi">
          <Calculator className="w-4 h-4" />{t(`0% EMI from ${money('en', emiMonthly(unit, 12))}/month`, `০% ইএমআই মাসে ${money('bn', emiMonthly(unit, 12))} থেকে`)} <span className="link">{t('Calculate', 'হিসাব করুন')}</span>
        </button>
      )}

      {Object.entries(groups).map(([type, vs]) => (
        <fieldset key={type} className="mt-7">
          <legend className="text-sm"><span className="font-semibold">{type === 'fabric' ? t('Fabric', 'কাপড়') : t('Finish', 'ফিনিশ')}:</span> <span className="text-muted">{v && v.optionType === type ? (locale === 'bn' ? v.nameBn : v.nameEn) : ''}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
            {vs.map((x) => {
              const on = x.id === vid;
              return x.swatchHex ? (
                <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => setVid(x.id)} title={locale === 'bn' ? x.nameBn : x.nameEn} aria-label={`${locale === 'bn' ? x.nameBn : x.nameEn}${x.priceDelta ? ` (+${money(locale, x.priceDelta)})` : ''}`} data-testid="variant-option"
                  className={`relative w-11 h-11 rounded-full border-2 border-surface ring-offset-2 ring-offset-bg ${on ? 'ring-2 ring-primary' : 'ring-1 ring-line'} ${x.stockQty <= 0 && !madeToOrder ? 'opacity-40' : ''}`} style={{ background: x.swatchHex }} />
              ) : (
                <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => setVid(x.id)} data-testid="variant-option" className={`border px-4 py-2.5 text-sm text-left ${on ? 'border-primary ring-2 ring-primary' : 'border-line'}`}>
                  <span className="block font-medium">{locale === 'bn' ? x.nameBn : x.nameEn}</span><span className="block text-xs text-muted">{x.priceDelta ? `+${money(locale, x.priceDelta)}` : t('Base price', 'মূল দাম')}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <p className={`mt-6 flex items-start gap-2 text-sm ${variantOut && !madeToOrder ? 'text-sale' : madeToOrder ? 'text-accent' : 'text-success'}`} data-testid="stock-line"><PackageCheck className="w-5 h-5 shrink-0" />{stockLine}</p>

      {canBuy ? (
        <>
          <div className="mt-5 flex gap-3">
            <div className="flex items-center border border-line h-12" role="group" aria-label={t('Quantity', 'পরিমাণ')}>
              <button type="button" className="w-11 h-full grid place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t('Decrease quantity', 'পরিমাণ কমান')}><Minus className="w-4 h-4" /></button>
              <span className="w-8 text-center" aria-live="polite" data-testid="qty">{num(locale, qty)}</span>
              <button type="button" className="w-11 h-full grid place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label={t('Increase quantity', 'পরিমাণ বাড়ান')}><Plus className="w-4 h-4" /></button>
            </div>
            <button type="button" className="btn btn-primary btn-lg flex-1" onClick={() => addToCart(line())} data-testid="add-to-bag"><ShoppingBag className="w-5 h-5" />{t('Add to bag', 'ব্যাগে যোগ করুন')}</button>
            <button type="button" className="btn-icon w-12 h-12 border border-line" onClick={() => toggleWishlist(p.id)} aria-pressed={inWish} aria-label={inWish ? t('Remove from wishlist', 'উইশলিস্ট থেকে সরান') : t('Add to wishlist', 'উইশলিস্টে যোগ করুন')} data-testid="pdp-wishlist"><Heart fill={inWish ? 'currentColor' : 'none'} /></button>
          </div>
          <button type="button" className="btn btn-accent btn-lg w-full mt-3" onClick={() => { addToCart(line(), false); router.push(lp(locale, '/checkout')); }} data-testid="buy-now">{t('Buy now', 'এখনই কিনুন')}</button>
        </>
      ) : (
        <button type="button" className="btn btn-outline btn-lg w-full mt-5" onClick={() => setAlertOpen(true)} data-testid="notify-me"><Bell className="w-5 h-5" />{t('Notify me when available', 'পাওয়া গেলে জানান')}</button>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <button type="button" className={`btn btn-ghost btn-sm border border-line ${inCompare ? 'bg-ink text-bg' : ''}`} onClick={() => toggleCompare(p.id)} aria-pressed={inCompare} data-testid="pdp-compare"><GitCompareArrows className="w-4 h-4" />{t('Compare', 'তুলনা')}</button>
        <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi Shekor, I have a question about ${p.nameEn}`)}`} target="_blank" className="btn btn-ghost btn-sm border border-line" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" />{t('Ask expert', 'বিশেষজ্ঞকে জিজ্ঞেস')}</a>
        <Link href={lp(locale, `/custom?piece=${encodeURIComponent(p.nameEn)}`)} className="btn btn-ghost btn-sm border border-line"><Ruler className="w-4 h-4" />{t('Customise', 'কাস্টমাইজ')}</Link>
      </div>

      <div className="mt-6 card divide-y divide-line">
        <form className="p-4" data-testid="delivery-check" onSubmit={(e) => {
          e.preventDefault();
          const z = matchZone(zones, division, district);
          if (!z) { setDelivery(t('Sorry — we don’t deliver there yet.', 'দুঃখিত — সেখানে এখনো ডেলিভারি নেই।')); return; }
          const charge = z.freeOver != null && unit * qty >= z.freeOver ? 0 : z.charge;
          setDelivery(t(`${z.nameEn}: ${charge ? money('en', charge) : 'free'} delivery in ${z.leadDaysMin}–${z.leadDaysMax} days${madeToOrder ? ' after making' : ''}.${z.codAvailable ? ' Cash on delivery available.' : ' Prepaid only.'}`, `${z.nameBn}: ${num('bn', z.leadDaysMin)}–${num('bn', z.leadDaysMax)} দিনে ${charge ? money('bn', charge) : 'ফ্রি'} ডেলিভারি${madeToOrder ? ' (তৈরির পরে)' : ''}।${z.codAvailable ? ' ক্যাশ অন ডেলিভারি আছে।' : ' শুধু অগ্রিম পেমেন্ট।'}`));
        }}>
          <p className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />{t('Check delivery', 'ডেলিভারি যাচাই')}</p>
          <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
            <label className="sr-only" htmlFor="dl-div">{t('Division', 'বিভাগ')}</label>
            <select id="dl-div" className="input h-10" value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(BD_DIVISIONS.find((d) => d.en === e.target.value)?.districts[0] ?? ''); setDelivery(null); }}>
              {BD_DIVISIONS.map((d) => <option key={d.en} value={d.en}>{locale === 'bn' ? d.bn : d.en}</option>)}
            </select>
            <label className="sr-only" htmlFor="dl-dist">{t('District', 'জেলা')}</label>
            <select id="dl-dist" className="input h-10" value={district} onChange={(e) => { setDistrict(e.target.value); setDelivery(null); }}>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button className="btn btn-outline btn-sm h-10" type="submit">{t('Check', 'যাচাই')}</button>
          </div>
          {delivery && <p className="text-sm text-success mt-2" role="status" data-testid="delivery-result">{delivery}</p>}
        </form>
        <div className="p-4 flex items-start gap-3 text-sm"><Store className="w-5 h-5 text-primary shrink-0" /><p>{t('See it in person at our', 'সরাসরি দেখুন আমাদের')} <Link href={lp(locale, '/showrooms')} className="link">{t('showrooms', 'শোরুমে')}</Link></p></div>
        <div className="p-4 flex items-start gap-3 text-sm"><ShieldCheck className="w-5 h-5 text-primary shrink-0" /><p>{t(`${p.warrantyYears}-year frame warranty · 7-day returns on in-stock pieces`, `${num('bn', p.warrantyYears)} বছরের ফ্রেম ওয়ারেন্টি · স্টকের পিসে ৭ দিনে রিটার্ন`)}</p></div>
      </div>

      {canBuy && (
        <div className="md:hidden fixed bottom-[57px] inset-x-0 z-30 bg-surface border-t border-line px-4 py-3 flex items-center gap-3" data-testid="sticky-atc">
          <div className="flex-1 min-w-0"><p className="text-xs text-muted truncate">{locale === 'bn' ? p.nameBn : p.nameEn}</p><p className="font-semibold">{money(locale, unit)}</p></div>
          <button type="button" className="btn btn-primary" onClick={() => addToCart(line())}>{t('Add to bag', 'ব্যাগে যোগ করুন')}</button>
        </div>
      )}

      {emi && <EmiModal amount={unit * qty} onClose={() => setEmi(false)} />}
      {alertOpen && <StockAlertModal slug={p.slug} onClose={() => setAlertOpen(false)} onDone={() => { setAlertOpen(false); toast(t('We’ll let you know when it’s back.', 'আবার এলে আমরা জানাব।')); }} />}
    </div>
  );
}

export function EmiModal({ amount, onClose }: { amount: number; onClose: () => void }) {
  const { t, locale } = useStore();
  const [m, setM] = useState(12);
  const banks = ['BRAC Bank', 'City Bank', 'EBL', 'DBBL', 'Standard Chartered', 'Prime Bank', 'MTB', 'UCB', 'LankaBangla', 'Southeast Bank', 'Dhaka Bank', 'Bank Asia'];
  const monthly = emiMonthly(amount, m);
  return (
    <Modal title={t('EMI calculator', 'ইএমআই ক্যালকুলেটর')} onClose={onClose}>
      <p className="text-sm text-muted">{t('Order value', 'অর্ডারের মূল্য')}: <span className="text-ink font-semibold">{money(locale, amount)}</span></p>
      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('Tenure', 'মেয়াদ')}>
        {EMI_TENURES.map((x) => (
          <button key={x} type="button" role="radio" aria-checked={m === x} onClick={() => setM(x)} className={`border p-3 text-center ${m === x ? 'border-primary ring-2 ring-primary' : 'border-line'}`} data-testid={`emi-${x}`}>
            <span className="block font-semibold">{num(locale, x)} {t('mo', 'মাস')}</span><span className="block text-xs text-muted">{x > 12 ? t('7% fee', '৭% ফি') : t('0% interest', '০% সুদ')}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 bg-surface-2 p-5 text-center"><p className="text-sm text-muted">{t('Monthly instalment', 'মাসিক কিস্তি')}</p><p className="text-3xl font-semibold mt-1" data-testid="emi-monthly">{money(locale, monthly)}</p><p className="text-xs text-muted mt-1">{t('Total payable', 'মোট পরিশোধ')}: {money(locale, monthly * m)}</p></div>
      <p className="text-xs text-muted mt-4">{t('Available on credit cards from partner banks for orders of ৳10,000 or more:', '৳১০,০০০ বা তার বেশি অর্ডারে পার্টনার ব্যাংকের ক্রেডিট কার্ডে:')} {banks.join(', ')}.</p>
    </Modal>
  );
}

function StockAlertModal({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const { t, me } = useStore();
  const [contact, setContact] = useState(me?.phone ?? me?.email ?? '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={t('Back-in-stock alert', 'স্টকে ফিরলে জানান')} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await api(`/products/${slug}/stock-alert`, { body: { contact } }); onDone(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); } }}>
        <label htmlFor="sa-contact" className="label">{t('Phone or email', 'ফোন বা ইমেইল')}</label>
        <input id="sa-contact" className="input mt-1" value={contact} onChange={(e) => setContact(e.target.value)} required minLength={5} aria-invalid={!!err} aria-describedby={err ? 'sa-err' : undefined} />
        {err && <p id="sa-err" className="text-sm text-sale mt-2" role="alert">{err}</p>}
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={busy} data-testid="stock-alert-submit">{t('Notify me', 'আমাকে জানান')}</button>
      </form>
    </Modal>
  );
}
