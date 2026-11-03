import type { Metadata } from 'next';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Intro, JsonLd } from '@/components/ui';
import { Stats } from '@/components/editorial';
import { LeadForm } from '@/components/lead-form';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/trade', title: t('Trade & corporate', 'ট্রেড ও কর্পোরেট'), description: t('Trade pricing, project management and contract-grade furniture for architects, hotels, offices and developers in Bangladesh.', 'বাংলাদেশের স্থপতি, হোটেল, অফিস ও ডেভেলপারদের জন্য ট্রেড মূল্য, প্রজেক্ট ম্যানেজমেন্ট ও কন্ট্রাক্ট-গ্রেড ফার্নিচার।') });
}

export default async function Trade({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Trade & corporate', 'ট্রেড ও কর্পোরেট') }];
  const perks: [string, string, string, string][] = [
    ['Trade pricing', 'ট্রেড মূল্য', 'Up to 18% off list for registered architects and designers.', 'নিবন্ধিত স্থপতি ও ডিজাইনারদের জন্য তালিকা মূল্যে ১৮% পর্যন্ত ছাড়।'],
    ['Project manager', 'প্রজেক্ট ম্যানেজার', 'One person from drawings to installation, with weekly updates.', 'ড্রয়িং থেকে ইনস্টলেশন পর্যন্ত একজন, সাপ্তাহিক আপডেটসহ।'],
    ['Contract grade', 'কন্ট্রাক্ট গ্রেড', 'Fire-retardant foams, commercial fabrics and BIN/VAT invoices.', 'অগ্নি-প্রতিরোধী ফোম, কমার্শিয়াল কাপড় ও BIN/VAT চালান।'],
    ['Samples & prototypes', 'নমুনা ও প্রোটোটাইপ', 'Finish samples in 48 hours, full-size prototypes on request.', '৪৮ ঘণ্টায় ফিনিশ নমুনা, অনুরোধে পূর্ণ মাপের প্রোটোটাইপ।'],
  ];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Trade & corporate', 'ট্রেড ও কর্পোরেট')} title={t('For architects, hotels and offices', 'স্থপতি, হোটেল ও অফিসের জন্য')} sub={t('We have furnished 300+ commercial projects across Bangladesh — from boutique hotels in Sylhet to headquarters in Gulshan.', 'সারা বাংলাদেশে ৩০০+ বাণিজ্যিক প্রজেক্ট সাজিয়েছি — সিলেটের বুটিক হোটেল থেকে গুলশানের সদর দপ্তর।')} />
      <section className="container"><Stats locale={locale} items={[['300+', 'commercial projects', 'বাণিজ্যিক প্রজেক্ট'], ['18%', 'trade discount', 'ট্রেড ছাড়'], ['48h', 'sample turnaround', 'নমুনা সময়'], ['64', 'districts served', 'জেলায় সেবা']]} /></section>
      <section className="container mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">{perks.map(([a, b, c, d]) => <div key={a} className="bg-bg p-8"><p className="h-serif text-xl">{t(a, b)}</p><p className="text-sm text-muted mt-2">{t(c, d)}</p></div>)}</section>
      <section className="container mt-24 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4"><p className="eyebrow">{t('Enquiry', 'অনুসন্ধান')}</p><h2 className="h-display text-4xl mt-4">{t('Tell us about your project', 'আপনার প্রজেক্ট সম্পর্কে বলুন')}</h2><p className="text-muted mt-4">{t('A trade manager will reply within one working day.', 'একজন ট্রেড ম্যানেজার এক কর্মদিবসের মধ্যে উত্তর দেবেন।')}</p></div>
        <div className="lg:col-span-7 lg:col-start-6">
          <LeadForm type="trade" submitLabel={t('Send enquiry', 'অনুসন্ধান পাঠান')} successTitle={t('Thank you — enquiry received', 'ধন্যবাদ — অনুসন্ধান পেয়েছি')} successBody={t('A trade manager will contact you within one working day.', 'একজন ট্রেড ম্যানেজার এক কর্মদিবসের মধ্যে যোগাযোগ করবেন।')} fields={[
            { name: 'company', label: t('Company', 'প্রতিষ্ঠান'), required: true, half: true, autoComplete: 'organization' },
            { name: 'contactName', label: t('Your name', 'আপনার নাম'), required: true, half: true, autoComplete: 'name' },
            { name: 'phone', label: t('Mobile', 'মোবাইল'), type: 'tel', required: true, half: true, placeholder: '01XXXXXXXXX' },
            { name: 'email', label: t('Work email', 'অফিস ইমেইল'), type: 'email', required: true, half: true, autoComplete: 'email' },
            { name: 'sector', label: t('Sector', 'খাত'), type: 'select', required: true, half: true, options: [['corporate', 'Corporate office', 'কর্পোরেট অফিস'], ['hospitality', 'Hotel & hospitality', 'হোটেল ও হসপিটালিটি'], ['residential-dev', 'Residential developer', 'আবাসিক ডেভেলপার'], ['architect', 'Architect / designer', 'স্থপতি / ডিজাইনার'], ['retail', 'Retail', 'রিটেইল']].map(([v, a, b]) => ({ value: v, label: t(a, b) })) },
            { name: 'projectSize', label: t('Project size', 'প্রজেক্টের আকার'), type: 'select', half: true, options: ['< 2,000 sq ft', '2,000–10,000 sq ft', '10,000–50,000 sq ft', '50,000+ sq ft'].map((v) => ({ value: v, label: v })) },
            { name: 'timeline', label: t('Timeline', 'সময়সীমা'), type: 'select', options: [['1-3', 'Within 3 months', '৩ মাসের মধ্যে'], ['3-6', '3–6 months', '৩–৬ মাস'], ['6+', '6+ months', '৬+ মাস']].map(([v, a, b]) => ({ value: v, label: t(a, b) })) },
            { name: 'message', label: t('About the project', 'প্রজেক্ট সম্পর্কে'), type: 'textarea', required: true },
          ]} />
        </div>
      </section>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
