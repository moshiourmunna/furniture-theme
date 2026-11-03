'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useStore } from '../providers';

export interface GalleryImage { url: string; alt: string }

/** Accessible lightbox: arrows/Esc/swipe, focus contained, scroll locked. Shared by product gallery, gallery page, projects. */
export function Lightbox({ images, index, onClose, onIndex, caption }: { images: GalleryImage[]; index: number; onClose: () => void; onIndex: (i: number) => void; caption?: (i: number) => React.ReactNode }) {
  const { t } = useStore();
  const n = images.length;
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex]);
  const [touch, setTouch] = useState<number | null>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', k);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    document.getElementById('lb-close')?.focus();
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = o; prev?.focus(); };
  }, [go, onClose]);
  const img = images[index];
  return (
    <div className="fixed inset-0 z-[90] bg-black/95 text-white flex flex-col" role="dialog" aria-modal="true" aria-label={t('Image viewer', 'ছবি দেখুন')} data-testid="lightbox"
      onTouchStart={(e) => setTouch(e.touches[0].clientX)} onTouchEnd={(e) => { if (touch == null) return; const dx = e.changedTouches[0].clientX - touch; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); setTouch(null); }}>
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <p className="text-sm text-white/70" aria-live="polite">{index + 1} / {n}</p>
        <button id="lb-close" type="button" className="btn-icon text-white hover:bg-white/10" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন')}><X /></button>
      </div>
      <div className="relative flex-1 min-h-0 lightbox-enter" key={index}>
        <Image src={img.url} alt={img.alt} fill sizes="100vw" className="object-contain" quality={80} />
      </div>
      {caption && <div className="px-4 py-3 text-center text-sm">{caption(index)}</div>}
      {n > 1 && (
        <>
          <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 btn-icon w-12 h-12 text-white bg-black/40 hover:bg-white/10" onClick={() => go(-1)} aria-label={t('Previous image', 'আগের ছবি')} data-testid="lb-prev"><ChevronLeft /></button>
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon w-12 h-12 text-white bg-black/40 hover:bg-white/10" onClick={() => go(1)} aria-label={t('Next image', 'পরের ছবি')} data-testid="lb-next"><ChevronRight /></button>
        </>
      )}
    </div>
  );
}

export function ProductGallery({ images, badge }: { images: GalleryImage[]; badge?: string | null }) {
  const { t } = useStore();
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  if (!images.length) return <div className="aspect-[4/5] bg-surface-2" />;
  return (
    <div className="flex flex-col-reverse md:flex-row gap-3" data-testid="product-gallery">
      <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar md:w-20 shrink-0" role="tablist" aria-label={t('Product images', 'পণ্যের ছবি')}>
        {images.map((im, k) => (
          <button key={im.url + k} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} className={`relative shrink-0 w-16 h-20 md:w-20 md:h-24 overflow-hidden ring-offset-2 ring-offset-bg ${k === i ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100'}`} aria-label={t(`Show image ${k + 1}`, `ছবি ${k + 1} দেখুন`)}>
            <Image src={im.url} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
      <div className="relative flex-1 aspect-[4/5] bg-surface-2 overflow-hidden group">
        <button type="button" className="absolute inset-0 cursor-zoom-in" onClick={() => setOpen(true)} aria-label={t('Open full-screen gallery', 'ফুল-স্ক্রিন গ্যালারি খুলুন')} data-testid="open-lightbox">
          <Image src={images[i].url} alt={images[i].alt} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" quality={80} />
        </button>
        {badge && <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.18em] bg-bg/90 text-ink px-2 py-1 pointer-events-none">{badge}</span>}
        <span className="absolute bottom-4 right-4 btn-icon bg-bg/90 text-ink pointer-events-none"><Expand className="w-4 h-4" /></span>
      </div>
      {open && <Lightbox images={images} index={i} onIndex={setI} onClose={() => setOpen(false)} />}
    </div>
  );
}
