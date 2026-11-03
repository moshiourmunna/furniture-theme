import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, MapPin, Phone } from 'lucide-react';
import { listShowrooms } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Figure, Intro, JsonLd } from '@/components/ui';
import { ShowroomMap } from '@/components/showroom-map';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/showrooms', title: t('Showrooms — visit Shekor in Dhaka, Chattogram, Sylhet, Rajshahi & Khulna', 'শোরুম — ঢাকা, চট্টগ্রাম, সিলেট, রাজশাহী ও খুলনায় শেকড়'), description: t('Find a Shekor showroom near you: addresses, opening hours, services and directions.', 'কাছের শেকড় শোরুম খুঁজুন: ঠিকানা, সময়, সেবা ও দিকনির্দেশনা।') });
}

export default async function Showrooms({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const rooms = await listShowrooms();
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Showrooms', 'শোরুম') }];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Showrooms', 'শোরুম')} title={t(`${rooms.length} showrooms across Bangladesh`, `সারা বাংলাদেশে ${num('bn', rooms.length)}টি শোরুম`)} sub={t('Sit, touch and compare finishes with a designer — tea is on us.', 'ডিজাইনারের সাথে বসুন, ছুঁয়ে দেখুন, ফিনিশ মিলিয়ে নিন — চা আমাদের পক্ষ থেকে।')} />
      <section className="container"><ShowroomMap rooms={rooms.map((r) => ({ id: r.id, name: `${f(r, 'name')} · ${r.city}`, lat: Number(r.lat), lng: Number(r.lng) }))} /></section>
      <section className="container mt-16 grid md:grid-cols-2 gap-x-8 gap-y-14">
        {rooms.map((r) => (
          <article key={r.slug} className="grid sm:grid-cols-[200px_1fr] gap-6" data-testid="showroom-card">
            <Figure src={r.image ?? '/media/img/showroom.webp'} alt={f(r, 'name')} ratio="aspect-[4/3] sm:aspect-square" sizes="200px" />
            <div>
              <p className="label-sm text-muted">{r.city}{r.isFlagship ? ` · ${t('Flagship', 'ফ্ল্যাগশিপ')}` : ''}</p>
              <h2 className="h-display text-2xl mt-1">{f(r, 'name')}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />{f(r, 'address')}</li>
                <li className="flex gap-2"><Clock className="w-4 h-4 shrink-0 mt-0.5" />{num(locale, r.hours)}</li>
                <li className="flex gap-2"><Phone className="w-4 h-4 shrink-0 mt-0.5" /><a href={`tel:${r.phone.replace(/\D/g, '')}`} className="hover:text-ink">{num(locale, r.phone)}</a></li>
              </ul>
              <p className="mt-3 flex flex-wrap gap-1.5">{(Array.isArray(r.services) ? (r.services as string[]) : []).map((s) => <span key={s} className="chip h-7 text-[11px]">{s}</span>)}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><a className="link-line" href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer">{t('Directions', 'দিকনির্দেশনা')}</a><Link className="link-line" href={lp(locale, '/consultation')}>{t('Book a visit', 'ভিজিট বুক করুন')}</Link></div>
            </div>
          </article>
        ))}
      </section>
      <JsonLd data={[breadcrumbLd(locale, crumbs), ...rooms.map((r) => ({ '@context': 'https://schema.org', '@type': 'FurnitureStore', name: `Shekor ${r.nameEn}`, parentOrganization: { '@id': abs('/#org') }, telephone: r.phone, image: abs(r.image ?? '/media/img/showroom.webp'), address: { '@type': 'PostalAddress', streetAddress: r.addressEn, addressLocality: r.city, addressCountry: 'BD' }, geo: { '@type': 'GeoCoordinates', latitude: Number(r.lat), longitude: Number(r.lng) }, openingHours: r.hours }))]} />
    </>
  );
}
