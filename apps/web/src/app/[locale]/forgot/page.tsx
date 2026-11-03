import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPage } from '@/components/account/auth';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/forgot', title: tr(locale)('Reset password', 'পাসওয়ার্ড রিসেট'), description: tr(locale)('Reset password — Shekor', 'পাসওয়ার্ড রিসেট — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><ForgotPage /></Suspense>;
}
