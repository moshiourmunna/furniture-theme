import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { api, qs } from '@/lib/api';
import { toDhakaInput } from '@/lib/form';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, ErrorBox, Loading, PageHeader, Pill, ORDER_TONE, compactTaka } from '@/components/ui';
import { NoAccess } from '@/components/layout';

interface Report { totals: { revenue: number; discount: number; delivery: number; orders: number }; byCategory: { category: string; revenue: number; qty: number }[]; byZone: { zone: string; revenue: number; orders: number }[]; byStatus: { status: string; orders: number }[]; coupons: { code: string; orders: number; discount: number; revenue: number }[] }

export function Reports() {
  const { can } = useAuth();
  const { t, money, num } = usePrefs();
  const [from, setFrom] = useState(() => toDhakaInput(new Date(Date.now() - 90 * 86400_000), false));
  const [to, setTo] = useState(() => toDhakaInput(new Date(), false));
  const q = useQuery({ queryKey: ['reports', from, to], queryFn: () => api<Report>(`/admin/reports${qs({ from, to })}`), enabled: can('reports.read') });
  if (!can('reports.read')) return <NoAccess />;
  return (
    <div data-testid="reports">
      <PageHeader title={t('Reports', 'রিপোর্ট')} actions={<>
        <label className="sr-only" htmlFor="rf">From</label><input id="rf" type="date" className="input w-auto" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        <label className="sr-only" htmlFor="rt">To</label><input id="rt" type="date" className="input w-auto" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        <a className="btn btn-outline btn-sm h-10" href={`/api/v1/admin/reports${qs({ from, to, format: 'csv' })}`} data-testid="report-csv"><Download className="w-4 h-4" />CSV</a>
      </>} />
      {q.isLoading ? <Loading /> : q.error || !q.data ? <ErrorBox error={q.error} /> : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-4">{([[t('Revenue', 'আয়'), money(q.data.totals.revenue)], [t('Orders', 'অর্ডার'), num(q.data.totals.orders)], [t('Discounts', 'ছাড়'), money(q.data.totals.discount)], [t('Delivery charged', 'ডেলিভারি চার্জ'), money(q.data.totals.delivery)]] as const).map(([l, v]) => <div key={l} className="card p-5"><p className="text-sm text-muted">{l}</p><p className="text-2xl font-semibold mt-1">{v}</p></div>)}</div>
          <Card title={t('Revenue by category', 'ক্যাটাগরি অনুযায়ী আয়')}>
            <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={q.data.byCategory} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickFormatter={compactTaka} /><YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12, fill: 'rgb(var(--ink))' }} /><Tooltip formatter={(v) => money(Number(v))} /><Bar dataKey="revenue" fill="#1F4D3A" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
          </Card>
          <div className="grid lg:grid-cols-3 gap-4">
            <Card title={t('By delivery zone', 'জোন অনুযায়ী')}><table className="tbl"><tbody>{q.data.byZone.map((z) => <tr key={z.zone}><td>{z.zone}</td><td className="text-right">{num(z.orders)}</td><td className="text-right">{money(z.revenue)}</td></tr>)}</tbody></table></Card>
            <Card title={t('By status', 'স্ট্যাটাস অনুযায়ী')}><ul className="space-y-2 text-sm">{q.data.byStatus.map((s) => <li key={s.status} className="flex justify-between"><Pill tone={ORDER_TONE[s.status]}>{s.status.replace(/_/g, ' ').toLowerCase()}</Pill><span>{num(s.orders)}</span></li>)}</ul></Card>
            <Card title={t('Coupons', 'কুপন')}>{q.data.coupons.length ? <table className="tbl"><tbody>{q.data.coupons.map((c) => <tr key={c.code}><td><code className="text-xs">{c.code}</code></td><td className="text-right">{num(c.orders)}</td><td className="text-right text-sale">−{money(c.discount)}</td></tr>)}</tbody></table> : <p className="text-sm text-muted">{t('No coupon use in this period.', 'এই সময়ে কোনো কুপন ব্যবহার হয়নি।')}</p>}</Card>
          </div>
        </div>
      )}
    </div>
  );
}
