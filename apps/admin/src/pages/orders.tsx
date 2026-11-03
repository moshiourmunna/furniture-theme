import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Printer } from 'lucide-react';
import { DELIVERY_SLOTS, ORDER_STATUS_LABEL, ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatusCode } from '@shekor/shared';
import { api, qs } from '@/lib/api';
import { toDhakaInput } from '@/lib/form';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, Empty, ErrorBox, Loading, Modal, ORDER_TONE, PAY_TONE, PageHeader, Pager, Pill, SearchInput, useUi, methodLabel } from '@/components/ui';
import { NoAccess, STORE_URL } from '@/components/layout';

interface OrderRow { id: number; orderNo: string; customerName: string; phone: string; district: string; total: number; amountPaid: number; status: OrderStatusCode; paymentStatus: string; paymentMethod: string; createdAt: string; _count: { items: number } }

export function Orders() {
  const { can } = useAuth();
  const { t, money, date, num, lang } = usePrefs();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') ?? 1);
  const f = { q: sp.get('q') ?? '', status: sp.get('status') ?? '', payment: sp.get('payment') ?? '', paymentStatus: sp.get('paymentStatus') ?? '' };
  const q = useQuery({ queryKey: ['orders', page, f], queryFn: () => api<{ items: OrderRow[]; total: number; pageSize: number; statusCounts: Record<string, number> }>(`/admin/orders${qs({ page, ...f })}`), enabled: can('orders.read') });
  if (!can('orders.read')) return <NoAccess />;
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); setSp(n, { replace: true }); };
  const counts = q.data?.statusCounts ?? {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div data-testid="orders">
      <PageHeader title={t('Orders', 'অর্ডার')} />
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <button type="button" className={`chip ${!f.status ? 'chip-active' : ''}`} onClick={() => set('status', '')}>{t('All', 'সব')} <span className="opacity-70">{num(all)}</span></button>
        {ORDER_STATUSES.map((s) => <button key={s} type="button" className={`chip ${f.status === s ? 'chip-active' : ''}`} onClick={() => set('status', s)} data-testid={`status-chip-${s}`}>{ORDER_STATUS_LABEL[s][lang === 'bn' ? 1 : 0]} <span className="opacity-70">{num(counts[s] ?? 0)}</span></button>)}
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap gap-2 p-4 border-b border-line">
          <SearchInput value={f.q} onChange={(v) => set('q', v)} placeholder={t('Order no, customer or phone', 'অর্ডার নং, গ্রাহক বা ফোন')} />
          <select className="input w-auto" value={f.payment} onChange={(e) => set('payment', e.target.value)} aria-label={t('Payment method', 'পেমেন্ট পদ্ধতি')}><option value="">{t('Any method', 'যেকোনো পদ্ধতি')}</option>{['bkash', 'nagad', 'card', 'cod', 'bank'].map((m) => <option key={m} value={m}>{m}</option>)}</select>
          <select className="input w-auto" value={f.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)} aria-label={t('Payment status', 'পেমেন্ট স্ট্যাটাস')}><option value="">{t('Any payment status', 'যেকোনো স্ট্যাটাস')}</option>{['UNPAID', 'PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED'].map((m) => <option key={m} value={m}>{m.toLowerCase()}</option>)}</select>
        </div>
        {q.isLoading ? <Loading /> : q.error ? <div className="p-4"><ErrorBox error={q.error} /></div> : !q.data?.items.length ? <Empty>{t('No orders match.', 'কোনো অর্ডার নেই।')}</Empty> : (
          <>
            <div className="overflow-x-auto"><table className="tbl">
              <thead><tr><th>{t('Order', 'অর্ডার')}</th><th>{t('Customer', 'গ্রাহক')}</th><th>{t('Items', 'পণ্য')}</th><th>{t('Payment', 'পেমেন্ট')}</th><th>{t('Status', 'স্ট্যাটাস')}</th><th className="text-right">{t('Total', 'মোট')}</th></tr></thead>
              <tbody>{q.data.items.map((o) => (
                <tr key={o.id} data-testid="order-row">
                  <td><Link to={`/orders/${o.id}`} className="font-medium text-primary hover:underline">#{o.orderNo}</Link><div className="text-xs text-muted">{date(o.createdAt, true)}</div></td>
                  <td>{o.customerName}<div className="text-xs text-muted">{o.phone} · {o.district}</div></td>
                  <td>{num(o._count.items)}</td>
                  <td><span>{methodLabel(o.paymentMethod)}</span><div><Pill tone={PAY_TONE[o.paymentStatus]}>{o.paymentStatus.toLowerCase()}</Pill></div></td>
                  <td><Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status][lang === 'bn' ? 1 : 0]}</Pill></td>
                  <td className="text-right">{money(o.total)}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <Pager page={page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => set('page', String(p))} />
          </>
        )}
      </Card>
    </div>
  );
}

interface OrderFull extends OrderRow {
  email: string | null; division: string; area: string; line1: string; zoneName: string | null; deliveryDate: string | null; deliverySlot: string | null; assembly: boolean; notes: string | null;
  subtotal: number; discount: number; deliveryCharge: number; assemblyCharge: number; couponCode: string | null; advancePercent: number | null; trackingToken: string; locale: string;
  items: { id: number; productId: number; nameEn: string; variantName: string | null; sku: string; image: string | null; unitPrice: number; qty: number; lineTotal: number }[];
  history: { id: number; status: OrderStatusCode; note: string | null; actorId: number | null; createdAt: string }[];
  payments: { id: number; provider: string; kind: string; amount: number; status: string; providerRef: string | null; createdAt: string }[];
  user: { id: number; name: string; tier: string } | null; actors: Record<string, string>;
}

export function OrderDetail() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { t, money, date, lang } = usePrefs();
  const { toast } = useUi();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['order', id], queryFn: () => api<OrderFull>(`/admin/orders/${id}`), enabled: can('orders.read') });
  const [to, setTo] = useState<OrderStatusCode | null>(null);
  const [note, setNote] = useState('');
  const [editDelivery, setEditDelivery] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['order', id] }); qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); };
  const move = useMutation({ mutationFn: () => api(`/admin/orders/${id}/status`, { body: { status: to, note: note || undefined } }), onSuccess: () => { toast(t('Status updated', 'স্ট্যাটাস আপডেট হয়েছে')); setTo(null); setNote(''); refresh(); }, onError: (e) => toast((e as Error).message, 'err') });
  if (!can('orders.read')) return <NoAccess />;
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const o = q.data;
  const L = (s: OrderStatusCode) => ORDER_STATUS_LABEL[s][lang === 'bn' ? 1 : 0];
  const next = ORDER_TRANSITIONS[o.status];
  const slot = DELIVERY_SLOTS.find((s) => s.code === o.deliverySlot);
  return (
    <div data-testid="order-detail">
      <PageHeader crumbs={<><Link to="/orders" className="hover:underline">{t('Orders', 'অর্ডার')}</Link> / #{o.orderNo}</>} title={`#${o.orderNo}`} sub={<span className="flex flex-wrap gap-2 items-center">{date(o.createdAt, true)} <Pill tone={ORDER_TONE[o.status]}>{L(o.status)}</Pill><Pill tone={PAY_TONE[o.paymentStatus]}>{o.paymentStatus.toLowerCase()}</Pill></span>}
        actions={<><a className="btn btn-outline btn-sm" href={`/api/v1/admin/orders/${o.id}/invoice`} target="_blank" rel="noreferrer" data-testid="invoice"><Printer className="w-4 h-4" />{t('Invoice', 'চালান')}</a></>} />
      <div className="grid xl:grid-cols-[1fr_380px] gap-4 items-start">
        <div className="space-y-4">
          {can('orders.write') && next.length > 0 && (
            <Card title={t('Move order to', 'অর্ডার সরান')}>
              <div className="flex flex-wrap gap-2">{next.map((s) => <button key={s} type="button" className={`btn btn-sm ${s === 'CANCELLED' || s === 'RETURNED' ? 'btn-outline text-sale' : 'btn-primary'}`} onClick={() => setTo(s)} data-testid={`to-${s}`}>{L(s)}</button>)}</div>
              <p className="hint mt-3">{t('Cancelling returns stock; delivering awards loyalty points. The customer gets an SMS for each step.', 'বাতিলে স্টক ফেরত যায়; ডেলিভারিতে পয়েন্ট যোগ হয়।')}</p>
            </Card>
          )}
          <Card title={t('Items', 'পণ্য')} pad={false}>
            <div className="overflow-x-auto mt-2"><table className="tbl"><tbody>{o.items.map((i) => (
              <tr key={i.id}><td className="w-14">{i.image && <img src={i.image} alt="" className="w-12 h-12 rounded object-cover" />}</td><td><Link to={`/products/${i.productId}`} className="font-medium hover:text-primary">{i.nameEn}</Link><div className="text-xs text-muted">{i.variantName} · {i.sku}</div></td><td className="text-right whitespace-nowrap">{money(i.unitPrice)} × {i.qty}</td><td className="text-right">{money(i.lineTotal)}</td></tr>
            ))}</tbody></table></div>
            <dl className="p-5 text-sm space-y-1.5 max-w-xs ml-auto">
              <div className="flex justify-between"><dt className="text-muted">{t('Subtotal', 'সাবটোটাল')}</dt><dd>{money(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-success"><dt>{t('Discount', 'ছাড়')} {o.couponCode}</dt><dd>−{money(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">{t('Delivery', 'ডেলিভারি')}</dt><dd>{money(o.deliveryCharge)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('Assembly', 'অ্যাসেম্বলি')}</dt><dd>{money(o.assemblyCharge)}</dd></div>
              <div className="flex justify-between font-semibold border-t border-line pt-1.5"><dt>{t('Total', 'মোট')}</dt><dd data-testid="order-total">{money(o.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('Paid', 'পরিশোধিত')}</dt><dd>{money(o.amountPaid)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('Balance', 'বাকি')}</dt><dd>{money(o.total - o.amountPaid)}</dd></div>
            </dl>
          </Card>
          <Card title={t('Payments', 'পেমেন্ট')}>
            {!o.payments.length ? <p className="text-sm text-muted">{o.paymentMethod === 'cod' ? t('Cash on delivery — collected by the delivery team.', 'ক্যাশ অন ডেলিভারি।') : o.paymentMethod === 'bank' ? t('Bank transfer — verify against the statement.', 'ব্যাংক ট্রান্সফার — স্টেটমেন্টে যাচাই করুন।') : '—'}</p> :
              <div className="overflow-x-auto"><table className="tbl"><tbody>{o.payments.map((p) => <tr key={p.id}><td>{methodLabel(p.provider)} · {p.kind}</td><td>{date(p.createdAt, true)}</td><td><code className="text-xs">{p.providerRef}</code></td><td><Pill tone={p.status === 'success' ? 'green' : p.status === 'initiated' ? 'amber' : 'red'}>{p.status}</Pill></td><td className="text-right">{money(p.amount)}</td></tr>)}</tbody></table></div>}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title={t('Customer', 'গ্রাহক')}>
            <p className="font-medium">{o.customerName}</p><p className="text-sm">{o.phone}{o.email ? ` · ${o.email}` : ''}</p>
            {o.user ? <Link className="text-sm text-primary hover:underline" to={`/customers/${o.user.id}`}>{t('View customer', 'গ্রাহক দেখুন')} ({o.user.tier})</Link> : <p className="text-xs text-muted">{t('Guest checkout', 'অতিথি চেকআউট')}</p>}
          </Card>
          <Card title={t('Delivery', 'ডেলিভারি')} action={can('orders.write') && <button type="button" className="text-sm text-primary" onClick={() => setEditDelivery(true)} data-testid="edit-delivery">{t('Edit', 'সম্পাদনা')}</button>}>
            <p className="text-sm">{o.line1}, {o.area}, {o.district}, {o.division}</p>
            <p className="text-sm text-muted mt-1">{o.zoneName}</p>
            <p className="text-sm mt-2" data-testid="delivery-when">{o.deliveryDate ? date(o.deliveryDate) : '—'} · {slot?.en}{o.assembly ? ` · ${t('assembly', 'অ্যাসেম্বলি')}` : ''}</p>
            {o.notes && <p className="text-sm mt-2 bg-surface-2 p-2 rounded">{o.notes}</p>}
            <a className="text-xs text-primary inline-flex items-center gap-1 mt-3" href={`${STORE_URL}/${o.locale}/order/${o.orderNo}?token=${o.trackingToken}`} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3" />{t('Customer tracking page', 'গ্রাহকের ট্র্যাকিং পাতা')}</a>
          </Card>
          <Card title={t('Timeline', 'টাইমলাইন')}>
            <ol className="space-y-3">{[...o.history].reverse().map((h) => <li key={h.id} className="text-sm border-l-2 border-primary pl-3"><p className="font-medium">{L(h.status)}</p><p className="text-xs text-muted">{date(h.createdAt, true)}{h.actorId ? ` · ${o.actors[h.actorId] ?? ''}` : ''}</p>{h.note && <p className="text-xs mt-0.5">{h.note}</p>}</li>)}</ol>
          </Card>
        </div>
      </div>
      {to && (
        <Modal title={`${t('Move to', 'সরান')}: ${L(to)}`} onClose={() => setTo(null)} footer={<><button type="button" className="btn btn-outline" onClick={() => setTo(null)}>{t('Cancel', 'বাতিল')}</button><button type="button" className={`btn ${to === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}`} disabled={move.isPending} onClick={() => move.mutate()} data-testid="confirm-status">{t('Confirm', 'নিশ্চিত করুন')}</button></>}>
          <label htmlFor="st-note" className="label">{t('Note (optional, visible in the timeline)', 'নোট (ঐচ্ছিক)')}</label>
          <textarea id="st-note" className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={320} />
        </Modal>
      )}
      {editDelivery && <DeliveryEdit o={o} onClose={() => setEditDelivery(false)} onSaved={() => { setEditDelivery(false); refresh(); toast(t('Delivery updated', 'ডেলিভারি আপডেট হয়েছে')); }} />}
    </div>
  );
}

function DeliveryEdit({ o, onClose, onSaved }: { o: OrderFull; onClose: () => void; onSaved: () => void }) {
  const { t } = usePrefs();
  const [d, setD] = useState({ deliveryDate: toDhakaInput(o.deliveryDate, false), deliverySlot: o.deliverySlot ?? 'morning', notes: o.notes ?? '' });
  const [err, setErr] = useState('');
  return (
    <Modal title={t('Edit delivery', 'ডেলিভারি সম্পাদনা')} onClose={onClose} footer={<><button type="button" className="btn btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button type="button" className="btn btn-primary" data-testid="save-delivery" onClick={async () => { try { await api(`/admin/orders/${o.id}`, { method: 'PATCH', body: d }); onSaved(); } catch (e) { setErr((e as Error).message); } }}>{t('Save', 'সংরক্ষণ')}</button></>}>
      <div className="space-y-4">
        <div><label htmlFor="dd" className="label">{t('Delivery date', 'ডেলিভারি তারিখ')}</label><input id="dd" type="date" className="input" value={d.deliveryDate} onChange={(e) => setD({ ...d, deliveryDate: e.target.value })} /></div>
        <div><label htmlFor="ds" className="label">{t('Slot', 'সময়')}</label><select id="ds" className="input" value={d.deliverySlot} onChange={(e) => setD({ ...d, deliverySlot: e.target.value })}>{DELIVERY_SLOTS.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}</select></div>
        <div><label htmlFor="dn" className="label">{t('Notes', 'নোট')}</label><textarea id="dn" className="input" rows={3} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} /></div>
        {err && <p className="text-sm text-sale" role="alert">{err}</p>}
      </div>
    </Modal>
  );
}
