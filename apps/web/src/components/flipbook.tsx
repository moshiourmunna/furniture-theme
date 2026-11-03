'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from 'lucide-react';
import { num } from '@/lib/i18n';
import { useStore } from './providers';

/**
 * Catalogue flipbook: two-page spreads on wide screens (cover alone), single pages on narrow screens.
 * Keyboard (←/→, Home/End), swipe, thumbnails and fullscreen. Page-turn animation is skipped for reduced motion.
 */
export function Flipbook({ pages, title, pdfHref }: { pages: string[]; title: string; pdfHref: string }) {
  const { t, locale } = useStore();
  const [wide, setWide] = useState(false);
  const [i, setI] = useState(0); // index of the left-most visible page
  const [dir, setDir] = useState<0 | 1 | -1>(0);
  const [fs, setFs] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    const fsOn = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fsOn);
    return () => { mq.removeEventListener('change', on); document.removeEventListener('fullscreenchange', fsOn); };
  }, []);
  // spreads: [0], [1,2], [3,4] ... on wide; [0],[1],[2]... on narrow
  const spreadStart = useCallback((p: number) => (wide ? (p === 0 ? 0 : p % 2 === 1 ? p : p - 1) : p), [wide]);
  const visible = wide ? (i === 0 ? [0] : [i, i + 1].filter((x) => x < pages.length)) : [i];
  const next = useCallback(() => { const n = wide ? (i === 0 ? 1 : i + 2) : i + 1; if (n < pages.length) { setDir(1); setI(n); } }, [i, wide, pages.length]);
  const prev = useCallback(() => { const n = wide ? (i <= 1 ? 0 : i - 2) : i - 1; if (n >= 0 && i > 0) { setDir(-1); setI(n); } }, [i, wide]);
  // Re-align to a spread when the layout switches between one and two pages (adjust state during render, not in an effect).
  const [prevWide, setPrevWide] = useState(wide);
  if (prevWide !== wide) { setPrevWide(wide); setI(spreadStart(i)); }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Home') setI(0); if (e.key === 'End') setI(spreadStart(pages.length - 1));
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [next, prev, pages.length, spreadStart]);
  // Size each page by whichever is tighter — the available width or the viewport height — so it never overflows.
  const maxH = fs ? 'calc(100vh - 10rem)' : 'min(70vh, 720px)';
  const pageWidth = `min(${wide ? 'calc((100vw - 12rem) / 2)' : 'calc(100vw - 6rem)'}, calc(${maxH} * 0.75))`;
  const label = visible.length === 2 ? `${num(locale, visible[0] + 1)}–${num(locale, visible[1] + 1)}` : num(locale, visible[0] + 1);
  const toggleFs = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen?.(); };
  return (
    <div ref={root} className={`bg-deep text-linen-100 ${fs ? 'flex flex-col h-screen' : ''}`} data-testid="flipbook">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-14 border-b border-white/10">
        <p className="text-sm truncate">{title}</p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-white/70 mr-2" aria-live="polite" data-testid="flip-page">{t('Page', 'পৃষ্ঠা')} {label} / {num(locale, pages.length)}</span>
          <a href={pdfHref} className="btn-icon text-white hover:bg-white/10" aria-label={t('Download PDF', 'পিডিএফ ডাউনলোড')} data-testid="flip-download"><Download className="w-4 h-4" /></a>
          <button type="button" className="btn-icon text-white hover:bg-white/10" onClick={toggleFs} aria-label={fs ? t('Exit full screen', 'ফুল স্ক্রিন বন্ধ') : t('Full screen', 'ফুল স্ক্রিন')}>{fs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>
      </div>
      <div className={`relative flex items-center justify-center px-12 md:px-20 py-6 md:py-10 ${fs ? 'flex-1 min-h-0' : ''}`}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) (dx < 0 ? next : prev)(); touch.current = null; }}>
        <div key={`${i}-${wide}`} className={`flex shadow-pop ${dir === 1 ? 'flip-next' : dir === -1 ? 'flip-prev' : ''}`} style={{ perspective: '1600px' }}>
          {visible.map((p) => (
            <div key={p} className="flip-page relative bg-white aspect-[3/4]" style={{ width: pageWidth }}>
              <Image src={pages[p]} alt={`${title} — ${t('page', 'পৃষ্ঠা')} ${p + 1}`} fill sizes={wide ? '40vw' : '90vw'} className="object-contain" priority={p < 3} quality={80} />
            </div>
          ))}
        </div>
        <button type="button" onClick={prev} disabled={i === 0} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 btn-icon w-11 h-11 text-white bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label={t('Previous page', 'আগের পৃষ্ঠা')} data-testid="flip-prev"><ChevronLeft /></button>
        <button type="button" onClick={next} disabled={visible[visible.length - 1] >= pages.length - 1} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 btn-icon w-11 h-11 text-white bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label={t('Next page', 'পরের পৃষ্ঠা')} data-testid="flip-next"><ChevronRight /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-6 pb-4" role="tablist" aria-label={t('Pages', 'পৃষ্ঠাসমূহ')}>
        {pages.map((src, p) => (
          <button key={src} type="button" role="tab" aria-selected={visible.includes(p)} onClick={() => { setDir(p > i ? 1 : -1); setI(spreadStart(p)); }} className={`relative shrink-0 w-12 h-16 bg-white ${visible.includes(p) ? 'ring-2 ring-sand' : 'opacity-60 hover:opacity-100'}`} aria-label={`${t('Go to page', 'পৃষ্ঠায় যান')} ${p + 1}`}>
            <Image src={src} alt="" fill sizes="48px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
