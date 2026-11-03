'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Lightbox, type GalleryImage } from './product/gallery';
import { useStore } from './providers';

/** Image grid where each tile opens the shared lightbox. */
export function LightboxGrid({ images, className = 'grid grid-cols-2 md:grid-cols-3 gap-4', tile = (i: number) => (i === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]') }: { images: GalleryImage[]; className?: string; tile?: (i: number) => string }) {
  const [open, setOpen] = useState<number | null>(null);
  const { t } = useStore();
  return (
    <>
      <div className={className}>
        {images.map((im, i) => (
          <button key={im.url + i} type="button" onClick={() => setOpen(i)} className={`relative overflow-hidden bg-surface-2 group cursor-zoom-in ${tile(i)}`} aria-label={`${t('Open image', 'ছবি খুলুন')}: ${im.alt}`} data-testid="lightbox-tile">
            <Image src={im.url} alt={im.alt} fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover img-zoom" />
          </button>
        ))}
      </div>
      {open != null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} caption={(i) => images[i].alt} />}
    </>
  );
}
