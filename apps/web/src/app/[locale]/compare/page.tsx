import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ComparePage } from '@/components/commerce/lists';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/compare', title: tr(locale)('Compare', 'তুলনা'), description: tr(locale)('Compare — Shekor', 'তুলনা — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><ComparePage /></Suspense>;
}
