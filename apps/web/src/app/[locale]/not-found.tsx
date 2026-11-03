'use client';
import Link from 'next/link';
import { useStore } from '@/components/providers';
import { lp } from '@/lib/i18n';

export default function NotFound() {
  const { t, locale } = useStore();
  return (
    <div className="container py-24 md:py-32 text-center" data-testid="not-found">
      <p className="eyebrow">404</p>
      <h1 className="h-display text-5xl md:text-7xl mt-4">{t('This room is empty', 'এই ঘরটি খালি')}</h1>
      <p className="text-muted mt-4 max-w-md mx-auto">{t('The page you’re looking for has moved or never existed. Let’s get you somewhere comfortable.', 'আপনি যে পাতাটি খুঁজছেন তা সরানো হয়েছে বা নেই। চলুন আরামদায়ক কোথাও যাই।')}</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link className="btn btn-primary" href={lp(locale, '/')}>{t('Back home', 'হোমে ফিরুন')}</Link>
        <Link className="btn btn-outline" href={lp(locale, '/shop')}>{t('Shop furniture', 'ফার্নিচার কিনুন')}</Link>
        <Link className="btn btn-ghost" href={lp(locale, '/search')}>{t('Search', 'খুঁজুন')}</Link>
      </div>
    </div>
  );
}
