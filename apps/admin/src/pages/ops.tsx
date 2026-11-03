import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Upload } from 'lucide-react';
import { api, qs, upload } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, Empty, ErrorBox, Loading, Modal, ORDER_TONE, PageHeader, Pager, Pill, SearchInput, useUi } from '@/components/ui';
import { NoAccess } from '@/components/layout';

const useSet = () => {
  const [sp, setSp] = useSearchParams();
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); setSp(n, { replace: true }); };
  return [sp, set] as const;
};

interface Variant { id: number; sku: string; nameEn: string; stockQty: number; lowStockAt: number; product: { id: number; nameEn: string; stockStatus: string }; movements: { id: number; delta: number; reason: string; createdAt: string }[] }
export function Inventory() {
  const { can } = useAuth();
  const { t, num, date } = usePrefs();
  const { toast } = useUi();
  const qc = useQueryClient();
  const [sp, set] = useSet();
  const page = Number(sp.get('page') ?? 1);
  const f = { q: sp.get('q') ?? '', low: sp.get('low') ?? '' };
  const q = useQuery({ queryKey: ['inventory', page, f], queryFn: () => api<{ items: Variant[]; total: number; pageSize: number }>(`/admin/inventory${qs({ page, ...f })}`), enabled: can('inventory.read') });
  const [adj, setAdj] = useState<Variant | null>(null);
  const [d, setD] = useState({ delta: '', reason: 'restock' });
  const m = useMutation({ mutationFn: () => api('/admin/inventory', { body: { variantId: adj!.id, delta: Number(d.delta), reason: d.reason } }), onSuccess: () => { toast(t('Stock updated', 'স্টক আপডেট হয়েছে')); setAdj(null); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); }, onError: (e) => toast((e as Error).message, 'err') });
  if (!can('inventory.read')) return <NoAccess />;
  return (
    <div data-testid="inventory">
      <PageHeader title={t('Inventory', 'ইনভেন্টরি')} />
      <Card pad={false}>
        <div className="flex flex-wrap gap-2 p-4 border-b border-line items-center">
          <SearchInput value={f.q} onChange={(v) => set('q', v)} placeholder={t('SKU or product', 'SKU বা পণ্য')} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" checked={f.low === '1'} onChange={(e) => set('low', e.target.checked ? '1' : '')} />{t('Low stock only (≤ 3)', 'শুধু কম স্টক (≤ ৩)')}</label>
        </div>
        {q.isLoading ? <Loading /> : q.error ? <div className="p-4"><ErrorBox error={q.error} /></div> : !q.data?.items.length ? <Empty>{t('Nothing to show.', 'কিছু নেই।')}</Empty> : (
          <>
            <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>SKU</th><th>{t('Product / variant', 'পণ্য / ভ্যারিয়েন্ট')}</th><th className="text-right">{t('On hand', 'স্টকে')}</th><th>{t('Recent movements', 'সাম্প্রতিক পরিবর্তন')}</th><th /></tr></thead>
              <tbody>{q.data.items.map((v) => (
                <tr key={v.id} data-testid="inventory-row">
                  <td><code className="text-xs">{v.sku}</code></td>
                  <td><Link to={`/products/${v.product.id}`} className="hover:text-primary">{v.product.nameEn}</Link><div className="text-xs text-muted">{v.nameEn}{v.product.stockStatus === 'MADE_TO_ORDER' ? ` · ${t('made to order', 'অর্ডারে তৈরি')}` : ''}</div></td>
                  <td className="text-right"><Pill tone={v.stockQty === 0 ? 'red' : v.stockQty <= v.lowStockAt ? 'amber' : 'green'}>{num(v.stockQty)}</Pill></td>
                  <td className="text-xs text-muted">{v.movements.map((mv) => <div key={mv.id}>{mv.delta > 0 ? '+' : ''}{num(mv.delta)} {mv.reason} · {date(mv.createdAt)}</div>)}</td>
                  <td className="text-right">{can('inventory.write') && <button type="button" className="btn btn-outline btn-xs" onClick={() => { setAdj(v); setD({ delta: '', reason: 'restock' }); }} data-testid="adjust">{t('Adjust', 'সমন্বয়')}</button>}</td>
                </tr>
              ))}</tbody></table></div>
            <Pager page={page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => set('page', String(p))} />
          </>
        )}
      </Card>
      {adj && (
        <Modal title={`${t('Adjust stock', 'স্টক সমন্বয়')} · ${adj.sku}`} onClose={() => setAdj(null)} footer={<><button type="button" className="btn btn-outline" onClick={() => setAdj(null)}>{t('Cancel', 'বাতিল')}</button><button type="button" className="btn btn-primary" disabled={!d.delta || Number(d.delta) === 0 || m.isPending} onClick={() => m.mutate()} data-testid="adjust-save">{t('Apply', 'প্রয়োগ')}</button></>}>
          <p className="text-sm mb-4">{adj.product.nameEn} — {adj.nameEn}. {t('Currently', 'বর্তমানে')} <strong>{num(adj.stockQty)}</strong>.</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="adj-d" className="label">{t('Change (+/−)', 'পরিবর্তন (+/−)')}</label><input id="adj-d" type="number" className="input" value={d.delta} onChange={(e) => setD({ ...d, delta: e.target.value })} /></div>
            <div><label htmlFor="adj-r" className="label">{t('Reason', 'কারণ')}</label><select id="adj-r" className="input" value={d.reason} onChange={(e) => setD({ ...d, reason: e.target.value })}>{['restock', 'adjustment', 'damage', 'transfer'].map((r) => <option key={r}>{r}</option>)}</select></div>
          </div>
          {d.delta && <p className="hint mt-3">{t('New quantity', 'নতুন পরিমাণ')}: {num(adj.stockQty + Number(d.delta))}</p>}
        </Modal>
      )}
    </div>
  );
}

interface CRow { id: number; name: string; email: string | null; phone: string | null; tier: string; loyaltyPoints: number; isActive: boolean; createdAt: string; lastLoginAt: string | null; _count: { orders: number }; lifetimeValue: number }
export function Customers() {
  const { can } = useAuth();
  const { t, money, num, date } = usePrefs();
  const [sp, set] = useSet();
  const page = Number(sp.get('page') ?? 1);
  const f = { q: sp.get('q') ?? '', tier: sp.get('tier') ?? '' };
  const q = useQuery({ queryKey: ['customers', page, f], queryFn: () => api<{ items: CRow[]; total: number; pageSize: number }>(`/admin/customers${qs({ page, ...f })}`), enabled: can('customers.read') });
  if (!can('customers.read')) return <NoAccess />;
  return (
    <div data-testid="customers">
      <PageHeader title={t('Customers', 'গ্রাহক')} />
      <Card pad={false}>
        <div className="flex flex-wrap gap-2 p-4 border-b border-line"><SearchInput value={f.q} onChange={(v) => set('q', v)} placeholder={t('Name, email or phone', 'নাম, ইমেইল বা ফোন')} /><select className="input w-auto" value={f.tier} onChange={(e) => set('tier', e.target.value)} aria-label="Tier"><option value="">{t('All tiers', 'সব স্তর')}</option>{['Sapling', 'Segun', 'Heartwood'].map((x) => <option key={x}>{x}</option>)}</select></div>
        {q.isLoading ? <Loading /> : q.error ? <div className="p-4"><ErrorBox error={q.error} /></div> : !q.data?.items.length ? <Empty>{t('No customers match.', 'কোনো গ্রাহক নেই।')}</Empty> : (
          <>
            <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Customer', 'গ্রাহক')}</th><th>{t('Tier', 'স্তর')}</th><th className="text-right">{t('Orders', 'অর্ডার')}</th><th className="text-right">{t('Lifetime value', 'মোট কেনাকাটা')}</th><th>{t('Joined', 'যোগদান')}</th><th>{t('Status', 'স্ট্যাটাস')}</th></tr></thead>
              <tbody>{q.data.items.map((c) => <tr key={c.id} data-testid="customer-row"><td><Link to={`/customers/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link><div className="text-xs text-muted">{c.phone} {c.email && `· ${c.email}`}</div></td><td><Pill tone="brand">{c.tier}</Pill> <span className="text-xs text-muted">{num(c.loyaltyPoints)} pts</span></td><td className="text-right">{num(c._count.orders)}</td><td className="text-right">{money(c.lifetimeValue)}</td><td>{date(c.createdAt)}</td><td>{c.isActive ? <Pill tone="green">active</Pill> : <Pill tone="red">blocked</Pill>}</td></tr>)}</tbody></table></div>
            <Pager page={page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => set('page', String(p))} />
          </>
        )}
      </Card>
    </div>
  );
}

interface CFull { id: number; name: string; email: string | null; phone: string | null; tier: string; loyaltyPoints: number; isActive: boolean; createdAt: string; lastLoginAt: string | null; marketingOptIn: boolean; addresses: { id: number; label: string; line1: string; area: string; district: string }[]; orders: { id: number; orderNo: string; total: number; status: string; createdAt: string }[]; reviews: { id: number; title: string; rating: number; status: string }[] }
export function CustomerDetail() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { t, money, num, date } = usePrefs();
  const { toast, confirm } = useUi();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['customer', id], queryFn: () => api<CFull>(`/admin/customers/${id}`), enabled: can('customers.read') });
  const [pts, setPts] = useState({ n: '', reason: '' });
  const patch = async (body: object, msg: string) => { try { await api(`/admin/customers/${id}`, { method: 'PATCH', body }); toast(msg); qc.invalidateQueries({ queryKey: ['customer', id] }); qc.invalidateQueries({ queryKey: ['customers'] }); } catch (e) { toast((e as Error).message, 'err'); } };
  if (!can('customers.read')) return <NoAccess />;
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const c = q.data;
  return (
    <div data-testid="customer-detail">
      <PageHeader crumbs={<><Link to="/customers" className="hover:underline">{t('Customers', 'গ্রাহক')}</Link> / {c.name}</>} title={c.name} sub={<>{c.phone} {c.email && `· ${c.email}`} · {t('joined', 'যোগদান')} {date(c.createdAt)}</>}
        actions={can('customers.write') && <button type="button" className={`btn btn-sm ${c.isActive ? 'btn-outline text-sale' : 'btn-primary'}`} data-testid="toggle-block" onClick={async () => { if (c.isActive && !(await confirm({ title: t('Block this customer?', 'গ্রাহককে ব্লক করবেন?'), body: t('They will be signed out and unable to sign in.', 'তাকে সাইন আউট করা হবে।'), danger: true, confirm: t('Block', 'ব্লক') }))) return; patch({ isActive: !c.isActive }, c.isActive ? t('Customer blocked', 'ব্লক করা হয়েছে') : t('Customer unblocked', 'আনব্লক করা হয়েছে')); }}>{c.isActive ? t('Block', 'ব্লক') : t('Unblock', 'আনব্লক')}</button>} />
      <div className="grid xl:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="space-y-4">
          <Card title={t('Orders', 'অর্ডার')} pad={false}>{c.orders.length ? <div className="overflow-x-auto mt-2"><table className="tbl"><tbody>{c.orders.map((o) => <tr key={o.id}><td><Link to={`/orders/${o.id}`} className="text-primary font-medium">#{o.orderNo}</Link></td><td>{date(o.createdAt)}</td><td><Pill tone={ORDER_TONE[o.status]}>{o.status.replace(/_/g, ' ').toLowerCase()}</Pill></td><td className="text-right">{money(o.total)}</td></tr>)}</tbody></table></div> : <Empty>{t('No orders yet.', 'কোনো অর্ডার নেই।')}</Empty>}</Card>
          <Card title={t('Addresses', 'ঠিকানা')}>{c.addresses.length ? <ul className="text-sm space-y-2">{c.addresses.map((a) => <li key={a.id}><strong>{a.label}</strong> — {a.line1}, {a.area}, {a.district}</li>)}</ul> : <p className="text-sm text-muted">—</p>}</Card>
        </div>
        <Card title={t('Shekor Circle', 'শেকড় সার্কেল')}>
          <p className="text-3xl font-semibold" data-testid="points">{num(c.loyaltyPoints)}</p><p className="text-sm text-muted">{c.tier} · {c.marketingOptIn ? t('subscribed to marketing', 'মার্কেটিং সাবস্ক্রাইবড') : t('no marketing', 'মার্কেটিং নয়')}</p>
          {can('customers.write') && (
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!Number(pts.n)) return; patch({ pointsAdjust: Number(pts.n), reason: pts.reason || undefined }, t('Points adjusted', 'পয়েন্ট সমন্বয় হয়েছে')); setPts({ n: '', reason: '' }); }}>
              <div><label htmlFor="pa" className="label">{t('Adjust points (+/−)', 'পয়েন্ট সমন্বয় (+/−)')}</label><input id="pa" type="number" className="input" value={pts.n} onChange={(e) => setPts({ ...pts, n: e.target.value })} /></div>
              <div><label htmlFor="pr" className="label">{t('Reason', 'কারণ')}</label><input id="pr" className="input" value={pts.reason} onChange={(e) => setPts({ ...pts, reason: e.target.value })} maxLength={120} /></div>
              <button type="submit" className="btn btn-outline btn-sm" data-testid="points-save">{t('Apply', 'প্রয়োগ')}</button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

interface Audit { id: number; action: string; entity: string; entityId: string | null; summary: string | null; ip: string | null; createdAt: string; user: { name: string; email: string } | null }
export function AuditLog() {
  const { can } = useAuth();
  const { t, date } = usePrefs();
  const [sp, set] = useSet();
  const page = Number(sp.get('page') ?? 1);
  const entity = sp.get('entity') ?? '';
  const q = useQuery({ queryKey: ['audit', page, entity], queryFn: () => api<{ items: Audit[]; total: number; pageSize: number }>(`/admin/audit${qs({ page, entity })}`), enabled: can('audit.read') });
  if (!can('audit.read')) return <NoAccess />;
  return (
    <div data-testid="audit">
      <PageHeader title={t('Audit log', 'অডিট লগ')} />
      <Card pad={false}>
        <div className="p-4 border-b border-line"><select className="input w-auto" value={entity} onChange={(e) => set('entity', e.target.value)} aria-label="Entity"><option value="">{t('All areas', 'সব')}</option>{['auth', 'order', 'product', 'variant', 'customer', 'staff', 'role', 'settings', 'media', 'coupons', 'banners', 'pages', 'blog', 'reviews', 'categories', 'collections', 'projects'].map((x) => <option key={x}>{x}</option>)}</select></div>
        {q.isLoading ? <Loading /> : q.error ? <div className="p-4"><ErrorBox error={q.error} /></div> : !q.data?.items.length ? <Empty>—</Empty> : (
          <><div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('When', 'কখন')}</th><th>{t('Who', 'কে')}</th><th>{t('Action', 'কাজ')}</th><th>{t('Summary', 'সারাংশ')}</th><th>IP</th></tr></thead>
            <tbody>{q.data.items.map((a) => <tr key={a.id}><td className="whitespace-nowrap">{date(a.createdAt, true)}</td><td>{a.user?.name ?? '—'}</td><td><Pill tone={a.action.includes('fail') || a.action === 'delete' ? 'red' : a.action === 'create' ? 'green' : 'gray'}>{a.action}</Pill> <span className="text-xs text-muted">{a.entity}</span></td><td>{a.summary}</td><td className="text-xs text-muted">{a.ip}</td></tr>)}</tbody></table></div>
            <Pager page={page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => set('page', String(p))} /></>
        )}
      </Card>
    </div>
  );
}

export function Media() {
  const { can } = useAuth();
  const { t, date } = usePrefs();
  const { toast } = useUi();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['media'], queryFn: () => api<{ items: { id: number; url: string; mime: string; sizeBytes: number; createdAt: string }[] }>('/admin/uploads'), enabled: can('media.write') });
  const [busy, setBusy] = useState(false);
  if (!can('media.write')) return <NoAccess />;
  return (
    <div data-testid="media">
      <PageHeader title={t('Media library', 'মিডিয়া লাইব্রেরি')} actions={<label className="btn btn-primary btn-sm cursor-pointer"><Upload className="w-4 h-4" />{busy ? t('Uploading…', 'আপলোড হচ্ছে…') : t('Upload images', 'ছবি আপলোড')}<input type="file" accept="image/*" multiple className="sr-only" data-testid="media-upload" onChange={async (e) => {
        setBusy(true);
        for (const f of [...(e.target.files ?? [])]) { try { await upload(f, 'media'); } catch (x) { toast((x as Error).message, 'err'); } }
        setBusy(false); e.target.value = ''; qc.invalidateQueries({ queryKey: ['media'] }); toast(t('Upload complete', 'আপলোড সম্পন্ন'));
      }} /></label>} />
      {q.isLoading ? <Loading /> : !q.data?.items.length ? <Card><Empty>{t('No uploads yet. Seeded images live under /media.', 'এখনো আপলোড নেই।')}</Empty></Card> : (
        <ul className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-4">{q.data.items.map((m) => (
          <li key={m.id} className="card overflow-hidden"><img src={m.url} alt="" className="aspect-square w-full object-cover" loading="lazy" /><div className="p-2 text-xs flex items-center gap-1"><span className="flex-1 truncate text-muted">{date(m.createdAt)} · {Math.round(m.sizeBytes / 1024)} KB</span><button type="button" className="btn-icon w-7 h-7" onClick={() => { navigator.clipboard?.writeText(m.url); toast(t('URL copied', 'URL কপি হয়েছে')); }} aria-label={t('Copy URL', 'URL কপি')}><Copy className="w-3.5 h-3.5" /></button></div></li>
        ))}</ul>
      )}
    </div>
  );
}
