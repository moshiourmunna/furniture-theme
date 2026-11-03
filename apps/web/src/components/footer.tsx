import Link from 'next/link';
import { lp, num, tr, type Locale } from '@/lib/i18n';
import { NewsletterForm } from './chrome';

const SOCIAL: [string, string, string][] = [
  ['Facebook', 'facebook', 'M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H8v4h2v8h4v-8h3l1-4h-4V9.5c0-.3.2-.5.5-.5Z'],
  ['Instagram', 'instagram', 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z'],
  ['YouTube', 'youtube', 'M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12c0 1.3.1 2.6.4 3.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8ZM10 15V9l5.2 3L10 15Z'],
  ['LinkedIn', 'linkedin', 'M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-2 6h4v12H2V9Zm7 0h4v1.7c.6-1 1.9-2 3.9-2 4.1 0 4.1 2.7 4.1 6V21h-4v-5.6c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H9V9Z'],
];

export function SiteFooter({ locale, store, social }: { locale: Locale; store?: { phone?: string; email?: string; tradeLicence?: string; bin?: string } | null; social?: Record<string, string> | null }) {
  const t = tr(locale);
  const cols: [string, string, [string, string, string][]][] = [
    ['Explore', 'এক্সপ্লোর', [['Collections', 'কালেকশন', '/collections'], ['Brands', 'ব্র্যান্ড', '/brands'], ['Projects', 'প্রজেক্ট', '/projects'], ['Gallery', 'গ্যালারি', '/gallery'], ['Catalogues', 'ক্যাটালগ', '/catalogues'], ['Journal', 'জার্নাল', '/journal']]],
    ['Shop', 'শপ', [['Living', 'বসার ঘর', '/shop?room=living'], ['Bedroom', 'শোবার ঘর', '/shop?room=bedroom'], ['Dining', 'ডাইনিং', '/shop?room=dining-room'], ['Office', 'অফিস', '/shop?room=office-room'], ['Outdoor', 'আউটডোর', '/shop?room=outdoor'], ['All furniture', 'সব ফার্নিচার', '/shop']]],
    ['Services', 'সেবা', [['Interior design', 'ইন্টেরিয়র ডিজাইন', '/interior-design'], ['Trade & corporate', 'ট্রেড ও কর্পোরেট', '/trade'], ['Bespoke furniture', 'বেসপোক ফার্নিচার', '/custom'], ['Book a consultation', 'পরামর্শ বুক করুন', '/consultation'], ['Showrooms', 'শোরুম', '/showrooms']]],
    ['Client care', 'ক্লায়েন্ট কেয়ার', [['Track your order', 'অর্ডার ট্র্যাক', '/track'], ['Delivery & assembly', 'ডেলিভারি ও অ্যাসেম্বলি', '/policy/delivery'], ['Returns', 'রিটার্ন', '/policy/returns'], ['Warranty', 'ওয়ারেন্টি', '/policy/warranty'], ['EMI & payments', 'ইএমআই ও পেমেন্ট', '/policy/emi'], ['FAQ', 'প্রশ্নোত্তর', '/faq'], ['Contact', 'যোগাযোগ', '/contact']]],
    ['Shekor', 'শেকড়', [['Our story', 'আমাদের গল্প', '/about'], ['Craftsmanship', 'কারুশিল্প', '/craft'], ['Studio & designers', 'স্টুডিও ও ডিজাইনার', '/studio'], ['Privacy', 'গোপনীয়তা', '/policy/privacy'], ['Terms', 'শর্তাবলি', '/policy/terms'], ['Cookies', 'কুকি', '/policy/cookies']]],
  ];
  const phone = store?.phone ?? '09612-345678';
  const mail = store?.email ?? 'hello@shekor.com.bd';
  return (
    <footer className="mt-24 md:mt-32 bg-deep text-linen-100 pb-20 md:pb-0">
      <div className="container pt-20 pb-14 grid lg:grid-cols-12 gap-12 border-b border-white/10">
        <div className="lg:col-span-6"><p className="font-display font-light text-4xl md:text-6xl leading-[1.05] text-linen-200">{t('Rooted in craft.', 'শেকড়ে কারুকাজ।')}<br /><span className="italic text-sand">{t('Made for life.', 'জীবনের জন্য তৈরি।')}</span></p></div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="label-sm text-linen-200/70">{t('The Shekor letter', 'শেকড় লেটার')}</p>
          <p className="mt-3 text-sm text-linen-100/80">{t('New collections, project stories and private showroom evenings — four times a year.', 'নতুন কালেকশন, প্রজেক্টের গল্প ও শোরুমের বিশেষ সন্ধ্যা — বছরে চারবার।')}</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="container py-14 grid gap-10 grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-5">
          <Link href={lp(locale)} className="inline-flex" aria-label={t('Shekor home', 'শেকড় হোম')}><img src="/brand/shekor-horizontal-dark.svg" alt="Shekor" width={137} height={44} className="h-[40px] w-auto" /></Link>
          <ul className="text-sm space-y-2 text-linen-100/80">
            <li><a href={`tel:${phone.replace(/\D/g, '')}`}>{num(locale, phone)}</a></li>
            <li><a href={`mailto:${mail}`}>{mail}</a></li>
            <li>{t('Flagship: House 42, Road 11, Banani, Dhaka', 'ফ্ল্যাগশিপ: বাড়ি ৪২, রোড ১১, বনানী, ঢাকা')}</li>
          </ul>
          <ul className="flex gap-5">
            {SOCIAL.map(([n, k, d]) => (
              <li key={k}><a href={social?.[k] || `https://${k}.com/shekor.bd`} target="_blank" rel="noopener noreferrer" className="text-linen-100/80 hover:text-white" aria-label={n}><svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden><path d={d} /></svg></a></li>
            ))}
          </ul>
        </div>
        {cols.map(([en, bn, items]) => (
          <div key={en}>
            <h2 className="label-sm text-linen-200/70 mb-5">{t(en, bn)}</h2>
            <ul className="space-y-3">{items.map(([a, b, h]) => <li key={h}><Link href={lp(locale, h)} className="text-sm text-linen-100/85 hover:text-white">{t(a, b)}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col lg:flex-row gap-4 lg:items-center justify-between text-linen-100/75">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">{['bKash', 'Nagad', 'VISA', 'Mastercard', 'AMEX', 'SSLCommerz', 'COD'].map((p) => <li key={p} className="text-[11px] font-semibold tracking-[0.08em] opacity-80">{p}</li>)}</ul>
          <p className="text-xs">© {num(locale, '2026')} {t('Shekor Furniture Ltd.', 'শেকড় ফার্নিচার লিমিটেড।')} · {t('Trade Licence', 'ট্রেড লাইসেন্স')} {num(locale, store?.tradeLicence ?? 'TRAD/DNCC/045123/2026')} · BIN {num(locale, store?.bin ?? '004512398-0101')}</p>
        </div>
      </div>
    </footer>
  );
}
