import type { Metadata } from 'next';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, JsonLd } from '@/components/ui';
import { Steps } from '@/components/editorial';
import { LeadForm } from '@/components/lead-form';
import { BD_DIVISIONS } from '@shekor/shared';

type Props = LocaleParams & { searchParams: Promise<{ piece?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/custom', title: t('Custom & bespoke furniture', 'কাস্টম ও বেসপোক ফার্নিচার'), description: t('Get furniture made to your measurements in Segun, Mahogany or Gorjon. Free home measurement and a quote within 48 hours.', 'সেগুন, মেহগনি বা গর্জনে আপনার মাপে ফার্নিচার। বাসায় ফ্রি মাপ ও ৪৮ ঘণ্টায় কোটেশন।') });
}

export default async function Custom({ params, searchParams }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const { piece } = await searchParams;
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Custom furniture', 'কাস্টম ফার্নিচার') }];
  const types = [['Wardrobe / Almirah', 'ওয়ার্ডরোব / আলমারি'], ['Bed', 'খাট'], ['Sofa', 'সোফা'], ['Dining table', 'ডাইনিং টেবিল'], ['Kitchen cabinet', 'কিচেন কেবিনেট'], ['TV / Showcase', 'টিভি / শোকেস'], ['Office / Corporate', 'অফিস / কর্পোরেট'], ['Other', 'অন্যান্য']];
  return (
    <>
      <section className="bg-surface border-b border-line">
        <div className="container py-10 md:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Breadcrumbs locale={locale} items={crumbs} />
            <h1 className="h-display text-4xl md:text-6xl mt-5">{t('Made to your measure', 'আপনার মাপে তৈরি')}</h1>
            <p className="text-muted mt-4 text-lg">{t('Any size, any wood, any finish. Tell us what you need and get a free design and quote within 48 hours.', 'যেকোনো মাপ, কাঠ বা ফিনিশ। কী দরকার জানান, ৪৮ ঘণ্টায় ফ্রি ডিজাইন ও কোটেশন পাবেন।')}</p>
          </div>
          <Figure src="/media/img/custom.webp" alt={t('Karigor measuring timber for a custom order', 'কাস্টম অর্ডারের জন্য কাঠ মাপছেন কারিগর')} ratio="aspect-[4/3]" priority />
        </div>
      </section>
      <section className="container mt-12"><Steps locale={locale} items={[
        ['Share your idea', 'আপনার আইডিয়া জানান', 'Describe the piece, add sizes and a reference.', 'পিসের বর্ণনা, মাপ ও রেফারেন্স দিন।'],
        ['Free measurement', 'ফ্রি মাপ নেওয়া', 'Our team visits to measure in Dhaka and Chattogram.', 'ঢাকা ও চট্টগ্রামে আমাদের টিম এসে মাপ নেবে।'],
        ['Design & quote', 'ডিজাইন ও কোটেশন', 'A drawing and a fixed quote within 48 hours.', '৪৮ ঘণ্টায় ড্রয়িং ও নির্দিষ্ট কোটেশন।'],
        ['Made & delivered', 'তৈরি ও ডেলিভারি', 'Made in 3–6 weeks, delivered and installed.', '৩–৬ সপ্তাহে তৈরি, ডেলিভারি ও স্থাপন।'],
      ]} /></section>
      <section className="container mt-16 max-w-4xl">
        <h2 className="h-display text-3xl mb-6">{t('Request a quote', 'কোটেশনের অনুরোধ')}</h2>
        <LeadForm type="custom-order" initial={piece ? { details: t(`Like “${piece}”, but `, `“${piece}”-এর মতো, তবে `) } : {}} submitLabel={t('Submit request', 'অনুরোধ জমা দিন')} successTitle={t('Request received', 'অনুরোধ পেয়েছি')} successBody={t('A designer will call you within 2 working hours.', '২ কর্মঘণ্টার মধ্যে একজন ডিজাইনার আপনাকে ফোন করবেন।')} fields={[
          { name: 'pieceType', label: t('What would you like made?', 'কী বানাতে চান?'), type: 'select', required: true, half: true, options: types.map(([a, b]) => ({ value: a, label: t(a, b) })) },
          { name: 'material', label: t('Preferred wood', 'পছন্দের কাঠ'), type: 'select', half: true, options: [['Segun (Teak)', 'সেগুন'], ['Mahogany', 'মেহগনি'], ['Gorjon', 'গর্জন'], ['Oak', 'ওক'], ['Not sure', 'নিশ্চিত নই']].map(([a, b]) => ({ value: a, label: t(a, b) })) },
          { name: 'dimensions', label: t('Approximate size (W × D × H)', 'আনুমানিক মাপ (প্র × গ × উ)'), half: true, placeholder: '84 × 24 × 78 in' },
          { name: 'budget', label: t('Budget', 'বাজেট'), type: 'select', half: true, options: ['< ৳50,000', '৳50,000 – ৳1,00,000', '৳1,00,000 – ৳2,50,000', '৳2,50,000+'].map((v) => ({ value: v, label: v })) },
          { name: 'details', label: t('Describe your requirement', 'আপনার চাহিদা লিখুন'), type: 'textarea', required: true, placeholder: t('e.g. 4-door almirah with mirror, locker and 2 drawers, walnut finish', 'যেমন: আয়না, লকার ও ২টি ড্রয়ারসহ ৪-দরজার আলমারি, ওয়ালনাট ফিনিশ') },
          { name: 'name', label: t('Name', 'নাম'), required: true, half: true, autoComplete: 'name' },
          { name: 'phone', label: t('Mobile', 'মোবাইল'), type: 'tel', required: true, half: true, placeholder: '01XXXXXXXXX' },
          { name: 'email', label: t('Email (optional)', 'ইমেইল (ঐচ্ছিক)'), type: 'email', half: true },
          { name: 'city', label: t('District', 'জেলা'), type: 'select', half: true, options: BD_DIVISIONS.flatMap((d) => d.districts).map((d) => ({ value: d, label: d })) },
        ]} />
      </section>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
