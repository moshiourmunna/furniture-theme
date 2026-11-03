'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { lp, money } from '@/lib/i18n';
import { Lightbox } from './product/gallery';
import { useStore } from './providers';

export interface WallItem { id: number; image: string; titleEn: string; titleBn: string; tall: boolean; hotspotX: number | null; hotspotY: number | null; product: { slug: string; nameEn: string; nameBn: string; price: number } | null }

/** Masonry gallery with lightbox and "shop the piece" hotspots. */
export function GalleryWall({ items }: { items: WallItem[] }) {
  const { t, locale } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const title = (g: WallItem) => (locale === 'bn' ? g.titleBn : g.titleEn);
  return (
    <>
      <div className="columns-2 md:columns-3 gap-3 md:gap-5 [&>*]:mb-3 md:[&>*]:mb-5" data-testid="gallery-wall">
        {items.map((g, i) => (
          <figure key={g.id} className="relative break-inside-avoid group" data-reveal>
            <button type="button" className={`relative block w-full overflow-hidden bg-surface-2 cursor-zoom-in ${g.tall ? 'aspect-[3/4]' : 'aspect-[4/3]'}`} onClick={() => setOpen(i)} aria-label={`${t('Open', 'খুলুন')}: ${title(g)}`} data-testid="gallery-item">
              <Image src={g.image} alt={title(g)} fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover img-zoom" />
            </button>
            {g.product && g.hotspotX != null && g.hotspotY != null && (
              <Link href={lp(locale, `/p/${g.product.slug}`)} className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-bg/95 text-ink grid place-items-center shadow-pop ring-4 ring-bg/40 hover:scale-110 transition" style={{ left: `${g.hotspotX}%`, top: `${g.hotspotY}%` }} aria-label={`${t('Shop', 'কিনুন')}: ${locale === 'bn' ? g.product.nameBn : g.product.nameEn}`} data-testid="hotspot">
                <ShoppingBag className="w-3.5 h-3.5" />
              </Link>
            )}
            <figcaption className="mt-2 text-sm text-muted">{title(g)}</figcaption>
          </figure>
        ))}
      </div>
      {open != null && (
        <Lightbox images={items.map((g) => ({ url: g.image, alt: title(g) }))} index={open} onIndex={setOpen} onClose={() => setOpen(null)}
          caption={(i) => {
            const g = items[i];
            return (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span>{title(g)}</span>
                {g.product && <Link href={lp(locale, `/p/${g.product.slug}`)} className="btn btn-light btn-sm" onClick={() => setOpen(null)} data-testid="shop-the-piece">{t('Shop the piece', 'পিসটি কিনুন')} · {locale === 'bn' ? g.product.nameBn : g.product.nameEn} · {money(locale, g.product.price)}</Link>}
              </div>
            );
          }} />
      )}
    </>
  );
}
