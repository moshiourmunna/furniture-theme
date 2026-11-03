import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrackPage } from '@/components/commerce/track';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/track', title: tr(locale)('Track your order', 'অর্ডার ট্র্যাক করুন'), description: tr(locale)('Track your order — Shekor', 'অর্ডার ট্র্যাক করুন — শেকড়'), noindex: false });
}

export default function Page() {
  return <Suspense><TrackPage /></Suspense>;
}
