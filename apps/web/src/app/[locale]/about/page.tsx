import type { Metadata } from 'next';
import { getPage } from '@/server/services/content';
import { cleanHtml } from '@/server/sanitize';
import { getLocale, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, orgLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Hero, JsonLd } from '@/components/ui';
import { CtaBand, Prose, Stats } from '@/components/editorial';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/about', title: t('Our story', 'আমাদের গল্প'), description: t('From a six-person workshop in Gazipur in 2009 to 140 karigors today — the story of Shekor.', '২০০৯ সালে গাজীপুরের ছয়জনের কারখানা থেকে আজ ১৪০ জন কারিগর — শেকড়ের গল্প।') });
}

export default async function About({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const page = await getPage('about');
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Our story', 'আমাদের গল্প') }];
  const values: [string, string, string, string][] = [
    ['Rooted', 'শেকড়ে গাঁথা', 'Bangladeshi woods, looms and hands — and a business that stays here.', 'বাংলাদেশি কাঠ, তাঁত আর হাত — এবং এখানেই থাকা একটি ব্যবসা।'],
    ['Honest', 'সৎ', 'Solid wood means solid wood. We list every material, and price it plainly.', 'সলিড কাঠ মানে সলিড কাঠ। প্রতিটি উপকরণ লিখি, দাম সোজাসাপ্টা রাখি।'],
    ['Lasting', 'টেকসই', 'A 10-year frame warranty, and repairs for as long as the piece is with you.', '১০ বছরের ফ্রেম ওয়ারেন্টি, আর পিস যতদিন আপনার কাছে ততদিন মেরামত।'],
  ];
  return (
    <>
      <Hero image="/media/img/hero-3.webp" alt={t('A Shekor bedroom', 'শেকড়ের একটি শোবার ঘর')} eyebrow={t('Since 2009', '২০০৯ থেকে')} title={page ? f(page, 'title') : t('Our story', 'আমাদের গল্প')} sub={t('Rooted in craft. Made for life.', 'শেকড়ে কারুকাজ। জীবনের জন্য তৈরি।')} height="h-[70svh]" crumbs={<Breadcrumbs locale={locale} items={crumbs} light />} />
      <section className="container py-24 grid lg:grid-cols-12 gap-10">
        <p className="eyebrow lg:col-span-3">{t('The house of Shekor', 'শেকড়ের ঘর')}</p>
        <div className="lg:col-span-8 text-lg">{page && <Prose html={cleanHtml(f(page, 'body'))} />}</div>
      </section>
      <section className="container"><Stats locale={locale} items={[['2009', 'founded in Gazipur', 'গাজীপুরে প্রতিষ্ঠা'], ['140', 'karigors & makers', 'কারিগর ও নির্মাতা'], ['8', 'showrooms', 'শোরুম'], ['12,000+', 'homes furnished', 'বাড়ি সাজানো']]} /></section>
      <section className="container mt-24 grid lg:grid-cols-2 gap-12 items-center">
        <Figure src="/media/img/about-workshop.webp" alt={t('Inside the Gazipur workshop', 'গাজীপুর কারখানার ভেতরে')} ratio="aspect-[4/3]" />
        <ul className="space-y-8">{values.map(([a, b, c, d]) => <li key={a} className="border-t border-line pt-6"><p className="h-display text-3xl">{t(a, b)}</p><p className="text-muted mt-2">{t(c, d)}</p></li>)}</ul>
      </section>
      <CtaBand locale={locale} title={t('Work with us', 'আমাদের সাথে কাজ করুন')} body={t('We’re always looking for karigors, designers and people who care about good furniture. Write to careers@shekor.com.bd.', 'আমরা সবসময় কারিগর, ডিজাইনার এবং ভালো ফার্নিচারকে ভালোবাসেন এমন মানুষ খুঁজি। লিখুন careers@shekor.com.bd-তে।')} primary={[t('Visit a showroom', 'শোরুমে আসুন'), '/showrooms']} secondary={[t('Craftsmanship', 'কারুশিল্প'), '/craft']} />
      <JsonLd data={[breadcrumbLd(locale, crumbs), { ...orgLd(), foundingDate: '2009' }]} />
    </>
  );
}
