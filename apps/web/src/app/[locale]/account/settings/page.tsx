import type { Metadata } from 'next';
import { AccountSettings } from '@/components/account/account';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return { title: tr(locale)('Settings', 'সেটিংস') };
}

export default function Page() {
  return <AccountSettings />;
}
