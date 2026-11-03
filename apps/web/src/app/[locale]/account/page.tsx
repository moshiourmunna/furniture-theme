import type { Metadata } from 'next';
import { AccountHome } from '@/components/account/account';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return { title: tr(locale)('My account', 'আমার অ্যাকাউন্ট') };
}

export default function Page() {
  return <AccountHome />;
}
