import type { Metadata } from 'next';
import { AccountOrder } from '@/components/account/account';
import type { LocaleParams } from '@/lib/i18n';

type P = LocaleParams<{ orderNo: string }>;
export async function generateMetadata({ params }: P): Promise<Metadata> {
  return { title: (await params).orderNo };
}

export default async function Page({ params }: P) {
  return <AccountOrder orderNo={(await params).orderNo} />;
}
