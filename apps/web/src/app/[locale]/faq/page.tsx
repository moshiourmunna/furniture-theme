import type { Metadata } from 'next';
import Link from 'next/link';
import { listFaqs } from '@/server/services/content';
import { getLocale, lp, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Intro, JsonLd } from '@/components/ui';
import { Faqs, faqLd } from '@/components/faqs';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/faq', title: t('Help & FAQ', 'সহায়তা ও প্রশ্নোত্তর'), description: t('Answers about orders, payment, EMI, delivery, assembly, returns and warranty at Shekor.', 'শেকড়ে অর্ডার, পেমেন্ট, ইএমআই, ডেলিভারি, অ্যাসেম্বলি, রিটার্ন ও ওয়ারেন্টি সম্পর্কে উত্তর।') });
}

export default async function FaqPage({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const faqs = await listFaqs();
  const groups = [...new Set(faqs.map((q) => q.groupEn))];
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Help & FAQ', 'সহায়তা ও প্রশ্নোত্তর') }];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Client care', 'ক্লায়েন্ট কেয়ার')} title={t('How can we help?', 'কীভাবে সাহায্য করতে পারি?')} />
      <div className="container grid lg:grid-cols-[220px_1fr] gap-10">
        <nav aria-label={t('Topics', 'বিষয়')} className="lg:sticky lg:top-28 self-start"><ul className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">{groups.map((g, i) => { const q = faqs.find((x) => x.groupEn === g)!; return <li key={g}><a href={`#g-${i}`} className="chip lg:border-0 lg:px-0 lg:h-auto shrink-0">{locale === 'bn' ? q.groupBn : g}</a></li>; })}</ul></nav>
        <div className="space-y-14 max-w-3xl">
          {groups.map((g, i) => { const items = faqs.filter((x) => x.groupEn === g); return <section key={g} id={`g-${i}`} className="scroll-mt-28"><h2 className="h-display text-3xl mb-4">{locale === 'bn' ? items[0].groupBn : g}</h2><Faqs locale={locale} items={items} /></section>; })}
          <div className="card p-6"><p className="font-semibold">{t('Still need help?', 'আরও সাহায্য দরকার?')}</p><p className="text-sm text-muted mt-1">{t('Our client care team replies within a working day.', 'আমাদের ক্লায়েন্ট কেয়ার টিম এক কর্মদিবসে উত্তর দেয়।')}</p><div className="mt-4 flex gap-3"><Link className="btn btn-primary btn-sm" href={lp(locale, '/contact')}>{t('Contact us', 'যোগাযোগ করুন')}</Link><Link className="btn btn-outline btn-sm" href={lp(locale, '/track')}>{t('Track an order', 'অর্ডার ট্র্যাক')}</Link></div></div>
        </div>
      </div>
      <JsonLd data={[breadcrumbLd(locale, crumbs), faqLd(locale, faqs)]} />
    </>
  );
}
