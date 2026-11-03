import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, lp, money, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta, abs } from '@/lib/seo';
import { Breadcrumbs, Figure, Hero, JsonLd } from '@/components/ui';
import { CtaBand, Steps } from '@/components/editorial';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/interior-design', title: t('Interior design service', 'ইন্টেরিয়র ডিজাইন সেবা'), description: t('Room plans, 3D visuals, styling and installation by the Shekor in-house interior studio — from one room to a whole home.', 'শেকড় ইন্টেরিয়র স্টুডিওর রুম প্ল্যান, থ্রিডি ভিজ্যুয়াল, স্টাইলিং ও ইনস্টলেশন — একটি ঘর থেকে পুরো বাড়ি।') });
}

export default async function InteriorDesign({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Interior design', 'ইন্টেরিয়র ডিজাইন') }];
  const packages: [string, string, number, string, string][] = [
    ['Room refresh', 'রুম রিফ্রেশ', 0, 'One room, a styling plan and a shopping list — free with any purchase over ৳1,00,000.', 'একটি ঘর, স্টাইলিং প্ল্যান ও শপিং লিস্ট — ৳১,০০,০০০+ কেনাকাটায় ফ্রি।'],
    ['Full room', 'পুরো ঘর', 15000, '2D layout, 3D render, material board and two revisions. Fee credited against your order.', '2D লেআউট, 3D রেন্ডার, ম্যাটেরিয়াল বোর্ড ও দুটি সংশোধন। ফি অর্ডারে সমন্বয় হয়।'],
    ['Whole home', 'পুরো বাড়ি', 60000, 'Every room planned, furniture made and installed by our team, with a dedicated designer.', 'প্রতিটি ঘরের পরিকল্পনা, আমাদের টিমের তৈরি ও স্থাপন, নিজস্ব ডিজাইনারসহ।'],
  ];
  return (
    <>
      <Hero image="/media/img/look-1.webp" alt={t('A living room designed by the Shekor studio', 'শেকড় স্টুডিওর ডিজাইন করা বসার ঘর')} eyebrow={t('Interior design service', 'ইন্টেরিয়র ডিজাইন সেবা')} title={t('Rooms planned around how you live', 'আপনার জীবনযাপন অনুযায়ী ঘর')} sub={t('Our in-house studio plans layouts, chooses materials and installs everything — from one corner to the whole home.', 'আমাদের স্টুডিও লেআউট পরিকল্পনা, উপকরণ বাছাই ও সবকিছু স্থাপন করে — একটি কোণ থেকে পুরো বাড়ি।')} height="h-[80svh]" crumbs={<Breadcrumbs locale={locale} items={crumbs} light />}>
        <Link href={lp(locale, '/consultation')} className="btn btn-light">{t('Book a free consultation', 'ফ্রি পরামর্শ বুক করুন')}</Link>
      </Hero>
      <section className="container py-24"><Steps locale={locale} items={[
        ['Meet', 'সাক্ষাৎ', 'A free 45-minute consultation in a showroom, by video or at home.', 'শোরুমে, ভিডিওতে বা বাসায় ৪৫ মিনিটের ফ্রি পরামর্শ।'],
        ['Plan', 'পরিকল্পনা', 'Measured drawings, a 2D layout and a 3D render of your room.', 'মাপা ড্রয়িং, 2D লেআউট ও আপনার ঘরের 3D রেন্ডার।'],
        ['Make', 'তৈরি', 'Pieces made to size in our Gazipur workshop, finishes approved by you.', 'গাজীপুর কারখানায় মাপমতো তৈরি, ফিনিশ আপনার অনুমোদিত।'],
        ['Install', 'স্থাপন', 'Delivery, assembly and styling by our own team — in a single day where possible.', 'আমাদের নিজস্ব টিমে ডেলিভারি, অ্যাসেম্বলি ও স্টাইলিং — সম্ভব হলে এক দিনে।'],
      ]} /></section>
      <section className="container">
        <p className="eyebrow mb-8">{t('Packages', 'প্যাকেজ')}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map(([a, b, price, c, d], i) => (
            <article key={a} className={`border p-8 flex flex-col ${i === 1 ? 'border-ink' : 'border-line'}`} data-reveal>
              <h2 className="h-display text-3xl">{t(a, b)}</h2>
              <p className="text-2xl mt-4">{price ? money(locale, price) : t('Free', 'ফ্রি')}</p>
              <p className="text-muted mt-3 text-sm leading-relaxed flex-1">{t(c, d)}</p>
              <Link href={lp(locale, '/consultation')} className={`btn mt-6 ${i === 1 ? 'btn-primary' : 'btn-outline'}`}>{t('Start here', 'এখান থেকে শুরু')}</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="container mt-24 grid md:grid-cols-3 gap-6"><Figure src="/media/img/look-2.webp" alt={t('Dining room', 'ডাইনিং রুম')} ratio="aspect-[3/4]" /><Figure src="/media/img/look-3.webp" alt={t('Bedroom', 'শোবার ঘর')} ratio="aspect-[3/4]" className="md:mt-16" /><Figure src="/media/img/room-office.webp" alt={t('Home office', 'হোম অফিস')} ratio="aspect-[3/4]" /></section>
      <CtaBand locale={locale} title={t('Let’s plan your room', 'চলুন আপনার ঘর পরিকল্পনা করি')} primary={[t('Book a consultation', 'পরামর্শ বুক করুন'), '/consultation']} secondary={[t('See projects', 'প্রজেক্ট দেখুন'), '/projects']} />
      <JsonLd data={[breadcrumbLd(locale, crumbs), { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Interior design', provider: { '@id': abs('/#org') }, areaServed: { '@type': 'Country', name: 'Bangladesh' }, offers: packages.map(([a, , price]) => ({ '@type': 'Offer', name: a, price, priceCurrency: 'BDT' })) }]} />
    </>
  );
}
