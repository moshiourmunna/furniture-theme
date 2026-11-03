import Script from 'next/script';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';
import { SITE_URL, orgLd } from '@/lib/seo';
import { Providers } from '@/components/providers';
import { BagDrawer, BottomNav, CookieConsent, NavDrawer, Reveal, SearchOverlay, SiteHeader, ThemeSync, WhatsApp, type NavData } from '@/components/chrome';
import { SiteFooter } from '@/components/footer';
import { JsonLd } from '@/components/ui';
import { taxonomy } from '@/server/services/catalog';
import { getSettings } from '@/server/services/content';
import '../globals.css';

const jakarta = localFont({ src: '../fonts/jakarta-latin.woff2', variable: '--font-jakarta', weight: '200 800', display: 'swap' });
const fraunces = localFont({ src: '../fonts/fraunces-latin.woff2', variable: '--font-fraunces', weight: '300 700', display: 'swap' });
const hind = localFont({
  src: [
    { path: '../fonts/hind-siliguri-bn-400.woff2', weight: '400' }, { path: '../fonts/hind-siliguri-bn-500.woff2', weight: '500' },
    { path: '../fonts/hind-siliguri-bn-600.woff2', weight: '600' }, { path: '../fonts/hind-siliguri-bn-700.woff2', weight: '700' },
  ],
  variable: '--font-hind', display: 'swap',
});

export const revalidate = 300;
export const generateStaticParams = () => [{ locale: 'en' }, { locale: 'bn' }];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const bn = locale === 'bn';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: bn ? 'শেকড় — শেকড়ে কারুকাজ, জীবনের জন্য তৈরি' : 'Shekor — Rooted in craft, made for life', template: bn ? '%s · শেকড়' : '%s · Shekor' },
    description: bn ? 'বাংলাদেশের প্রিমিয়াম সলিড-কাঠের ফার্নিচার — হাতে তৈরি সেগুন, শাল ও মেহগনি।' : 'Premium solid-wood furniture made in Bangladesh — hand-finished teak, sal and mahogany for homes that last.',
    applicationName: 'Shekor',
    icons: { icon: [{ url: '/brand/favicon.svg', type: 'image/svg+xml' }], apple: '/brand/apple-touch-icon.png' },
    manifest: '/manifest.webmanifest',
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F4EFE6' }, { media: '(prefers-color-scheme: dark)', color: '#14231C' }],
  width: 'device-width', initialScale: 1,
};

// Runs before paint: applies the saved/system theme so there is no light→dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('shekor-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const [tx, settings] = await Promise.all([taxonomy(), getSettings()]);
  const pick = ({ slug, nameEn, nameBn }: { slug: string; nameEn: string; nameBn: string }) => ({ slug, nameEn, nameBn });
  const featureCol = tx.collections[0];
  const nav: NavData = {
    rooms: tx.rooms.map(pick), categories: tx.categories.filter((c) => !c.parentId).map(pick), collections: tx.collections.slice(0, 6).map(pick), brands: tx.brands.map(pick),
    feature: featureCol ? { image: featureCol.heroImage ?? '/media/img/hero-1.webp', href: `/collections/${featureCol.slug}`, titleEn: featureCol.nameEn, titleBn: featureCol.nameBn } : null,
  };
  return (
    <html lang={locale} className={`${jakarta.variable} ${fraunces.variable} ${hind.variable} ${locale === 'bn' ? 'lang-bn' : ''}`} suppressHydrationWarning>
      <head>
        <Script id="shekor-theme" strategy="beforeInteractive">{themeScript}</Script>
      </head>
      <body className="bg-bg text-ink font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-ink focus:text-bg focus:px-4 focus:py-2">{locale === 'bn' ? 'মূল কনটেন্টে যান' : 'Skip to content'}</a>
        <Providers locale={locale}>
          <SiteHeader nav={nav} />
          <SearchOverlay />
          <NavDrawer nav={nav} />
          <BagDrawer />
          <main id="main">{children}</main>
          <SiteFooter locale={locale} store={settings.store} social={settings.social} />
          <BottomNav />
          <WhatsApp number={settings.store?.whatsapp ?? '8801711000000'} />
          <CookieConsent />
          <Reveal />
          <ThemeSync />
        </Providers>
        <JsonLd data={[orgLd(), { '@context': 'https://schema.org', '@type': 'WebSite', url: SITE_URL, name: 'Shekor', inLanguage: locale === 'bn' ? 'bn-BD' : 'en', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/${locale}/search?q={query}`, 'query-input': 'required name=query' } }]} />
      </body>
    </html>
  );
}
