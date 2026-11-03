import type { Metadata } from 'next';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { GalleryPage } from '@/components/gallery-page';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/gallery', title: t('Gallery — rooms furnished by Shekor', 'গ্যালারি — শেকড়ের সাজানো ঘর'), description: t('Living rooms, bedrooms, dining and offices furnished with Shekor solid-wood pieces. Shop what you see.', 'শেকড়ের সলিড-কাঠের পিসে সাজানো বসার ঘর, শোবার ঘর, ডাইনিং ও অফিস। যা দেখছেন তা কিনুন।') });
}
export default async function Page({ params }: LocaleParams) {
  return <GalleryPage locale={await getLocale(params)} />;
}
