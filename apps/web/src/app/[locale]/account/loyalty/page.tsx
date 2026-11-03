import type { Metadata } from 'next';
import { AccountLoyalty } from '@/components/account/account';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  return { title: tr(locale)('Shekor Circle', 'শেকড় সার্কেল') };
}

export default function Page() {
  return <AccountLoyalty />;
}
