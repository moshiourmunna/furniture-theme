import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { lp, money, tr, type Locale } from '@/lib/i18n';

export function JsonLd({ data }: { data: object | object[] }) {
  const arr = Array.isArray(data) ? data : [data];
  return (
    <>
      {arr.map((d, i) => (
        // eslint-disable-next-line react/no-danger
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
}

export function Breadcrumbs({ locale, items, light }: { locale: Locale; items: { name: string; path?: string }[]; light?: boolean }) {
  const t = tr(locale);
  return (
    <nav aria-label={t('Breadcrumb', 'ব্রেডক্রাম্ব')} className={`text-sm ${light ? 'text-white/70' : 'text-muted'}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5" aria-hidden />}
            {it.path ? <Link href={lp(locale, it.path)} className={light ? 'hover:text-white' : 'hover:text-ink'}>{it.name}</Link> : <span aria-current="page" className={light ? 'text-white' : 'text-ink'}>{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHead({ locale, eyebrow, title, sub, href, linkLabel }: { locale: Locale; eyebrow: string; title: string; sub?: string; href?: string; linkLabel?: string }) {
  const t = tr(locale);
  return (
    <div className="flex items-end justify-between gap-6 mb-10 md:mb-14" data-reveal>
      <div>
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h2 className="h-display text-4xl md:text-5xl leading-[1.05]">{title}</h2>
        {sub && <p className="text-muted mt-4 max-w-xl leading-relaxed">{sub}</p>}
      </div>
      {href && <Link href={lp(locale, href)} className="link-line shrink-0 max-sm:hidden">{linkLabel ?? t('View all', 'সব দেখুন')}</Link>}
    </div>
  );
}

export function Price({ locale, value, old, className = '' }: { locale: Locale; value: number; old?: number | null; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span>{money(locale, value)}</span>
      {old ? <s className="text-muted text-[0.9em]">{money(locale, old)}</s> : null}
    </span>
  );
}

export function Stars({ value, className = 'w-4 h-4', label }: { value: number; className?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-teak" role="img" aria-label={label ?? `${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={className} fill={value >= i - 0.25 ? 'currentColor' : 'none'} aria-hidden />
      ))}
    </span>
  );
}

export function Figure({ src, alt, ratio = 'aspect-[4/5]', sizes = '(min-width:1024px) 40vw, 90vw', className = '', priority }: { src: string; alt: string; ratio?: string; sizes?: string; className?: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${ratio} ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover img-zoom" priority={priority} quality={70} />
    </div>
  );
}

export function Hero({ image, alt, eyebrow, title, sub, children, height = 'h-[78svh]', crumbs }: { image: string; alt: string; eyebrow: string; title: string; sub?: string | null; children?: React.ReactNode; height?: string; crumbs?: React.ReactNode }) {
  return (
    <section className={`relative ${height} min-h-[560px] max-h-[1000px] flex items-end overflow-hidden bg-deep text-white`}>
      <div className="absolute inset-0">
        <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover animate-kenburns" quality={70} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/25 to-deep/40" />
      <div className="relative container pb-14 md:pb-20 pt-32 w-full">
        {crumbs}
        <p className="label-sm text-white/75 mt-6">{eyebrow}</p>
        <h1 className="h-display text-5xl sm:text-6xl lg:text-[88px] leading-[0.98] mt-5 max-w-4xl">{title}</h1>
        {sub && <p className="mt-6 max-w-xl text-base md:text-lg text-white/85 leading-relaxed">{sub}</p>}
        {children && <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">{children}</div>}
      </div>
    </section>
  );
}

export function Intro({ eyebrow, title, sub, crumbs }: { eyebrow: string; title: string; sub?: string | null; crumbs?: React.ReactNode }) {
  return (
    <section className="container pt-10 md:pt-16 pb-12 md:pb-16">
      {crumbs}
      <p className="eyebrow mt-8">{eyebrow}</p>
      <h1 className="h-display text-5xl md:text-7xl leading-[1.02] mt-4 max-w-4xl">{title}</h1>
      {sub && <p className="mt-6 max-w-2xl text-lg text-muted leading-relaxed">{sub}</p>}
    </section>
  );
}

export function TrustStrip({ locale }: { locale: Locale }) {
  const t = tr(locale);
  const items: [string, string][] = [
    [t('10-year frame warranty', '১০ বছরের ফ্রেম ওয়ারেন্টি'), t('On every solid-wood piece', 'প্রতিটি সলিড-কাঠের পিসে')],
    [t('White-glove delivery', 'হোয়াইট-গ্লাভ ডেলিভারি'), t('Free assembly inside Dhaka', 'ঢাকায় ফ্রি অ্যাসেম্বলি')],
    [t('0% EMI, 12 months', '০% ইএমআই, ১২ মাস'), t('With 24 partner banks', '২৪টি পার্টনার ব্যাংকে')],
    [t('Seven-day returns', 'সাত দিনে রিটার্ন'), t('On in-stock pieces', 'স্টকে থাকা পিসে')],
  ];
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 border-y border-line divide-x divide-line">
      {items.map(([a, b]) => (
        <li key={a} className="py-6 px-4 md:px-8 text-center"><p className="h-serif text-base md:text-lg">{a}</p><p className="text-xs text-muted mt-1">{b}</p></li>
      ))}
    </ul>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border border-line bg-surface p-10 text-center">
      <p className="h-display text-2xl">{title}</p>
      {children && <div className="mt-4 text-muted">{children}</div>}
    </div>
  );
}
