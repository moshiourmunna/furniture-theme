import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartPage } from '@/components/commerce/cart-page';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/cart', title: tr(locale)('Your bag', 'আপনার ব্যাগ'), description: tr(locale)('Your bag — Shekor', 'আপনার ব্যাগ — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><CartPage /></Suspense>;
}
