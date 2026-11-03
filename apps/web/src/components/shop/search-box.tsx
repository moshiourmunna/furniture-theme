'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { lp } from '@/lib/i18n';
import { useStore } from '../providers';

export function SearchBox({ initial }: { initial: string }) {
  const { t, locale } = useStore();
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form role="search" className="mt-6 flex items-center gap-3 border-b border-ink pb-2 max-w-2xl" onSubmit={(e) => { e.preventDefault(); router.push(lp(locale, `/search?q=${encodeURIComponent(q.trim())}`)); }}>
      <Search className="w-5 h-5 text-muted" />
      <label htmlFor="page-q" className="sr-only">{t('Search', 'খুঁজুন')}</label>
      <input id="page-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent h-11 text-lg outline-none" placeholder={t('Search sofas, beds, teak…', 'সোফা, খাট, সেগুন খুঁজুন…')} data-testid="search-page-input" />
      <button type="submit" className="btn btn-primary btn-sm">{t('Search', 'খুঁজুন')}</button>
    </form>
  );
}
