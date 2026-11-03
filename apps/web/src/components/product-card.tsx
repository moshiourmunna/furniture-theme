import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardDTO } from '@/server/services/catalog';
import { lp, money, pf, tr, type Locale } from '@/lib/i18n';
import { CardActions, WishlistButton } from './card-actions';

export function ProductCard({ p, locale, priority = false, sizes = '(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw' }: { p: ProductCardDTO; locale: Locale; priority?: boolean; sizes?: string }) {
  const t = tr(locale);
  const f = pf(locale);
  const name = f(p, 'name');
  const href = lp(locale, `/p/${p.slug}`);
  const tag = p.badge === 'new' ? t('New', 'নতুন') : p.badge === 'made' || p.stockStatus === 'MADE_TO_ORDER' ? t('Made to order', 'অর্ডারে তৈরি') : p.badge === 'sale' && p.compareAtPrice ? `−${Math.round((1 - p.price / p.compareAtPrice) * 100)}%` : null;
  return (
    <article className="group relative flex flex-col" data-product={p.id} data-testid="product-card">
      <div className="relative overflow-hidden bg-surface-2 aspect-[4/5]">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {p.image && <Image src={p.image} alt={name} fill sizes={sizes} className="object-cover img-zoom" priority={priority} quality={70} />}
          {p.altImage && <Image src={p.altImage} alt="" aria-hidden fill sizes={sizes} className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" quality={70} />}
        </Link>
        {tag && <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-[0.18em] px-2 py-1 ${p.badge === 'sale' ? 'bg-sale text-white' : 'bg-bg/90 text-ink'}`}>{tag}</span>}
        <WishlistButton id={p.id} className="absolute top-2 right-2" />
        <CardActions p={p} />
      </div>
      <div className="pt-4 flex-1 flex flex-col gap-1">
        <h3 className="h-serif text-[17px] md:text-lg leading-snug">
          <Link href={href} className="hover:text-accent transition-colors">{name}</Link>
        </h3>
        <p className="text-xs text-muted">{f(p, 'material')}</p>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-1">
          <p className="flex items-baseline gap-2 text-sm">
            <span>{money(locale, p.price)}</span>
            {p.compareAtPrice ? <s className="text-muted">{money(locale, p.compareAtPrice)}</s> : null}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {p.swatches.slice(0, 4).map((s) => <span key={s.id} className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: s.hex ?? '#ccc' }} />)}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, locale, eager = 0, cols = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' }: { items: ProductCardDTO[]; locale: Locale; eager?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-x-4 gap-y-12 md:gap-x-8`} data-results>
      {items.map((p, i) => <ProductCard key={p.id} p={p} locale={locale} priority={i < eager} />)}
    </div>
  );
}

export function Rail({ items, locale }: { items: ProductCardDTO[]; locale: Locale }) {
  return (
    <div className="-mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar md:mx-0 md:px-0 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-8 md:overflow-visible">
      {items.map((p) => (
        <div key={p.id} className="snap-start shrink-0 w-[70%] sm:w-[42%] md:w-auto"><ProductCard p={p} locale={locale} /></div>
      ))}
    </div>
  );
}
