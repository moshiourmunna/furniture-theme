import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { listShowrooms } from '@/server/services/content';
import { getLocale, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, JsonLd } from '@/components/ui';
import { LeadForm } from '@/components/lead-form';
import { taxonomy } from '@/server/services/catalog';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/consultation', title: t('Book a free design consultation', 'ফ্রি ডিজাইন পরামর্শ বুক করুন'), description: t('Book a free interior design consultation with Shekor — in a showroom, by video call, or a home visit.', 'শেকড়ের সাথে ফ্রি ইন্টেরিয়র ডিজাইন পরামর্শ বুক করুন — শোরুমে, ভিডিও কলে বা বাসায়।') });
}

export default async function Consultation({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const [rooms, tx] = await Promise.all([listShowrooms(), taxonomy()]);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Design consultation', 'ডিজাইন পরামর্শ') }];
  return (
    <>
      <div className="container pt-6"><Breadcrumbs locale={locale} items={crumbs} /></div>
      <div className="container mt-5 grid lg:grid-cols-[1fr_1.2fr] gap-10">
        <div>
          <h1 className="h-display text-4xl md:text-5xl">{t('Book a free design consultation', 'ফ্রি ডিজাইন পরামর্শ বুক করুন')}</h1>
          <p className="text-muted mt-3 text-lg">{t('Our interior designers help you plan layouts, pick materials and stay on budget — no obligation to buy.', 'আমাদের ইন্টেরিয়র ডিজাইনাররা লেআউট পরিকল্পনা, উপকরণ বাছাই ও বাজেট ঠিক রাখতে সাহায্য করেন — কেনার বাধ্যবাধকতা নেই।')}</p>
          <Figure src="/media/img/showroom.webp" alt={t('A designer with fabric swatches', 'কাপড়ের নমুনা হাতে ডিজাইনার')} ratio="aspect-[4/3]" className="mt-6" priority />
          <ul className="mt-6 space-y-3 text-sm">{[t('2D floor plan + 3D render of your room', 'আপনার ঘরের 2D ফ্লোর প্ল্যান + 3D রেন্ডার'), t('Fabric & wood swatches to keep', 'রেখে দেওয়ার মতো কাপড় ও কাঠের নমুনা'), t('Itemised quote with EMI options', 'ইএমআই বিকল্পসহ বিস্তারিত কোটেশন')].map((x) => <li key={x} className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" />{x}</li>)}</ul>
        </div>
        <div className="card p-6 md:p-8 self-start">
          <LeadForm type="consultation" testId="consultation-form" submitLabel={t('Confirm booking', 'বুকিং নিশ্চিত করুন')} successTitle={t('Booked!', 'বুক হয়েছে!')} successBody={t('We’ve sent the details to your phone. A designer will confirm by call.', 'বিস্তারিত আপনার ফোনে পাঠানো হয়েছে। একজন ডিজাইনার ফোনে নিশ্চিত করবেন।')} fields={[
            { name: 'mode', label: t('How would you like to meet?', 'কীভাবে দেখা করতে চান?'), type: 'select', required: true, half: true, options: [['showroom', 'In a showroom', 'শোরুমে'], ['video', 'Video call', 'ভিডিও কল'], ['home', 'Home visit (Dhaka/Ctg)', 'বাসায় (ঢাকা/চট্টগ্রাম)']].map(([v, a, b]) => ({ value: v, label: t(a, b) })) },
            { name: 'showroomId', label: t('Showroom (for showroom visits)', 'শোরুম (শোরুম ভিজিটের জন্য)'), type: 'select', half: true, numeric: true, options: rooms.map((r) => ({ value: String(r.id), label: f(r, 'name') })) },
            { name: 'date', label: t('Date', 'তারিখ'), type: 'date', required: true, half: true, min: 'today' },
            { name: 'timeSlot', label: t('Time', 'সময়'), type: 'select', required: true, half: true, options: ['11:00', '12:00', '14:00', '16:00', '17:00', '19:00'].map((v) => ({ value: v, label: v })) },
            { name: 'rooms', label: t('Which rooms?', 'কোন ঘর?'), type: 'checkboxes', join: true, options: tx.rooms.map((r) => ({ value: r.nameEn, label: f(r, 'name') })) },
            { name: 'name', label: t('Name', 'নাম'), required: true, half: true, autoComplete: 'name' },
            { name: 'phone', label: t('Mobile', 'মোবাইল'), type: 'tel', required: true, half: true, placeholder: '01XXXXXXXXX' },
            { name: 'email', label: t('Email (optional)', 'ইমেইল (ঐচ্ছিক)'), type: 'email' },
            { name: 'notes', label: t('Anything we should know?', 'আর কিছু জানাতে চান?'), type: 'textarea' },
          ]} />
        </div>
      </div>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
