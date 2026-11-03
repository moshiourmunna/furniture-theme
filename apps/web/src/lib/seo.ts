import 'server-only';
import type { Metadata } from 'next';
import type { Locale } from './i18n';

export const SITE_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
export const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`);

/** Metadata with canonical + hreflang (en, bn, x-default), Open Graph and Twitter cards. */
export function pageMeta(opts: { locale: Locale; path: string; title: string; description: string; image?: string | null; noindex?: boolean; type?: 'website' | 'article' }): Metadata {
  const p = opts.path === '/' ? '' : opts.path;
  const url = abs(`/${opts.locale}${p}`);
  const image = abs(opts.image || '/media/og/shekor-og.jpg');
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url, languages: { en: abs(`/en${p}`), bn: abs(`/bn${p}`), 'x-default': abs(`/en${p}`) } },
    openGraph: { type: opts.type ?? 'website', url, title: opts.title, description: opts.description, siteName: 'Shekor', locale: opts.locale === 'bn' ? 'bn_BD' : 'en_US', alternateLocale: opts.locale === 'bn' ? 'en_US' : 'bn_BD', images: [{ url: image, width: 1200, height: 630, alt: opts.title }] },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, images: [image], site: '@shekorbd' },
    robots: opts.noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export const orgLd = () => ({
  '@context': 'https://schema.org', '@type': 'FurnitureStore', '@id': `${SITE_URL}/#org`, name: 'Shekor', legalName: 'Shekor Furniture Ltd.', url: SITE_URL,
  logo: abs('/brand/shekor-icon-light.svg'), image: abs('/media/og/shekor-og.jpg'), telephone: '+8809612345678', email: 'hello@shekor.com.bd', priceRange: '৳৳৳', currenciesAccepted: 'BDT',
  address: { '@type': 'PostalAddress', streetAddress: 'House 42, Road 11, Banani', addressLocality: 'Dhaka', postalCode: '1213', addressCountry: 'BD' },
  sameAs: ['https://facebook.com/shekor.bd', 'https://instagram.com/shekor.bd', 'https://youtube.com/@shekor', 'https://linkedin.com/company/shekor'],
});

export const breadcrumbLd = (locale: Locale, items: { name: string; path?: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, ...(it.path ? { item: abs(`/${locale}${it.path === '/' ? '' : it.path}`) } : {}) })),
});
