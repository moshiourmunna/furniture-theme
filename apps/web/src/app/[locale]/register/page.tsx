import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterPage } from '@/components/account/auth';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/register', title: tr(locale)('Create an account', 'অ্যাকাউন্ট খুলুন'), description: tr(locale)('Create an account — Shekor', 'অ্যাকাউন্ট খুলুন — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><RegisterPage /></Suspense>;
}
