import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, lp, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Hero, JsonLd } from '@/components/ui';
import { CRAFT_STEPS, MaterialList } from '@/components/showcase';
import { CtaBand, Stats, Steps } from '@/components/editorial';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/craft', title: t('Craftsmanship — how Shekor furniture is made', 'কারুশিল্প — শেকড় ফার্নিচার যেভাবে তৈরি হয়'), description: t('Seasoned Segun, mortise-and-tenon joints and seven hand-rubbed coats: inside the Shekor workshop in Gazipur.', 'শুকানো সেগুন, মর্টিস-টেনন জোড় আর সাত স্তর হাতে ঘষা ফিনিশ: গাজীপুরে শেকড়ের কারখানার ভেতরে।') });
}

export default async function Craft({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Craftsmanship', 'কারুশিল্প') }];
  return (
    <>
      <Hero image="/media/img/about-workshop.webp" alt={t('Karigor at work in Gazipur', 'গাজীপুরে কাজ করছেন কারিগর')} eyebrow={t('Craftsmanship', 'কারুশিল্প')} title={t('Made slowly, by hand, in Gazipur', 'গাজীপুরে, হাতে, ধীরে তৈরি')} sub={t('140 karigors, 18 months of seasoning and seven coats of finish — the long way round, on purpose.', '১৪০ জন কারিগর, ১৮ মাস কাঠ শুকানো আর সাত স্তর ফিনিশ — ইচ্ছে করেই লম্বা পথ।')} height="h-[80svh]" crumbs={<Breadcrumbs locale={locale} items={crumbs} light />} />
      <section className="container py-24"><Stats locale={locale} items={[['18', 'months of seasoning', 'মাস কাঠ শুকানো'], ['140', 'master karigors', 'ওস্তাদ কারিগর'], ['7', 'coats of finish', 'স্তর ফিনিশ'], ['10', 'year frame warranty', 'বছরের ফ্রেম ওয়ারেন্টি']]} /></section>
      <section className="container"><Steps locale={locale} items={[...CRAFT_STEPS, ['Checked twice', 'দুবার যাচাই', 'Every piece is inspected at the bench and again before it leaves the warehouse.', 'প্রতিটি পিস বেঞ্চে এবং ওয়্যারহাউস ছাড়ার আগে আবার পরীক্ষা করা হয়।']]} /></section>
      <section className="container mt-28 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6"><Figure src="/media/img/custom.webp" alt={t('Measuring timber for a bespoke order', 'বেসপোক অর্ডারের জন্য কাঠ মাপা')} /></div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow">{t('Materials', 'উপকরণ')}</p>
          <h2 className="h-display text-4xl md:text-5xl mt-4">{t('Woods that suit the monsoon', 'বর্ষার উপযোগী কাঠ')}</h2>
          <p className="text-muted mt-6 leading-relaxed">{t('We buy Segun and Mahogany from managed plantations in Chattogram and Sylhet, air-dry it under cover and finish the job in our own kilns. Fabrics come from Tangail looms; brass from Old Dhaka.', 'চট্টগ্রাম ও সিলেটের ব্যবস্থাপিত বাগান থেকে সেগুন ও মেহগনি কিনি, ছাউনির নিচে শুকাই, তারপর নিজস্ব কিলনে শেষ করি। কাপড় আসে টাঙ্গাইলের তাঁত থেকে; ব্রাস পুরান ঢাকা থেকে।')}</p>
          <Link href={lp(locale, '/shop')} className="link-line mt-8">{t('See the pieces', 'পিসগুলো দেখুন')}</Link>
        </div>
      </section>
      <section className="container mt-20"><MaterialList locale={locale} /></section>
      <CtaBand locale={locale} title={t('See it being made', 'তৈরি হতে দেখুন')} body={t('Workshop tours run on the first Saturday of every month.', 'প্রতি মাসের প্রথম শনিবার কারখানা ভ্রমণ হয়।')} primary={[t('Book a visit', 'ভিজিট বুক করুন'), '/consultation']} secondary={[t('Our story', 'আমাদের গল্প'), '/about']} />
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
