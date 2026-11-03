import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/server/services/catalog';
import { getSettings, listZones } from '@/server/services/content';
import { getLocale, lp, money, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { cleanHtml } from '@/server/sanitize';
import { Breadcrumbs, JsonLd, SectionHead, Stars } from '@/components/ui';
import { Rail } from '@/components/product-card';
import { ProductGallery } from '@/components/product/gallery';
import { BuyBox } from '@/components/product/buy-box';
import { Reviews } from '@/components/product/reviews';
import { RecentlyViewed, Tabs } from '@/components/product/extras';

type Props = LocaleParams<{ slug: string }>;
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const f = pf(locale);
  const t = tr(locale);
  return pageMeta({ locale, path: `/p/${slug}`, title: (locale === 'bn' ? p.metaTitleBn : p.metaTitleEn) || `${f(p, 'name')} — ${money(locale, p.price)}`, description: (locale === 'bn' ? p.metaDescBn : p.metaDescEn) || f(p, 'short') || t(`${p.nameEn} in ${p.material?.nameEn ?? 'solid wood'}, handcrafted in Bangladesh.`, `${p.nameBn}, বাংলাদেশে হাতে তৈরি।`), image: p.images[0]?.url });
}

export default async function ProductPage({ params }: Props) {
  const locale = await getLocale(params);
  const { slug } = await params;
  const [p, zones, settings] = await Promise.all([getProduct(slug), listZones(), getSettings()]);
  if (!p) notFound();
  const t = tr(locale);
  const f = pf(locale);
  const name = f(p, 'name');
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Furniture', 'ফার্নিচার'), path: '/shop' }, { name: f(p.category, 'name'), path: `/shop/${p.category.slug}` }, { name }];
  const images = p.images.map((im, i) => ({ url: im.url, alt: (locale === 'bn' ? im.altBn : im.altEn) || `${name} — ${i + 1}` }));
  const badge = p.badge === 'new' ? t('New', 'নতুন') : p.stockStatus === 'MADE_TO_ORDER' ? t('Made to order', 'অর্ডারে তৈরি') : null;
  const inch = (cm: number | null) => (cm ? Math.round(cm / 2.54) : null);
  const specs: [string, string | null][] = [
    [t('Product code', 'প্রোডাক্ট কোড'), p.sku],
    [t('Material', 'উপকরণ'), p.material ? f(p.material, 'name') : null],
    [t('Collection', 'কালেকশন'), p.collection ? f(p.collection, 'name') : null],
    [t('Brand', 'ব্র্যান্ড'), p.brand ? f(p.brand, 'name') : null],
    [t('Dimensions (W × D × H)', 'মাপ (প্র × গ × উ)'), p.widthCm ? `${num(locale, p.widthCm)} × ${num(locale, p.depthCm ?? 0)} × ${num(locale, p.heightCm ?? 0)} cm` : null],
    [t('Seats', 'আসন'), p.seats ? num(locale, p.seats) : null],
    [t('Weight', 'ওজন'), p.weightKg ? `${num(locale, p.weightKg)} kg` : null],
    [t('Assembly', 'অ্যাসেম্বলি'), p.assemblyRequired ? t('Required · free in Dhaka', 'প্রয়োজন · ঢাকায় ফ্রি') : t('Delivered assembled', 'জোড়া লাগানো অবস্থায় ডেলিভারি')],
    [t('Warranty', 'ওয়ারেন্টি'), t(`${p.warrantyYears} years on the frame`, `ফ্রেমে ${num('bn', p.warrantyYears)} বছর`)],
  ];
  const reviews = p.reviews.map((r) => ({ id: r.id, authorName: r.authorName, location: r.location, rating: r.rating, title: r.title, body: r.body, photos: Array.isArray(r.photos) ? (r.photos as string[]) : [], verified: r.verified, reply: r.reply, createdAt: r.createdAt.toISOString() }));
  const avail = p.stockStatus === 'OUT_OF_STOCK' ? 'OutOfStock' : p.stockStatus === 'MADE_TO_ORDER' ? 'PreOrder' : p.stockStatus === 'LOW' ? 'LimitedAvailability' : 'InStock';
  const productLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.nameEn, alternateName: p.nameBn, sku: p.sku, mpn: p.sku, image: p.images.map((i) => abs(i.url)), description: p.shortEn ?? p.descriptionEn?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? p.nameEn,
    brand: { '@type': 'Brand', name: p.brand?.nameEn ?? 'Shekor' }, category: p.category.nameEn, material: p.material?.nameEn,
    ...(p.widthCm ? { width: { '@type': 'QuantitativeValue', value: p.widthCm, unitCode: 'CMT' }, depth: { '@type': 'QuantitativeValue', value: p.depthCm, unitCode: 'CMT' }, height: { '@type': 'QuantitativeValue', value: p.heightCm, unitCode: 'CMT' } } : {}),
    ...(p.ratingCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.ratingAvg, reviewCount: p.ratingCount } } : {}),
    review: reviews.slice(0, 5).map((r) => ({ '@type': 'Review', author: { '@type': 'Person', name: r.authorName }, reviewRating: { '@type': 'Rating', ratingValue: r.rating }, name: r.title, reviewBody: r.body, datePublished: r.createdAt.slice(0, 10) })),
    offers: {
      '@type': 'Offer', url: abs(`/${locale}/p/${p.slug}`), priceCurrency: 'BDT', price: p.price, priceValidUntil: `${new Date().getFullYear()}-12-31`, availability: `https://schema.org/${avail}`, itemCondition: 'https://schema.org/NewCondition', seller: { '@id': abs('/#org') },
      shippingDetails: { '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD' }, deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 10, unitCode: 'DAY' } } },
      hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'BD', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 7 },
    },
  };
  const desc = f(p, 'description');
  return (
    <>
      <div className="container pt-6"><Breadcrumbs locale={locale} items={crumbs} /></div>
      <div className="container mt-6 grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-14 items-start">
        <ProductGallery images={images} badge={badge} />
        <section aria-labelledby="pdp-title" className="lg:sticky lg:top-28">
          {p.collection && <Link href={lp(locale, `/collections/${p.collection.slug}`)} className="label-sm text-muted hover:text-ink">{f(p.collection, 'name')} {t('collection', 'কালেকশন')}</Link>}
          <h1 id="pdp-title" className="h-display text-4xl md:text-5xl mt-2 leading-[1.05]">{name}</h1>
          {p.ratingCount > 0 && <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm"><Stars value={p.ratingAvg} /><span className="text-muted">{num(locale, p.ratingAvg.toFixed(1))} · {num(locale, p.ratingCount)} {t('reviews', 'রিভিউ')}</span></a>}
          {f(p, 'short') && <p className="text-muted mt-4 leading-relaxed">{f(p, 'short')}</p>}
          <BuyBox
            p={{ id: p.id, slug: p.slug, nameEn: p.nameEn, nameBn: p.nameBn, price: p.price, compareAtPrice: p.compareAtPrice, stockStatus: p.stockStatus, leadTimeDays: p.leadTimeDays, emiAvailable: p.emiAvailable, image: p.images[0]?.url ?? null, warrantyYears: p.warrantyYears, variants: p.variants.map((v) => ({ id: v.id, nameEn: v.nameEn, nameBn: v.nameBn, optionType: v.optionType, swatchHex: v.swatchHex, priceDelta: v.priceDelta, stockQty: v.stockQty, isDefault: v.isDefault })) }}
            zones={zones.map((z) => ({ nameEn: z.nameEn, nameBn: z.nameBn, divisions: z.divisions, districts: z.districts, charge: z.charge, freeOver: z.freeOver, leadDaysMin: z.leadDaysMin, leadDaysMax: z.leadDaysMax, codAvailable: z.codAvailable }))}
            whatsapp={settings.store?.whatsapp ?? '8801711000000'}
          />
        </section>
      </div>
      <Tabs tabs={[
        { key: 'desc', label: t('Description', 'বিবরণ'), content: /<[a-z][\s\S]*>/i.test(desc ?? '') ? <div className="prose-sk max-w-3xl" dangerouslySetInnerHTML={{ __html: cleanHtml(desc!) }} /> : <div className="prose-sk max-w-3xl">{(desc || f(p, 'short')).split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}</div> },
        { key: 'specs', label: t('Specifications', 'স্পেসিফিকেশন'), content: <table className="w-full max-w-3xl text-sm"><caption className="sr-only">{t('Specifications', 'স্পেসিফিকেশন')}</caption><tbody>{specs.filter(([, v]) => v).map(([k, v]) => <tr key={k} className="border-b border-line"><th scope="row" className="py-3 pr-4 text-left font-medium text-muted w-2/5">{k}</th><td className="py-3">{v}</td></tr>)}</tbody></table> },
        ...(p.widthCm ? [{ key: 'dims', label: t('Dimensions', 'মাপ'), content: (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <svg viewBox="0 0 520 260" className="w-full max-w-lg text-ink" role="img" aria-label={t(`Dimension diagram: ${p.widthCm} cm wide, ${p.depthCm} cm deep, ${p.heightCm} cm high`, `মাপের চিত্র: প্রস্থ ${p.widthCm}, গভীরতা ${p.depthCm}, উচ্চতা ${p.heightCm} সেমি`)}>
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="60" y="70" width="400" height="110" rx="14" /><path d="M70 180v42M450 180v42" /></g>
              <g stroke="rgb(var(--accent))" strokeWidth="1.5" fill="rgb(var(--accent))" fontSize="14"><path d="M60 245h400M60 240v10M460 240v10" /><text x="260" y="238" textAnchor="middle" stroke="none">{p.widthCm} cm / {inch(p.widthCm)}″ (W)</text><path d="M490 70v152M485 70h10M485 222h10" /><text x="500" y="150" stroke="none" transform="rotate(90 500 150)" textAnchor="middle">{p.heightCm} cm (H)</text><text x="260" y="45" textAnchor="middle" stroke="none">{p.depthCm} cm / {inch(p.depthCm)}″ (D)</text></g>
            </svg>
            <div className="space-y-3 text-sm"><p className="font-semibold">{t('Will it fit?', 'জায়গা হবে তো?')}</p><p className="text-muted">{t('Measure doorways, stairs and lifts before ordering. Our delivery team can remove legs and arms where the design allows; call us if you’re unsure.', 'অর্ডারের আগে দরজা, সিঁড়ি ও লিফটের মাপ নিন। ডিজাইন অনুযায়ী আমাদের টিম পা ও হাতল খুলে নিতে পারে; নিশ্চিত না হলে ফোন করুন।')}</p></div>
          </div>) }] : []),
        { key: 'care', label: t('Materials & care', 'উপকরণ ও যত্ন'), content: <div className="prose-sk max-w-3xl"><p>{(p.material && f(p.material, 'care')) || t('Dust weekly with a dry cotton cloth. Keep at least 6 inches from walls in monsoon for airflow. Avoid direct sunlight to protect the finish.', 'সপ্তাহে একবার শুকনো সুতি কাপড়ে মুছুন। বর্ষায় দেয়াল থেকে অন্তত ৬ ইঞ্চি দূরে রাখুন। সরাসরি রোদ এড়িয়ে চলুন।')}</p></div> },
        { key: 'ship', label: t('Delivery & returns', 'ডেলিভারি ও রিটার্ন'), content: (
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {zones.slice(0, 3).map((z) => <div key={z.code} className="card p-5"><p className="font-semibold">{f(z, 'name')}</p><p className="text-muted mt-2">{z.charge ? money(locale, z.charge) : t('Free', 'ফ্রি')}{z.freeOver ? t(` · free over ${money('en', z.freeOver)}`, ` · ${money('bn', z.freeOver)}+ এ ফ্রি`) : ''} · {num(locale, z.leadDaysMin)}–{num(locale, z.leadDaysMax)} {t('days', 'দিন')}</p></div>)}
            <p className="md:col-span-3 text-muted">{t('7-day returns on in-stock pieces in original condition. Made-to-order pieces can’t be returned unless faulty.', 'স্টকের পিসে মূল অবস্থায় ৭ দিনে রিটার্ন। অর্ডারে তৈরি পিস ত্রুটি না থাকলে ফেরত হয় না।')} <Link className="link" href={lp(locale, '/policy/returns')}>{t('Returns policy', 'রিটার্ন নীতি')}</Link></p>
          </div>) },
      ]} />
      <Reviews slug={p.slug} reviews={reviews} avg={p.ratingAvg} count={p.ratingCount} dist={p.ratingDist} />
      {p.related.length > 0 && <section className="container mt-20"><SectionHead locale={locale} eyebrow={t('You may also like', 'আপনার পছন্দ হতে পারে')} title={t('Pieces that belong together', 'একসাথে মানানসই পিস')} href={`/shop/${p.category.slug}`} /><Rail items={p.related} locale={locale} /></section>}
      <RecentlyViewed id={p.id} />
      <div className="h-16 md:hidden" aria-hidden />
      <JsonLd data={[breadcrumbLd(locale, crumbs), productLd]} />
    </>
  );
}
