import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getSettings } from '@/server/services/content';
import { getLocale, lp, num, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, orgLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Intro, JsonLd } from '@/components/ui';
import { LeadForm } from '@/components/lead-form';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/contact', title: t('Contact us', 'যোগাযোগ'), description: t('Call, WhatsApp or write to Shekor client care. We reply within one working day.', 'কল, হোয়াটসঅ্যাপ বা লিখে শেকড় ক্লায়েন্ট কেয়ারে যোগাযোগ করুন। এক কর্মদিবসে উত্তর দিই।') });
}

export default async function Contact({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const s = (await getSettings()).store;
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Contact', 'যোগাযোগ') }];
  const phone = s?.phone ?? '09612-345678';
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Client care', 'ক্লায়েন্ট কেয়ার')} title={t('We’d love to hear from you', 'আপনার কথা শুনতে চাই')} sub={t('Saturday to Thursday, 10am–8pm. Friday 3pm–8pm.', 'শনি থেকে বৃহস্পতিবার সকাল ১০টা–রাত ৮টা। শুক্রবার বিকাল ৩টা–রাত ৮টা।')} />
      <div className="container grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-4">
          <a href={`tel:${phone.replace(/\D/g, '')}`} className="card p-5 flex gap-4 items-center hover:border-ink"><Phone className="w-5 h-5 text-primary" /><div><p className="font-semibold">{t('Call us', 'কল করুন')}</p><p className="text-sm text-muted">{num(locale, phone)}</p></div></a>
          <a href={`https://wa.me/${(s?.whatsapp ?? '8801711000000').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="card p-5 flex gap-4 items-center hover:border-ink"><MessageCircle className="w-5 h-5 text-primary" /><div><p className="font-semibold">WhatsApp</p><p className="text-sm text-muted">{t('Usually replies in minutes', 'সাধারণত কয়েক মিনিটে উত্তর')}</p></div></a>
          <a href={`mailto:${s?.email ?? 'hello@shekor.com.bd'}`} className="card p-5 flex gap-4 items-center hover:border-ink"><Mail className="w-5 h-5 text-primary" /><div><p className="font-semibold">{t('Email', 'ইমেইল')}</p><p className="text-sm text-muted">{s?.email ?? 'hello@shekor.com.bd'}</p></div></a>
          <p className="text-sm text-muted pt-2">{t('Looking for an order?', 'অর্ডার খুঁজছেন?')} <Link className="link" href={lp(locale, '/track')}>{t('Track it here', 'এখানে ট্র্যাক করুন')}</Link></p>
        </aside>
        <div className="lg:col-span-7 lg:col-start-6">
          <LeadForm type="contact" submitLabel={t('Send message', 'বার্তা পাঠান')} successTitle={t('Message sent', 'বার্তা পাঠানো হয়েছে')} successBody={t('We’ll reply within one working day.', 'এক কর্মদিবসের মধ্যে উত্তর দেব।')} fields={[
            { name: 'name', label: t('Name', 'নাম'), required: true, half: true, autoComplete: 'name' },
            { name: 'phone', label: t('Mobile', 'মোবাইল'), type: 'tel', half: true, placeholder: '01XXXXXXXXX', hint: t('Phone or email — at least one', 'ফোন বা ইমেইল — অন্তত একটি') },
            { name: 'email', label: t('Email', 'ইমেইল'), type: 'email', autoComplete: 'email' },
            { name: 'subject', label: t('Subject', 'বিষয়'), type: 'select', required: true, options: [['Order question', 'অর্ডার সংক্রান্ত'], ['Product question', 'পণ্য সংক্রান্ত'], ['Delivery & assembly', 'ডেলিভারি ও অ্যাসেম্বলি'], ['Warranty & repair', 'ওয়ারেন্টি ও মেরামত'], ['Other', 'অন্যান্য']].map(([a, b]) => ({ value: a, label: t(a, b) })) },
            { name: 'message', label: t('Message', 'বার্তা'), type: 'textarea', required: true },
          ]} />
        </div>
      </div>
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'ContactPage', about: orgLd() }]} />
    </>
  );
}
