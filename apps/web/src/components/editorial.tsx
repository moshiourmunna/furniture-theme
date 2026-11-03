import Link from 'next/link';
import { lp, num, tr, type Locale } from '@/lib/i18n';

export function Steps({ locale, items }: { locale: Locale; items: [string, string, string, string][] }) {
  const t = tr(locale);
  return (
    <ol className={`grid md:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-px bg-line border border-line`}>
      {items.map(([a, b, c, d], i) => (
        <li key={a} className="bg-bg p-8" data-reveal><span className="h-display text-3xl text-accent">{num(locale, `0${i + 1}`)}</span><p className="h-serif text-xl mt-6">{t(a, b)}</p><p className="text-sm text-muted mt-2 leading-relaxed">{t(c, d)}</p></li>
      ))}
    </ol>
  );
}

export function CtaBand({ locale, title, body, primary, secondary }: { locale: Locale; title: string; body?: string; primary: [string, string]; secondary?: [string, string] }) {
  return (
    <section className="container mt-28">
      <div className="bg-deep text-linen-100 p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center">
        <div><h2 className="h-display text-4xl md:text-5xl text-linen-200">{title}</h2>{body && <p className="mt-4 text-linen-100/80 max-w-md">{body}</p>}</div>
        <div className="md:justify-self-end flex flex-wrap gap-4 items-center"><Link href={lp(locale, primary[1])} className="btn btn-light">{primary[0]}</Link>{secondary && <Link href={lp(locale, secondary[1])} className="link-line text-linen-200">{secondary[0]}</Link>}</div>
      </div>
    </section>
  );
}

export function Stats({ locale, items }: { locale: Locale; items: [string, string, string][] }) {
  const t = tr(locale);
  return <ul className="grid grid-cols-2 md:grid-cols-4 border-t border-line">{items.map(([v, a, b]) => <li key={a} className="pt-6 pr-4 pb-6" data-reveal><p className="h-display text-4xl md:text-5xl">{num(locale, v)}</p><p className="label-sm text-muted mt-2">{t(a, b)}</p></li>)}</ul>;
}

export function Prose({ html }: { html: string }) {
  // eslint-disable-next-line react/no-danger
  return <div className="prose-sk" dangerouslySetInnerHTML={{ __html: html }} />;
}
