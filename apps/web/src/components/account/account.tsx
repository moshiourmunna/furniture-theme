'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Award, Heart, LogOut, MapPin, Package, Settings, Star, User } from 'lucide-react';
import { BD_DIVISIONS, type OrderStatusCode } from '@shekor/shared';
import { api, ApiClientError } from '@/lib/api';
import { date, lp, money, num } from '@/lib/i18n';
import { useStore } from '../providers';
import { Modal } from '../card-actions';
import { OrderView, StatusBadge, type OrderData } from '../commerce/order-view';
import { Stars } from '../ui';

function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => api<T>(path).then(setData).catch((e: Error) => setError(e.message)), [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, reload };
}
const Loading = () => { const { t } = useStore(); return <p className="py-16 text-center text-muted">{t('Loading…', 'লোড হচ্ছে…')}</p>; };

const NAV = [
  ['', User, 'Overview', 'সারাংশ'], ['/orders', Package, 'Orders', 'অর্ডার'], ['/addresses', MapPin, 'Addresses', 'ঠিকানা'],
  ['/reviews', Star, 'Reviews', 'রিভিউ'], ['/loyalty', Award, 'Shekor Circle', 'শেকড় সার্কেল'], ['/settings', Settings, 'Settings', 'সেটিংস'],
] as const;

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { t, locale, me, meLoaded, refreshMe } = useStore();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (meLoaded && !me) router.replace(lp(locale, `/login?next=${encodeURIComponent(path)}`)); }, [meLoaded, me, router, locale, path]);
  if (!me) return <Loading />;
  const base = lp(locale, '/account');
  return (
    <div className="container pt-8 grid md:grid-cols-[220px_1fr] gap-8 md:gap-12">
      <aside>
        <p className="eyebrow">{t('My account', 'আমার অ্যাকাউন্ট')}</p>
        <p className="h-serif text-2xl mt-2 truncate">{me.name}</p>
        <nav aria-label={t('Account', 'অ্যাকাউন্ট')} className="mt-6 flex md:flex-col gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          {NAV.map(([p, Icon, en, bn]) => {
            const href = base + p;
            const active = p ? path.startsWith(href) : path === href;
            return <Link key={p} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 px-3 h-11 text-sm whitespace-nowrap ${active ? 'bg-surface-2 font-medium' : 'hover:bg-surface-2'}`}><Icon className="w-4 h-4" />{t(en, bn)}</Link>;
          })}
          <Link href={lp(locale, '/wishlist')} className="flex items-center gap-3 px-3 h-11 text-sm whitespace-nowrap hover:bg-surface-2"><Heart className="w-4 h-4" />{t('Wishlist', 'উইশলিস্ট')}</Link>
          <button type="button" className="flex items-center gap-3 px-3 h-11 text-sm whitespace-nowrap hover:bg-surface-2 text-left" data-testid="logout" onClick={async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); await refreshMe(); router.replace(lp(locale, '/')); router.refresh(); }}><LogOut className="w-4 h-4" />{t('Sign out', 'সাইন আউট')}</button>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

interface OrderRow { orderNo: string; status: OrderStatusCode; total: number; createdAt: string; paymentStatus: string; items: { id: number; image: string | null; nameEn: string; nameBn: string; qty: number }[] }

function OrderList({ items }: { items: OrderRow[] }) {
  const { t, locale } = useStore();
  if (!items.length) return <div className="py-12 text-center border border-dashed border-line"><p className="text-muted">{t('No orders yet.', 'এখনো কোনো অর্ডার নেই।')}</p><Link className="btn btn-primary btn-sm mt-4" href={lp(locale, '/shop')}>{t('Start shopping', 'কেনাকাটা শুরু করুন')}</Link></div>;
  return (
    <ul className="divide-y divide-line border-y border-line" data-testid="order-list">
      {items.map((o) => (
        <li key={o.orderNo}>
          <Link href={lp(locale, `/account/orders/${o.orderNo}`)} className="flex flex-wrap items-center gap-4 py-4 hover:bg-surface-2/50 px-2">
            <span className="flex -space-x-3">{o.items.slice(0, 3).map((i) => <span key={i.id} className="relative w-12 h-14 bg-surface-2 border-2 border-bg">{i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}</span>)}</span>
            <span className="flex-1 min-w-[140px]"><span className="block font-medium">{o.orderNo}</span><span className="text-xs text-muted">{date(locale, o.createdAt)} · {num(locale, o.items.reduce((a, i) => a + i.qty, 0))} {t('items', 'টি পণ্য')}</span></span>
            <StatusBadge locale={locale} status={o.status} />
            <span className="w-28 text-right">{money(locale, o.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AccountHome() {
  const { t, locale, me, wishlist } = useStore();
  const { data } = useLoad<{ items: OrderRow[] }>('/account/orders');
  if (!me) return null;
  const active = data?.items.filter((o) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status)).length ?? 0;
  const cards: [string, string | number, string][] = [
    [t('Active orders', 'চলমান অর্ডার'), num(locale, active), '/account/orders'],
    [t('Shekor Circle points', 'সার্কেল পয়েন্ট'), num(locale, me.loyaltyPoints), '/account/loyalty'],
    [t('Saved pieces', 'সংরক্ষিত পিস'), num(locale, wishlist.length), '/wishlist'],
  ];
  return (
    <div className="space-y-10" data-testid="account-home">
      <h1 className="h-display text-4xl">{t(`Hello, ${me.name.split(' ')[0]}`, `স্বাগতম, ${me.name.split(' ')[0]}`)}</h1>
      <div className="grid sm:grid-cols-3 gap-4">{cards.map(([l, v, href]) => <Link key={l} href={lp(locale, href)} className="card p-5 hover:border-ink transition-colors"><p className="text-xs text-muted uppercase tracking-widest">{l}</p><p className="h-display text-4xl mt-2">{v}</p></Link>)}</div>
      <section><div className="flex justify-between items-end mb-4"><h2 className="h-serif text-2xl">{t('Recent orders', 'সাম্প্রতিক অর্ডার')}</h2><Link className="link text-sm" href={lp(locale, '/account/orders')}>{t('View all', 'সব দেখুন')}</Link></div>{data ? <OrderList items={data.items.slice(0, 3)} /> : <Loading />}</section>
      <p className="text-sm text-muted">{t(`Member tier: ${me.tier}`, `সদস্য স্তর: ${me.tier}`)}</p>
    </div>
  );
}

export function AccountOrders() {
  const { t } = useStore();
  const { data } = useLoad<{ items: OrderRow[] }>('/account/orders');
  return <div><h1 className="h-display text-4xl mb-8">{t('Orders', 'অর্ডার')}</h1>{data ? <OrderList items={data.items} /> : <Loading />}</div>;
}

export function AccountOrder({ orderNo }: { orderNo: string }) {
  const { t, locale } = useStore();
  const { data, error } = useLoad<OrderData>(`/account/orders/${encodeURIComponent(orderNo)}`);
  if (error) return <p className="py-16 text-center">{error}</p>;
  if (!data) return <Loading />;
  return (
    <div>
      <Link className="link text-sm" href={lp(locale, '/account/orders')}>← {t('All orders', 'সব অর্ডার')}</Link>
      <h1 className="h-display text-4xl mt-4 mb-2">{data.orderNo}</h1>
      <p className="text-muted mb-8">{t('Placed', 'অর্ডারের তারিখ')} {date(locale, data.createdAt)}</p>
      <OrderView locale={locale} o={data} />
      {data.status === 'DELIVERED' && <p className="mt-8 text-sm">{t('Loved it?', 'ভালো লেগেছে?')} <Link className="link" href={lp(locale, '/account/reviews')}>{t('Write a review', 'রিভিউ লিখুন')}</Link></p>}
    </div>
  );
}

interface Address { id: number; label: string; name: string; phone: string; division: string; district: string; area: string; line1: string; isDefault: boolean }
const EMPTY: Omit<Address, 'id'> = { label: 'Home', name: '', phone: '', division: 'Dhaka', district: 'Dhaka', area: '', line1: '', isDefault: false };

export function AccountAddresses() {
  const { t, locale, toast, me } = useStore();
  const { data, reload } = useLoad<{ items: Address[] }>('/account/addresses');
  const [edit, setEdit] = useState<(Omit<Address, 'id'> & { id?: number }) | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    setBusy(true); setErrs({});
    const { id, ...body } = edit;
    try {
      await api(id ? `/account/addresses/${id}` : '/account/addresses', { method: id ? 'PUT' : 'POST', body });
      setEdit(null); await reload(); toast(t('Address saved', 'ঠিকানা সংরক্ষিত'));
    } catch (x) {
      const f = (x as ApiClientError).fields ?? {};
      setErrs({ ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v)])), _form: (x as Error).message });
    } finally { setBusy(false); }
  };
  const districts = BD_DIVISIONS.find((d) => d.en === edit?.division)?.districts ?? [];
  const inp = (k: 'label' | 'name' | 'phone' | 'area' | 'line1', label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => edit && (
    <div><label htmlFor={`ad-${k}`} className="label">{label}</label><input id={`ad-${k}`} className="input" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} aria-invalid={!!errs[k]} {...extra} />{errs[k] && <p className="text-xs text-sale mt-1">{errs[k]}</p>}</div>
  );
  return (
    <div>
      <div className="flex justify-between items-end mb-8"><h1 className="h-display text-4xl">{t('Addresses', 'ঠিকানা')}</h1><button type="button" className="btn btn-primary btn-sm" onClick={() => setEdit({ ...EMPTY, name: me?.name ?? '', phone: me?.phone ?? '' })} data-testid="address-add">{t('Add address', 'ঠিকানা যোগ করুন')}</button></div>
      {!data ? <Loading /> : !data.items.length ? <p className="py-12 text-center text-muted border border-dashed border-line">{t('No saved addresses yet.', 'কোনো সংরক্ষিত ঠিকানা নেই।')}</p> : (
        <ul className="grid sm:grid-cols-2 gap-4" data-testid="address-list">
          {data.items.map((a) => (
            <li key={a.id} className="card p-5 text-sm" data-testid="address-card">
              <p className="flex items-center gap-2 font-medium">{a.label}{a.isDefault && <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5">{t('Default', 'ডিফল্ট')}</span>}</p>
              <p className="mt-2">{a.name} · {a.phone}</p><p className="text-muted">{a.line1}, {a.area}, {a.district}, {a.division}</p>
              <div className="flex gap-4 mt-4">
                <button type="button" className="link" onClick={() => setEdit(a)}>{t('Edit', 'সম্পাদনা')}</button>
                {!a.isDefault && <button type="button" className="link" onClick={async () => { const { id, ...b } = a; await api(`/account/addresses/${id}`, { method: 'PUT', body: { ...b, isDefault: true } }); await reload(); }}>{t('Make default', 'ডিফল্ট করুন')}</button>}
                <button type="button" className="link text-sale" data-testid="address-delete" onClick={async () => { if (!confirm(t('Delete this address?', 'এই ঠিকানা মুছবেন?'))) return; await api(`/account/addresses/${a.id}`, { method: 'DELETE' }); await reload(); toast(t('Address deleted', 'ঠিকানা মুছে ফেলা হয়েছে')); }}>{t('Delete', 'মুছুন')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {edit && (
        <Modal title={edit.id ? t('Edit address', 'ঠিকানা সম্পাদনা') : t('New address', 'নতুন ঠিকানা')} onClose={() => setEdit(null)}>
          <form className="space-y-4" onSubmit={save} data-testid="address-form">
            <div className="grid grid-cols-2 gap-4">{inp('label', t('Label', 'লেবেল'), { placeholder: t('Home, Office…', 'বাসা, অফিস…') })}{inp('name', t('Name', 'নাম'), { required: true })}</div>
            {inp('phone', t('Mobile', 'মোবাইল'), { required: true, inputMode: 'tel' })}
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="ad-division" className="label">{t('Division', 'বিভাগ')}</label><select id="ad-division" className="input" value={edit.division} onChange={(e) => setEdit({ ...edit, division: e.target.value, district: BD_DIVISIONS.find((d) => d.en === e.target.value)?.districts[0] ?? '' })}>{BD_DIVISIONS.map((d) => <option key={d.en} value={d.en}>{locale === 'bn' ? d.bn : d.en}</option>)}</select></div>
              <div><label htmlFor="ad-district" className="label">{t('District', 'জেলা')}</label><select id="ad-district" className="input" value={edit.district} onChange={(e) => setEdit({ ...edit, district: e.target.value })}>{districts.map((d) => <option key={d}>{d}</option>)}</select></div>
            </div>
            {inp('area', t('Area / thana', 'এলাকা / থানা'), { required: true })}
            {inp('line1', t('House, road, floor', 'বাড়ি, রোড, তলা'), { required: true })}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" checked={edit.isDefault} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} />{t('Set as default', 'ডিফল্ট হিসেবে রাখুন')}</label>
            {errs._form && <p className="text-sm text-sale" role="alert">{errs._form}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="address-save">{t('Save address', 'ঠিকানা সংরক্ষণ')}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

interface MyReview { id: number; rating: number; title: string; body: string; status: string; createdAt: string; product: { slug: string; nameEn: string; nameBn: string } }
export function AccountReviews() {
  const { t, locale } = useStore();
  const { data } = useLoad<{ items: MyReview[]; pending: { id: number; product: { slug: string; nameEn: string; nameBn: string } }[] }>('/account/reviews');
  const st: Record<string, [string, string]> = { pending: ['Awaiting moderation', 'যাচাইয়ের অপেক্ষায়'], approved: ['Published', 'প্রকাশিত'], rejected: ['Not published', 'প্রকাশিত হয়নি'] };
  if (!data) return <Loading />;
  return (
    <div className="space-y-10">
      <h1 className="h-display text-4xl">{t('Reviews', 'রিভিউ')}</h1>
      {data.pending.length > 0 && <section><h2 className="h-serif text-xl mb-4">{t('Waiting for your review', 'আপনার রিভিউয়ের অপেক্ষায়')}</h2><ul className="flex flex-wrap gap-2">{data.pending.map((p) => <li key={p.id}><Link className="chip" href={lp(locale, `/p/${p.product.slug}#reviews`)}>{locale === 'bn' ? p.product.nameBn : p.product.nameEn} →</Link></li>)}</ul></section>}
      {!data.items.length ? <p className="py-12 text-center text-muted border border-dashed border-line">{t('You haven’t written any reviews yet.', 'আপনি এখনো কোনো রিভিউ লেখেননি।')}</p> : (
        <ul className="divide-y divide-line border-y border-line">{data.items.map((r) => (
          <li key={r.id} className="py-5"><div className="flex flex-wrap items-center gap-3"><Stars value={r.rating} /><Link className="font-medium hover:text-accent" href={lp(locale, `/p/${r.product.slug}`)}>{locale === 'bn' ? r.product.nameBn : r.product.nameEn}</Link><span className="text-xs text-muted">{date(locale, r.createdAt)} · {t(...(st[r.status] ?? [r.status, r.status]))}</span></div><p className="mt-2 font-medium">{r.title}</p><p className="text-sm text-muted mt-1">{r.body}</p></li>
        ))}</ul>
      )}
    </div>
  );
}

export function AccountLoyalty() {
  const { t, locale } = useStore();
  const { data } = useLoad<{ points: number; tier: string; transactions: { id: number; points: number; reason: string; orderNo: string | null; createdAt: string }[] }>('/account/loyalty');
  if (!data) return <Loading />;
  const tiers: [string, number, string, string][] = [['Sapling', 0, 'Welcome gift and birthday offer', 'স্বাগত উপহার ও জন্মদিনের অফার'], ['Segun', 1500, 'Free assembly on every order + early sale access', 'প্রতি অর্ডারে ফ্রি অ্যাসেম্বলি + আগাম সেল'], ['Heartwood', 5000, 'Free delivery nationwide + a designer consultation each year', 'সারাদেশে ফ্রি ডেলিভারি + বছরে একটি ডিজাইনার কনসাল্টেশন']];
  const next = tiers.find((x) => x[1] > data.points);
  return (
    <div className="space-y-10" data-testid="loyalty">
      <h1 className="h-display text-4xl">{t('Shekor Circle', 'শেকড় সার্কেল')}</h1>
      <div className="card p-6 bg-deep text-white border-0"><p className="text-xs uppercase tracking-widest text-sand">{data.tier}</p><p className="h-display text-6xl mt-2">{num(locale, data.points)}</p><p className="text-white/70 mt-1">{t('points · 1 point for every ৳100 spent', 'পয়েন্ট · প্রতি ৳১০০-তে ১ পয়েন্ট')}</p>{next && <p className="text-sm mt-4">{t(`${next[1] - data.points} points to ${next[0]}`, `${next[0]} পর্যন্ত আর ${num('bn', next[1] - data.points)} পয়েন্ট`)}</p>}</div>
      <div className="grid sm:grid-cols-3 gap-4">{tiers.map(([n, p, en, bn]) => <div key={n} className={`card p-5 ${n === data.tier ? 'ring-2 ring-primary' : ''}`}><p className="font-medium">{n}</p><p className="text-xs text-muted">{num(locale, p)}+ {t('points', 'পয়েন্ট')}</p><p className="text-sm mt-3">{t(en, bn)}</p></div>)}</div>
      <section><h2 className="h-serif text-xl mb-4">{t('History', 'ইতিহাস')}</h2>{!data.transactions.length ? <p className="text-muted text-sm">{t('Points appear here after your first delivery.', 'প্রথম ডেলিভারির পর পয়েন্ট এখানে দেখাবে।')}</p> : <ul className="divide-y divide-line border-y border-line text-sm">{data.transactions.map((x) => <li key={x.id} className="py-3 flex justify-between gap-4"><span>{x.reason}{x.orderNo ? ` · ${x.orderNo}` : ''}<span className="block text-xs text-muted">{date(locale, x.createdAt)}</span></span><span className={x.points > 0 ? 'text-success' : 'text-sale'}>{x.points > 0 ? '+' : ''}{num(locale, x.points)}</span></li>)}</ul>}</section>
    </div>
  );
}

export function AccountSettings() {
  const { t, locale, me, refreshMe, toast } = useStore();
  const router = useRouter();
  const [p, setP] = useState({ name: me?.name ?? '', email: me?.email ?? '', locale: (me?.locale ?? locale) as 'en' | 'bn', marketingOptIn: !!me?.marketingOptIn });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [confirmDel, setConfirmDel] = useState('');
  return (
    <div className="space-y-12 max-w-xl">
      <h1 className="h-display text-4xl">{t('Settings', 'সেটিংস')}</h1>
      <form className="space-y-4" data-testid="profile-form" onSubmit={async (e) => {
        e.preventDefault(); setMsg({});
        try { await api('/account/profile', { method: 'PATCH', body: p }); await refreshMe(); toast(t('Profile saved', 'প্রোফাইল সংরক্ষিত')); setMsg({ profile: 'ok' }); }
        catch (x) { setMsg({ profileErr: (x as Error).message }); }
      }}>
        <h2 className="h-serif text-xl">{t('Profile', 'প্রোফাইল')}</h2>
        <div><label htmlFor="st-name" className="label">{t('Name', 'নাম')}</label><input id="st-name" className="input" required minLength={2} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
        <div><label htmlFor="st-email" className="label">{t('Email', 'ইমেইল')}</label><input id="st-email" type="email" className="input" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></div>
        <div><p className="label">{t('Mobile', 'মোবাইল')}</p><p className="text-sm">{me?.phone ?? '—'} <span className="text-xs text-muted">({t('contact us to change', 'পরিবর্তনে যোগাযোগ করুন')})</span></p></div>
        <div><label htmlFor="st-locale" className="label">{t('Language for SMS & email', 'এসএমএস ও ইমেইলের ভাষা')}</label><select id="st-locale" className="input" value={p.locale} onChange={(e) => setP({ ...p, locale: e.target.value as 'en' | 'bn' })}><option value="en">English</option><option value="bn">বাংলা</option></select></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" checked={p.marketingOptIn} onChange={(e) => setP({ ...p, marketingOptIn: e.target.checked })} />{t('Send me news and offers', 'খবর ও অফার পাঠান')}</label>
        {msg.profileErr && <p className="text-sm text-sale" role="alert">{msg.profileErr}</p>}
        {msg.profile && <p className="text-sm text-success" role="status" data-testid="profile-saved">{t('Saved', 'সংরক্ষিত')}</p>}
        <button type="submit" className="btn btn-primary" data-testid="profile-save">{t('Save profile', 'প্রোফাইল সংরক্ষণ')}</button>
      </form>
      <form className="space-y-4 border-t border-line pt-10" data-testid="password-form" onSubmit={async (e) => {
        e.preventDefault(); setMsg({});
        try { await api('/account/password', { body: pw }); setPw({ currentPassword: '', newPassword: '' }); setMsg({ pw: 'ok' }); }
        catch (x) { setMsg({ pwErr: (x as Error).message }); }
      }}>
        <h2 className="h-serif text-xl">{t('Change password', 'পাসওয়ার্ড পরিবর্তন')}</h2>
        <div><label htmlFor="st-cur" className="label">{t('Current password', 'বর্তমান পাসওয়ার্ড')}</label><input id="st-cur" type="password" autoComplete="current-password" className="input" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
        <div><label htmlFor="st-new" className="label">{t('New password', 'নতুন পাসওয়ার্ড')}</label><input id="st-new" type="password" autoComplete="new-password" className="input" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /><p className="text-xs text-muted mt-1">{t('At least 8 characters, with a letter and a number', 'কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যাসহ')}</p></div>
        {msg.pwErr && <p className="text-sm text-sale" role="alert">{msg.pwErr}</p>}
        {msg.pw && <p className="text-sm text-success" role="status">{t('Password updated', 'পাসওয়ার্ড আপডেট হয়েছে')}</p>}
        <button type="submit" className="btn btn-outline">{t('Update password', 'পাসওয়ার্ড আপডেট')}</button>
      </form>
      <section className="border-t border-line pt-10 space-y-3">
        <h2 className="h-serif text-xl text-sale">{t('Delete account', 'অ্যাকাউন্ট মুছুন')}</h2>
        <p className="text-sm text-muted">{t('We remove your personal details, addresses and wishlist. Order records are kept for accounting and warranty, without your name.', 'আপনার ব্যক্তিগত তথ্য, ঠিকানা ও উইশলিস্ট মুছে ফেলা হবে। হিসাব ও ওয়ারেন্টির জন্য অর্ডার রেকর্ড নামবিহীনভাবে থাকবে।')}</p>
        <label htmlFor="st-del" className="label">{t('Type DELETE to confirm', 'নিশ্চিত করতে DELETE লিখুন')}</label>
        <div className="flex gap-3"><input id="st-del" className="input max-w-[200px]" value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} /><button type="button" className="btn btn-outline text-sale border-sale" disabled={confirmDel !== 'DELETE'} onClick={async () => { await api('/account/profile', { method: 'DELETE' }); await refreshMe(); router.replace(lp(locale, '/')); }}>{t('Delete my account', 'অ্যাকাউন্ট মুছুন')}</button></div>
      </section>
    </div>
  );
}
