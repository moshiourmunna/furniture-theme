import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WishlistPage } from '@/components/commerce/lists';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/wishlist', title: tr(locale)('Wishlist', 'উইশলিস্ট'), description: tr(locale)('Wishlist — Shekor', 'উইশলিস্ট — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><WishlistPage /></Suspense>;
}
