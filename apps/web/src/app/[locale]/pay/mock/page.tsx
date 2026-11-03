import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PayMock } from '@/components/commerce/pay-mock';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/pay/mock', title: tr(locale)('Payment', 'পেমেন্ট'), description: tr(locale)('Payment — Shekor', 'পেমেন্ট — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><PayMock /></Suspense>;
}
