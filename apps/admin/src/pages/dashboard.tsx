import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, MessageSquare, Package, ShoppingBag, Star, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { ORDER_STATUS_LABEL, type OrderStatusCode } from '@shekor/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, ErrorBox, Loading, ORDER_TONE, PAY_TONE, PageHeader, Pill, Tabs, compactTaka, methodLabel } from '@/components/ui';
import { NAV } from '@/components/layout';

interface Dash {
  rangeDays: number;
  kpis: { revenue: number; revenueChange: number | null; orders: number; ordersChange: number | null; aov: number; newCustomers: number; pendingOrders: number; reviewsPending: number; openLeads: number };
  series: { date: string; revenue: number; orders: number }[];
  byMethod: { method: string; revenue: number; orders: number }[];
  topProducts: { productId: number; name: string; revenue: number; qty: number }[];
  lowStock: { variantId: number; sku: string; product: string; productId: number; variant: string; stockQty: number }[];
  recentOrders: { id: number; orderNo: string; customerName: string; total: number; status: OrderStatusCode; paymentStatus: string; paymentMethod: string; createdAt: string }[];
}
const COLORS = ['#1F4D3A', '#C89B6D', '#7C4A2D', '#2F5D8A', '#9C7148'];

export function Dashboard() {
  const { can, user } = useAuth();
  const { t, money, num, date, lang } = usePrefs();
  const [range, setRange] = useState<'7' | '30' | '90' | '365'>('30');
  const q = useQuery({ queryKey: ['dashboard', Number(range)], queryFn: () => api<Dash>(`/admin/dashboard?range=${range}`), enabled: can('dashboard.read') });
  if (!can('dashboard.read')) {
    const first = NAV.flatMap((g) => g.items).find((i) => can(i.perm));
    return first && first.to !== '/' ? <Navigate to={first.to} replace /> : <p>{t('No sections available for your role.', 'আপনার রোলের জন্য কোনো অংশ নেই।')}</p>;
  }
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const d = q.data;
  const h = Number(new Date(Date.now() + 6 * 3600_000).getUTCHours());
  const greet = h < 12 ? t('Good morning', 'শুভ সকাল') : h < 17 ? t('Good afternoon', 'শুভ অপরাহ্ন') : t('Good evening', 'শুভ সন্ধ্যা');
  const delta = (v: number | null) => v === null ? <span className="text-muted">—</span> : <span className={v >= 0 ? 'text-success' : 'text-sale'}>{v >= 0 ? <TrendingUp className="w-3.5 h-3.5 inline -mt-0.5" /> : <TrendingDown className="w-3.5 h-3.5 inline -mt-0.5" />} {v > 0 ? '+' : ''}{num(v)}%</span>;
  const kpis: [React.ComponentType<{ className?: string }>, string, string, React.ReactNode][] = [
    [Banknote, t('Revenue', 'আয়'), money(d.kpis.revenue), delta(d.kpis.revenueChange)],
    [ShoppingBag, t('Orders', 'অর্ডার'), num(d.kpis.orders), delta(d.kpis.ordersChange)],
    [Package, t('Avg. order value', 'গড় অর্ডার মূল্য'), money(d.kpis.aov), <span className="text-muted">{t(`${d.kpis.pendingOrders} awaiting action`, `${num(d.kpis.pendingOrders)}টি অপেক্ষমাণ`)}</span>],
    [Users, t('New customers', 'নতুন গ্রাহক'), num(d.kpis.newCustomers), <span className="text-muted">{t(`last ${range} days`, `গত ${num(Number(range))} দিন`)}</span>],
  ];
  const totalM = d.byMethod.reduce((a, m) => a + m.orders, 0) || 1;
  const attention: [string, number, string, React.ComponentType<{ className?: string }>][] = [
    [t('Orders awaiting confirmation', 'নিশ্চিতকরণের অপেক্ষায় অর্ডার'), d.kpis.pendingOrders, '/orders?status=PENDING', ShoppingBag],
    [t('Reviews to moderate', 'যাচাইয়ের অপেক্ষায় রিভিউ'), d.kpis.reviewsPending, '/r/reviews?status=pending', Star],
    [t('Open leads (quotes, consultations, trade)', 'খোলা লিড'), d.kpis.openLeads, '/r/quotes?status=new', MessageSquare],
    [t('Low-stock variants', 'স্টক কম'), d.lowStock.length, '/inventory?low=1', Package],
  ];
  return (
    <div data-testid="dashboard">
      <PageHeader crumbs={`${greet}, ${user?.name.split(' ')[0]} · ${date(new Date())}`} title={t('Dashboard', 'ড্যাশবোর্ড')}
        actions={<Tabs value={range} onChange={setRange} items={[['7', t('7D', '৭দি')], ['30', t('30D', '৩০দি')], ['90', t('90D', '৯০দি')], ['365', t('1Y', '১ব')]]} />} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(([Icon, l, v, s]) => <div key={l} className="card p-5"><span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><Icon className="w-5 h-5" /></span><p className="text-sm text-muted mt-4">{l}</p><p className="text-2xl font-semibold mt-1" data-testid="kpi">{v}</p><p className="text-xs mt-1">{s}</p></div>)}
      </div>
      <div className="grid xl:grid-cols-[1fr_360px] gap-4 mt-4">
        <Card title={t('Revenue', 'আয়')}>
          <div className="h-72" role="img" aria-label={t('Revenue over time', 'সময়ের সাথে আয়')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.series} margin={{ left: 8, right: 8, top: 8 }}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1F4D3A" stopOpacity={0.35} /><stop offset="100%" stopColor="#1F4D3A" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickFormatter={compactTaka} width={48} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#1F4D3A" strokeWidth={2} fill="url(#g)" name={t('Revenue', 'আয়')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t('Payment mix', 'পেমেন্ট মিশ্রণ')}>
          <div className="h-48" role="img" aria-label={t('Orders by payment method', 'পেমেন্ট পদ্ধতি অনুযায়ী অর্ডার')}>
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={d.byMethod} dataKey="orders" nameKey="method" innerRadius={50} outerRadius={80} paddingAngle={2}>{d.byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-sm mt-2">{d.byMethod.map((m, i) => <li key={m.method} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="flex-1">{methodLabel(m.method)}</span><span className="text-muted">{num(Math.round((m.orders / totalM) * 100))}%</span></li>)}</ul>
        </Card>
      </div>
      <div className="grid xl:grid-cols-[1fr_360px] gap-4 mt-4">
        <Card title={t('Recent orders', 'সাম্প্রতিক অর্ডার')} action={<Link to="/orders" className="text-sm text-primary hover:underline">{t('View all', 'সব দেখুন')}</Link>} pad={false}>
          <div className="overflow-x-auto mt-2"><table className="tbl"><thead><tr><th>{t('Order', 'অর্ডার')}</th><th>{t('Customer', 'গ্রাহক')}</th><th>{t('Payment', 'পেমেন্ট')}</th><th>{t('Status', 'স্ট্যাটাস')}</th><th className="text-right">{t('Total', 'মোট')}</th></tr></thead>
            <tbody>{d.recentOrders.map((o) => <tr key={o.id}><td><Link to={`/orders/${o.id}`} className="font-medium text-primary">#{o.orderNo}</Link><div className="text-xs text-muted">{date(o.createdAt)}</div></td><td>{o.customerName}</td><td><span>{methodLabel(o.paymentMethod)}</span> <Pill tone={PAY_TONE[o.paymentStatus]}>{o.paymentStatus.toLowerCase()}</Pill></td><td><Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status][lang === 'bn' ? 1 : 0]}</Pill></td><td className="text-right">{money(o.total)}</td></tr>)}</tbody></table></div>
        </Card>
        <div className="space-y-4">
          <Card title={t('Needs attention', 'মনোযোগ প্রয়োজন')}>
            <ul className="divide-y divide-line">{attention.map(([l, n, to, Icon]) => <li key={to}><Link to={to} className="flex items-center gap-3 py-2.5 text-sm hover:text-primary"><span className="w-8 h-8 rounded-lg bg-accent-soft text-accent grid place-items-center"><Icon className="w-4 h-4" /></span><span className="flex-1">{l}</span><strong>{num(n)}</strong></Link></li>)}</ul>
          </Card>
          <Card title={t('Top products', 'শীর্ষ পণ্য')}>
            <ol className="space-y-2 text-sm">{d.topProducts.map((p, i) => <li key={p.productId} className="flex gap-2"><span className="text-muted w-4">{num(i + 1)}</span><Link to={`/products/${p.productId}`} className="flex-1 hover:text-primary truncate">{p.name}</Link><span>{money(p.revenue)}</span></li>)}</ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
