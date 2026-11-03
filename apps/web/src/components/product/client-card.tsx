'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardDTO } from '@/server/services/catalog';
import { lp, money, pf } from '@/lib/i18n';
import { useStore } from '../providers';
import { CardActions, WishlistButton } from '../card-actions';

/** Client-rendered twin of ProductCard for lists fetched in the browser (wishlist, compare, recently viewed). */
export function ClientProductCard({ p }: { p: ProductCardDTO }) {
  const { locale } = useStore();
  const f = pf(locale);
  const href = lp(locale, `/p/${p.slug}`);
  return (
    <article className="group relative flex flex-col" data-testid="product-card">
      <div className="relative overflow-hidden bg-surface-2 aspect-[4/5]">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">{p.image && <Image src={p.image} alt={f(p, 'name')} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover img-zoom" />}</Link>
        <WishlistButton id={p.id} className="absolute top-2 right-2" />
        <CardActions p={p} />
      </div>
      <div className="pt-4">
        <h3 className="h-serif text-[17px] leading-snug"><Link href={href} className="hover:text-accent">{f(p, 'name')}</Link></h3>
        <p className="text-xs text-muted">{f(p, 'material')}</p>
        <p className="text-sm mt-1">{money(locale, p.price)}</p>
      </div>
    </article>
  );
}
