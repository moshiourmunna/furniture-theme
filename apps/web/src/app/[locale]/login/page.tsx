import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '@/components/account/auth';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMeta({ locale, path: '/login', title: tr(locale)('Sign in', 'সাইন ইন'), description: tr(locale)('Sign in — Shekor', 'সাইন ইন — শেকড়'), noindex: true });
}

export default function Page() {
  return <Suspense><LoginPage /></Suspense>;
}
