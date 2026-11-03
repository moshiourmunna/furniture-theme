'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GitCompareArrows, Heart, House, Images, Languages, LayoutGrid, Menu, MessageCircle, Moon, Plus, Search, ShoppingBag, Sun, UserRound, X, Minus } from 'lucide-react';
import { lp, money, pf } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useStore } from './providers';

type Named = { slug: string; nameEn: string; nameBn: string };
export interface NavData { rooms: Named[]; categories: Named[]; collections: Named[]; brands: Named[]; feature: { image: string; href: string; titleEn: string; titleBn: string } | null }

const OVERLAY = /^\/(en|bn)(\/(collections|projects|brands)\/[^/]+)?\/?$/;

function useFocusTrap(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLElement>('[data-autofocus], input, button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, summary')].filter((n) => n.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = o; prev?.focus?.(); };
  }, [open, onClose]);
  return ref;
}

export function Logo({ h = 40, className = '' }: { h?: number; className?: string }) {
  const { t, locale } = useStore();
  const w = Math.round((h * 425) / 136);
  return (
    <Link href={lp(locale)} className={`inline-flex shrink-0 ${className}`} aria-label={t('Shekor home', 'শেকড় হোম')}>
      <Image src="/brand/shekor-horizontal-light.svg" alt="Shekor" width={w} height={h} className="w-auto dark:hidden" style={{ height: h }} priority unoptimized />
      <Image src="/brand/shekor-horizontal-dark.svg" alt="Shekor" width={w} height={h} className="w-auto hidden dark:block" style={{ height: h }} priority unoptimized />
    </Link>
  );
}

export function Toggles({ className = '' }: { className?: string }) {
  const { t, locale } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const switchLang = () => {
    const next = locale === 'en' ? 'bn' : 'en';
    document.cookie = `shekor-lang=${next}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.replace(/^\/(en|bn)/, '');
    router.push(`/${next}${rest}${window.location.search}`);
  };
  const toggleTheme = () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('shekor-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
    document.cookie = `shekor-theme=${dark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button type="button" className="btn-icon w-auto px-3 h-9 text-xs font-semibold gap-1.5" onClick={switchLang} data-testid="lang-toggle" lang={locale === 'en' ? 'bn' : 'en'}>
        <Languages className="w-4 h-4" /><span className="sr-only">{t('Switch language:', 'ভাষা পরিবর্তন:')} </span><span>{locale === 'en' ? 'বাংলা' : 'English'}</span>
      </button>
      <button type="button" className="btn-icon w-9 h-9" onClick={toggleTheme} aria-label={t('Toggle dark mode', 'ডার্ক মোড চালু/বন্ধ')} data-testid="theme-toggle">
        <Moon className="w-[18px] h-[18px] dark:hidden" /><Sun className="w-[18px] h-[18px] hidden dark:block" />
      </button>
    </div>
  );
}

const NAV: [string, string, string][] = [
  ['Collections', 'কালেকশন', '/collections'], ['Furniture', 'ফার্নিচার', '/shop'], ['Projects', 'প্রজেক্ট', '/projects'], ['Gallery', 'গ্যালারি', '/gallery'],
  ['Catalogues', 'ক্যাটালগ', '/catalogues'], ['Craft', 'কারুশিল্প', '/craft'], ['Showrooms', 'শোরুম', '/showrooms'],
];

export function SiteHeader({ nav }: { nav: NavData }) {
  const { t, locale, cartCount, wishlist, compare, setDrawer, cartReady } = useStore();
  const pathname = usePathname();
  const overlay = OVERLAY.test(pathname);
  const [solid, setSolid] = useState(false);
  const [mega, setMega] = useState(false);
  const f = pf(locale);
  useEffect(() => {
    if (!overlay) return;
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [overlay]);
  // close mega menu on navigation
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMega(false), [pathname]);
  const active = (href: string) => pathname === lp(locale, href) || pathname.startsWith(lp(locale, href) + '/');
  const base = overlay ? 'absolute inset-x-0 top-0 border-b border-white/15' : 'sticky top-0 bg-bg/95 backdrop-blur border-b border-line';
  const col = (title: string, items: Named[], prefix: string, all?: [string, string]) => (
    <div>
      <p className="label-sm text-muted mb-5">{title}</p>
      <ul className="space-y-3">
        {items.map((i) => <li key={i.slug}><Link href={lp(locale, prefix.includes('?') ? `${prefix}${i.slug}` : `${prefix}/${i.slug}`)} className="h-serif text-[17px] hover:text-accent transition-colors">{f(i, 'name')}</Link></li>)}
        {all && <li><Link href={lp(locale, all[1])} className="h-serif text-[17px] hover:text-accent transition-colors">{all[0]}</Link></li>}
      </ul>
    </div>
  );
  return (
    <header className={`${base} z-50 ${overlay && solid ? 'is-solid' : ''}`} data-header data-overlay={overlay || undefined}>
      <div className="container flex items-center gap-4 h-16 lg:h-20">
        <button type="button" className="btn-icon xl:hidden -ml-2" onClick={() => setDrawer('nav')} aria-label={t('Open menu', 'মেনু খুলুন')} data-testid="open-nav"><Menu /></button>
        {overlay ? (
          <Link href={lp(locale)} className="inline-flex shrink-0" aria-label={t('Shekor home', 'শেকড় হোম')}>
            <img src="/brand/shekor-horizontal-dark.svg" alt="Shekor" width={125} height={40} className="logo-over h-[34px] lg:h-[40px] w-auto" />
            <img src="/brand/shekor-horizontal-light.svg" alt="Shekor" width={125} height={40} className="logo-solid h-[34px] lg:h-[40px] w-auto dark:!hidden" />
            <img src="/brand/shekor-horizontal-dark.svg" alt="Shekor" width={125} height={40} className="logo-solid logo-solid-dark h-[34px] lg:h-[40px] w-auto" />
          </Link>
        ) : <Logo h={40} className="max-lg:[&>img]:!h-[34px]" />}
        <nav className="hidden xl:block mx-auto" aria-label={t('Main', 'প্রধান মেনু')}>
          <ul className="flex items-center">
            {NAV.map(([en, bn, href]) => (
              href === '/shop' ? (
                <li key={href} className="static" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)} onFocus={() => setMega(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMega(false); }}>
                  <Link href={lp(locale, href)} className={`inline-flex items-center h-20 px-3 text-[12px] font-medium uppercase tracking-[0.16em] hover:opacity-70 transition ${active(href) ? 'underline underline-offset-8' : ''}`} aria-expanded={mega} aria-haspopup="true">{t(en, bn)}</Link>
                  {mega && (
                    <div className="absolute left-0 right-0 top-full z-40 text-ink" data-mega>
                      <div className="bg-bg border-y border-line shadow-pop">
                        <div className="container py-12 grid grid-cols-12 gap-10">
                          <div className="col-span-8 grid grid-cols-4 gap-8">
                            {col(t('By room', 'রুম অনুযায়ী'), nav.rooms, '/shop?room=')}
                            {col(t('By piece', 'পিস অনুযায়ী'), nav.categories.slice(0, 8), '/shop')}
                            {col(t('Collections', 'কালেকশন'), nav.collections, '/collections', [t('All collections', 'সব কালেকশন'), '/collections'])}
                            {col(t('Brands', 'ব্র্যান্ড'), nav.brands.slice(0, 5), '/brands', [t('All brands', 'সব ব্র্যান্ড'), '/brands'])}
                          </div>
                          {nav.feature && (
                            <Link href={lp(locale, nav.feature.href)} className="col-span-4 group/m block">
                              <div className="overflow-hidden aspect-[4/3] relative"><Image src={nav.feature.image} alt={locale === 'bn' ? nav.feature.titleBn : nav.feature.titleEn} fill sizes="30vw" className="object-cover transition duration-[1200ms] group-hover/m:scale-105" /></div>
                              <p className="label-sm text-muted mt-4">{t('New · Collection 2026', 'নতুন · কালেকশন ২০২৬')}</p>
                              <p className="h-display text-2xl mt-1">{locale === 'bn' ? nav.feature.titleBn : nav.feature.titleEn}</p>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ) : (
                <li key={href}><Link href={lp(locale, href)} className={`inline-flex items-center h-20 px-3 text-[12px] font-medium uppercase tracking-[0.16em] hover:opacity-70 transition ${active(href) ? 'underline underline-offset-8' : ''}`} aria-current={active(href) ? 'page' : undefined}>{t(en, bn)}</Link></li>
              )
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-0.5 ml-auto xl:ml-0">
          <button type="button" className="btn-icon" onClick={() => setDrawer('search')} aria-label={t('Search', 'খুঁজুন')} data-testid="open-search"><Search className="w-5 h-5" /></button>
          <Toggles className="hidden lg:flex" />
          <Link href={lp(locale, '/account')} className="btn-icon hidden md:inline-flex" aria-label={t('My account', 'আমার অ্যাকাউন্ট')}><UserRound className="w-5 h-5" /></Link>
          <Link href={lp(locale, '/wishlist')} className="btn-icon hidden md:inline-flex relative"><Heart className="w-5 h-5" /><span className="sr-only">{t('Wishlist', 'উইশলিস্ট')}</span>{cartReady && wishlist.length > 0 && <span className="absolute top-2 right-1.5 text-[9px] font-semibold" data-testid="wishlist-count">{locale === 'bn' ? String(wishlist.length).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : wishlist.length}</span>}</Link>
          <Link href={lp(locale, '/compare')} className="btn-icon hidden lg:inline-flex relative"><GitCompareArrows className="w-5 h-5" /><span className="sr-only">{t('Compare', 'তুলনা')}</span>{cartReady && compare.length > 0 && <span className="absolute top-2 right-1.5 text-[9px] font-semibold">{locale === 'bn' ? String(compare.length).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : compare.length}</span>}</Link>
          <button type="button" className="btn-icon relative" onClick={() => setDrawer('bag')} data-testid="open-bag"><ShoppingBag className="w-5 h-5" /><span className="sr-only">{t('Shopping bag', 'শপিং ব্যাগ')}</span>{cartReady && cartCount > 0 && <span className="absolute top-2 right-1.5 text-[9px] font-semibold" data-testid="cart-count">{locale === 'bn' ? String(cartCount).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : cartCount}</span>}</button>
        </div>
      </div>
    </header>
  );
}

interface Suggest { products: { id: number; slug: string; nameEn: string; nameBn: string; image: string | null; price: number }[]; categories: Named[]; collections: Named[] }

export function SearchOverlay() {
  const { t, locale, drawer, setDrawer } = useStore();
  const router = useRouter();
  const open = drawer === 'search';
  const close = () => setDrawer(null);
  const ref = useFocusTrap(open, close);
  const [q, setQ] = useState('');
  const [fetched, setRes] = useState<Suggest | null>(null);
  const f = pf(locale);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const ac = new AbortController();
    const id = setTimeout(() => api<Suggest>(`/search/suggest?q=${encodeURIComponent(q)}`, { signal: ac.signal }).then(setRes).catch(() => {}), 200);
    return () => { clearTimeout(id); ac.abort(); };
  }, [q]);
  const res = q.trim().length < 2 ? null : fetched; // short queries show the popular list, not stale results
  if (!open) return null;
  const popular: [string, string][] = [['Teak sofa', 'সেগুন সোফা'], ['King bed', 'কিং খাট'], ['Dining', 'ডাইনিং'], ['Almirah', 'আলমারি']];
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" role="dialog" aria-modal="true" aria-label={t('Search', 'খুঁজুন')} data-testid="search-overlay">
      <div className="absolute inset-0 bg-deep/60" onClick={close} />
      <div ref={ref} className="relative bg-bg border-b border-line max-h-[90vh] overflow-y-auto">
        <div className="container py-8 md:py-12">
          <form role="search" className="flex items-center gap-4 border-b border-ink pb-3" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { close(); router.push(lp(locale, `/search?q=${encodeURIComponent(q.trim())}`)); } }}>
            <label htmlFor="site-q" className="sr-only">{t('Search', 'খুঁজুন')}</label>
            <Search className="w-6 h-6 text-muted shrink-0" />
            <input id="site-q" data-autofocus name="q" type="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-0 bg-transparent text-2xl md:text-4xl font-display font-light outline-none placeholder:text-muted/70" placeholder={t('Search sofas, collections, projects…', 'সোফা, কালেকশন, প্রজেক্ট খুঁজুন…')} />
            <button type="submit" className="btn btn-primary btn-sm max-sm:hidden">{t('Search', 'খুঁজুন')}</button>
            <button type="button" className="btn-icon" onClick={close} aria-label={t('Close search', 'সার্চ বন্ধ করুন')}><X /></button>
          </form>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div>
              <p className="label-sm text-muted mb-3">{res ? t('Categories & collections', 'ক্যাটাগরি ও কালেকশন') : t('Popular', 'জনপ্রিয়')}</p>
              <ul className="space-y-2">
                {res
                  ? [...res.categories.map((c) => ({ ...c, href: `/shop/${c.slug}` })), ...res.collections.map((c) => ({ ...c, href: `/collections/${c.slug}` }))].map((c) => <li key={c.href}><Link onClick={close} href={lp(locale, c.href)} className="h-serif text-lg hover:text-accent">{f(c, 'name')}</Link></li>)
                  : popular.map(([en, bn]) => <li key={en}><Link onClick={close} href={lp(locale, `/search?q=${encodeURIComponent(en)}`)} className="h-serif text-lg hover:text-accent">{t(en, bn)}</Link></li>)}
                {res && !res.categories.length && !res.collections.length && <li className="text-sm text-muted">—</li>}
              </ul>
            </div>
            <div className="md:col-span-2">
              <p className="label-sm text-muted mb-3">{t('Pieces', 'পিস')}</p>
              {res && !res.products.length ? <p className="text-sm text-muted">{t('No pieces match yet — try another word.', 'কোনো পিস মেলেনি — অন্য শব্দে চেষ্টা করুন।')}</p> : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4" data-testid="suggest-products">
                  {(res?.products ?? []).slice(0, 6).map((p) => (
                    <li key={p.id}><Link onClick={close} href={lp(locale, `/p/${p.slug}`)} className="group block">
                      <div className="relative aspect-square bg-surface-2">{p.image && <Image src={p.image} alt={f(p, 'name')} fill sizes="200px" className="object-cover" />}</div>
                      <span className="block text-sm mt-2">{f(p, 'name')}</span><span className="block text-xs text-muted">{money(locale, p.price)}</span>
                    </Link></li>
                  ))}
                  {!res && <li className="text-sm text-muted col-span-full">{t('Type at least two letters to see pieces.', 'পিস দেখতে অন্তত দুটি অক্ষর লিখুন।')}</li>}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NavDrawer({ nav }: { nav: NavData }) {
  const { t, locale, drawer, setDrawer, me } = useStore();
  const open = drawer === 'nav';
  const close = () => setDrawer(null);
  const ref = useFocusTrap(open, close);
  const f = pf(locale);
  if (!open) return null;
  const main: [string, string, string][] = [['Collections', 'কালেকশন', '/collections'], ['Furniture', 'ফার্নিচার', '/shop'], ['Brands', 'ব্র্যান্ড', '/brands'], ['Projects', 'প্রজেক্ট', '/projects'], ['Gallery', 'গ্যালারি', '/gallery'], ['Catalogues', 'ক্যাটালগ', '/catalogues'], ['Craftsmanship', 'কারুশিল্প', '/craft'], ['Studio & designers', 'স্টুডিও ও ডিজাইনার', '/studio'], ['Showrooms', 'শোরুম', '/showrooms'], ['Journal', 'জার্নাল', '/journal']];
  const small: [string, string, string][] = [['Interior design service', 'ইন্টেরিয়র ডিজাইন সেবা', '/interior-design'], ['Trade & corporate', 'ট্রেড ও কর্পোরেট', '/trade'], ['Custom furniture', 'কাস্টম ফার্নিচার', '/custom'], ['Book a consultation', 'পরামর্শ বুক করুন', '/consultation'], ['Track order', 'অর্ডার ট্র্যাক', '/track'], ['Help & FAQ', 'সহায়তা ও প্রশ্নোত্তর', '/faq'], ['Contact', 'যোগাযোগ', '/contact']];
  const groups: [string, string, Named[], string][] = [['Shop by room', 'রুম অনুযায়ী', nav.rooms, '/shop?room='], ['Shop by piece', 'পিস অনুযায়ী', nav.categories, '/shop/']];
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('Menu', 'মেনু')} data-testid="nav-drawer">
      <div className="absolute inset-0 bg-deep/50" onClick={close} />
      <div ref={ref} className="absolute inset-y-0 left-0 w-[92%] max-w-md bg-bg text-ink flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 h-16 border-b border-line"><Logo h={34} /><button type="button" className="btn-icon -mr-2" onClick={close} aria-label={t('Close menu', 'মেনু বন্ধ করুন')}><X /></button></div>
        <div className="flex-1 overflow-y-auto px-6" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) close(); }}>
          <ul className="py-4 border-b border-line">{main.map(([en, bn, h]) => <li key={h}><Link href={lp(locale, h)} className="block py-2 h-display text-[26px]">{t(en, bn)}</Link></li>)}</ul>
          {groups.map(([en, bn, items, prefix]) => (
            <details key={en} className="border-b border-line group/d">
              <summary className="flex items-center justify-between py-4 h-serif text-xl cursor-pointer list-none">{t(en, bn)}<Plus className="w-4 h-4 group-open/d:rotate-45 transition" /></summary>
              <ul className="pb-4 grid grid-cols-2 gap-x-4 gap-y-2">{items.map((i) => <li key={i.slug}><Link href={lp(locale, `${prefix}${i.slug}`)} className="block py-1 text-sm text-muted">{f(i, 'name')}</Link></li>)}</ul>
            </details>
          ))}
          <ul className="py-4 space-y-1">{small.map(([en, bn, h]) => <li key={h}><Link href={lp(locale, h)} className="block py-1.5 text-sm text-muted">{t(en, bn)}</Link></li>)}</ul>
        </div>
        <div className="border-t border-line p-4 flex items-center justify-between">
          <Link href={lp(locale, me ? '/account' : '/login')} onClick={close} className="btn btn-primary btn-sm">{me ? t('My account', 'আমার অ্যাকাউন্ট') : t('Sign in', 'সাইন ইন')}</Link>
          <Toggles />
        </div>
      </div>
    </div>
  );
}

export function BagDrawer() {
  const { t, locale, drawer, setDrawer, cart, setQty, removeLine, cartCount } = useStore();
  const open = drawer === 'bag';
  const close = () => setDrawer(null);
  const ref = useFocusTrap(open, close);
  if (!open) return null;
  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const n = (v: number) => (locale === 'bn' ? String(v).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : String(v));
  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label={t('Shopping bag', 'শপিং ব্যাগ')} data-testid="bag-drawer">
      <div className="absolute inset-0 bg-deep/50" onClick={close} />
      <div ref={ref} className="absolute inset-y-0 right-0 w-full max-w-md bg-bg flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 h-20 border-b border-line"><p className="label-sm">{t('Your bag', 'আপনার ব্যাগ')} ({n(cartCount)})</p><button type="button" className="btn-icon -mr-2" onClick={close} aria-label={t('Close bag', 'ব্যাগ বন্ধ করুন')}><X /></button></div>
        {cart.length === 0 ? (
          <div className="flex-1 grid place-items-center p-10 text-center">
            <div><p className="h-display text-2xl">{t('Your bag is empty', 'আপনার ব্যাগ খালি')}</p><p className="text-muted mt-2 text-sm">{t('Pieces you add will wait here.', 'যোগ করা পিস এখানে থাকবে।')}</p><Link href={lp(locale, '/shop')} onClick={close} className="btn btn-primary mt-6">{t('Explore furniture', 'ফার্নিচার দেখুন')}</Link></div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              {cart.map((l) => (
                <li key={`${l.productId}-${l.variantId}`} className="flex gap-4 py-5 border-b border-line" data-testid="bag-line">
                  <div className="relative w-20 h-24 shrink-0 bg-surface-2">{l.image && <Image src={l.image} alt={locale === 'bn' ? l.nameBn : l.nameEn} fill sizes="80px" className="object-cover" />}</div>
                  <div className="flex-1 min-w-0">
                    <Link href={lp(locale, `/p/${l.slug}`)} onClick={close} className="h-serif text-[17px] leading-snug hover:text-accent">{locale === 'bn' ? l.nameBn : l.nameEn}</Link>
                    {l.variantEn && <p className="text-xs text-muted mt-1">{locale === 'bn' ? l.variantBn : l.variantEn}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" className="btn-icon w-8 h-8 border border-line" onClick={() => setQty(l.productId, l.variantId, l.qty - 1)} aria-label={t('Decrease quantity', 'পরিমাণ কমান')} disabled={l.qty <= 1}><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-6 text-center text-sm" aria-live="polite">{n(l.qty)}</span>
                      <button type="button" className="btn-icon w-8 h-8 border border-line" onClick={() => setQty(l.productId, l.variantId, l.qty + 1)} aria-label={t('Increase quantity', 'পরিমাণ বাড়ান')}><Plus className="w-3.5 h-3.5" /></button>
                      <span className="ml-auto text-sm">{money(locale, l.price * l.qty)}</span>
                    </div>
                  </div>
                  <button type="button" className="text-xs text-muted underline self-start" onClick={() => removeLine(l.productId, l.variantId)}>{t('Remove', 'সরান')}</button>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-6 space-y-4">
              <div className="flex justify-between text-sm"><span className="text-muted">{t('Subtotal', 'সাবটোটাল')}</span><span className="font-medium" data-testid="bag-subtotal">{money(locale, subtotal)}</span></div>
              <p className="text-xs text-muted">{t('Delivery & assembly calculated at checkout. 0% EMI available.', 'ডেলিভারি ও অ্যাসেম্বলি চেকআউটে হিসাব হবে। ০% ইএমআই আছে।')}</p>
              <Link href={lp(locale, '/checkout')} onClick={close} className="btn btn-primary w-full" data-testid="bag-checkout">{t('Checkout', 'চেকআউট')}</Link>
              <Link href={lp(locale, '/cart')} onClick={close} className="btn btn-outline w-full">{t('View bag', 'ব্যাগ দেখুন')}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function BottomNav() {
  const { t, locale, cartReady, wishlist } = useStore();
  const pathname = usePathname();
  const items: [string, string, string, React.ComponentType<{ className?: string }>][] = [
    ['/', 'Home', 'হোম', House], ['/shop', 'Shop', 'শপ', LayoutGrid], ['/gallery', 'Gallery', 'গ্যালারি', Images], ['/wishlist', 'Saved', 'সংরক্ষিত', Heart], ['/account', 'Account', 'অ্যাকাউন্ট', UserRound],
  ];
  const isActive = (h: string) => (h === '/' ? pathname === lp(locale) : pathname.startsWith(lp(locale, h)));
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label={t('Quick navigation', 'দ্রুত নেভিগেশন')}>
      <ul className="grid grid-cols-5">
        {items.map(([h, en, bn, Icon]) => (
          <li key={h}><Link href={lp(locale, h)} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-[0.12em] ${isActive(h) ? 'text-ink font-semibold' : 'text-muted'}`} aria-current={isActive(h) ? 'page' : undefined}>
            <Icon className="w-5 h-5" />{t(en, bn)}
            {h === '/wishlist' && cartReady && wishlist.length > 0 && <span className="absolute top-1.5 left-1/2 ml-2 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />}
          </Link></li>
        ))}
      </ul>
    </nav>
  );
}

export function WhatsApp({ number }: { number: string }) {
  const { t } = useStore();
  return (
    <a href={`https://wa.me/${number.replace(/\D/g, '')}`} target="_blank" className="fixed z-40 right-4 bottom-20 md:bottom-6 w-12 h-12 rounded-full bg-deep text-linen-200 border border-white/15 grid place-items-center shadow-pop hover:bg-primary transition" aria-label={t('Chat on WhatsApp', 'হোয়াটসঅ্যাপে চ্যাট করুন')} rel="noopener noreferrer">
      <MessageCircle className="w-5 h-5" />
    </a>
  );
}

export function CookieConsent() {
  const { t, locale } = useStore();
  const [show, setShow] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { setShow(!localStorage.getItem('shekor-cookie')); } catch { /* ignore */ } }, []);
  if (!show) return null;
  const accept = (v: string) => { try { localStorage.setItem('shekor-cookie', v); } catch { /* ignore */ } setShow(false); };
  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:max-w-md z-50 bg-bg border border-line shadow-pop p-6" role="dialog" aria-label={t('Cookie consent', 'কুকি সম্মতি')} data-testid="cookie-consent">
      <p className="text-sm">{t('We use cookies to improve your experience and measure performance.', 'আপনার অভিজ্ঞতা উন্নত করতে আমরা কুকি ব্যবহার করি।')} <Link className="link" href={lp(locale, '/policy/cookies')}>{t('Read our cookie policy', 'কুকি নীতি পড়ুন')}</Link></p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => accept('all')} data-testid="cookie-accept">{t('Accept all', 'সব গ্রহণ করুন')}</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => accept('essential')}>{t('Essential only', 'শুধু প্রয়োজনীয়')}</button>
      </div>
    </div>
  );
}

/** Scroll-reveal: opt-in only when JS runs and the user allows motion. */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-on');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

export function NewsletterForm({ source = 'footer', dark = true }: { source?: string; dark?: boolean }) {
  const { t, locale } = useStore();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  return (
    <form className={`relative mt-6 flex items-end gap-3 border-b pb-2 ${dark ? 'border-linen-200/40' : 'border-ink'}`} data-testid={`newsletter-${source}`} onSubmit={async (e) => {
      e.preventDefault();
      setState('busy');
      try { await api('/leads?type=newsletter', { body: { email, locale, source } }); setState('done'); setMsg(t('Thank you — you’re on the list.', 'ধন্যবাদ — আপনি তালিকায় যুক্ত হয়েছেন।')); setEmail(''); }
      catch (err) { setState('error'); setMsg((err as Error).message || t('Please enter a valid email.', 'সঠিক ইমেইল দিন।')); }
    }}>
      <label htmlFor={`nl-${source}`} className="sr-only">{t('Email address', 'ইমেইল ঠিকানা')}</label>
      <input id={`nl-${source}`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`flex-1 min-w-0 bg-transparent h-10 outline-none ${dark ? 'text-linen-100 placeholder:text-linen-100/50' : 'placeholder:text-muted'}`} placeholder={t('Your email address', 'আপনার ইমেইল ঠিকানা')} />
      <button className={`link-line ${dark ? 'text-linen-200' : ''}`} type="submit" disabled={state === 'busy'}>{t('Subscribe', 'সাবস্ক্রাইব')}</button>
      <span className="sr-only" role="status">{msg}</span>
      {msg && <p className={`absolute mt-16 text-xs ${state === 'error' ? 'text-red-300' : dark ? 'text-sand' : 'text-success'}`} aria-hidden>{msg}</p>}
    </form>
  );
}

/**
 * Safety net for the pre-paint theme script: if React ever re-creates <html> attributes on the client
 * (e.g. when recovering into the not-found boundary), re-apply the saved/system theme.
 */
export function ThemeSync() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const t = localStorage.getItem('shekor-theme');
      const dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (document.documentElement.classList.contains('dark') !== dark) document.documentElement.classList.toggle('dark', dark);
    } catch { /* storage blocked */ }
  }, [pathname]);
  return null;
}
