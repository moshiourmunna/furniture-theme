import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutPage } from '@/components/commerce/checkout-page';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/checkout', title: tr(locale)('Checkout', 'চেকআউট'), description: tr(locale)('Checkout — Shekor', 'চেকআউট — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><CheckoutPage /></Suspense>;
}
