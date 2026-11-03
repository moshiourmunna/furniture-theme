import 'server-only';
import { prisma } from '@shekor/db';

const DAY = 86400_000;
const dhakaDay = (d: Date) => new Date(d.getTime() + 6 * 3600_000).toISOString().slice(0, 10);

/** Dashboard KPIs computed live from orders (excluding cancelled/returned). */
export async function dashboard(rangeDays = 30) {
  const now = Date.now();
  const from = new Date(now - rangeDays * DAY);
  const prevFrom = new Date(now - 2 * rangeDays * DAY);
  const valid = { status: { notIn: ['CANCELLED', 'RETURNED'] as ('CANCELLED' | 'RETURNED')[] } };
  const [cur, prev, orders, pending, lowStock, newCustomers, reviewsPending, leads, recent, byMethod, topItems] = await Promise.all([
    prisma.order.aggregate({ where: { ...valid, createdAt: { gte: from } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...valid, createdAt: { gte: prevFrom, lt: from } }, _sum: { total: true }, _count: true }),
    prisma.order.findMany({ where: { ...valid, createdAt: { gte: from } }, select: { createdAt: true, total: true } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.productVariant.findMany({ where: { product: { stockStatus: { not: 'MADE_TO_ORDER' }, isActive: true }, stockQty: { lte: 3 } }, include: { product: { select: { nameEn: true, id: true } } }, take: 8, orderBy: { stockQty: 'asc' } }),
    prisma.user.count({ where: { kind: 'CUSTOMER', createdAt: { gte: from } } }),
    prisma.review.count({ where: { status: 'pending' } }),
    Promise.all([
      prisma.customOrderRequest.count({ where: { status: 'new' } }),
      prisma.consultationBooking.count({ where: { status: 'requested' } }),
      prisma.tradeInquiry.count({ where: { status: 'new' } }),
    ]),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, orderNo: true, customerName: true, total: true, status: true, paymentStatus: true, paymentMethod: true, createdAt: true } }),
    prisma.order.groupBy({ by: ['paymentMethod'], where: { ...valid, createdAt: { gte: from } }, _sum: { total: true }, _count: true }),
    prisma.orderItem.groupBy({ by: ['productId', 'nameEn'], where: { order: { ...valid, createdAt: { gte: from } } }, _sum: { lineTotal: true, qty: true }, orderBy: { _sum: { lineTotal: 'desc' } }, take: 5 }),
  ]);
  const series: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = rangeDays - 1; i >= 0; i--) { const d = dhakaDay(new Date(now - i * DAY)); series[d] = { date: d, revenue: 0, orders: 0 }; }
  for (const o of orders) { const d = dhakaDay(o.createdAt); if (series[d]) { series[d].revenue += o.total; series[d].orders++; } }
  const revenue = cur._sum.total ?? 0;
  const prevRevenue = prev._sum.total ?? 0;
  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);
  return {
    rangeDays,
    kpis: {
      revenue, revenueChange: pct(revenue, prevRevenue), orders: cur._count, ordersChange: pct(cur._count, prev._count),
      aov: cur._count ? Math.round(revenue / cur._count) : 0, newCustomers, pendingOrders: pending, reviewsPending,
      openLeads: leads[0] + leads[1] + leads[2],
    },
    series: Object.values(series),
    byMethod: byMethod.map((m) => ({ method: m.paymentMethod, revenue: m._sum.total ?? 0, orders: m._count })),
    topProducts: topItems.map((t) => ({ productId: t.productId, name: t.nameEn, revenue: t._sum.lineTotal ?? 0, qty: t._sum.qty ?? 0 })),
    lowStock: lowStock.map((v) => ({ variantId: v.id, sku: v.sku, product: v.product.nameEn, productId: v.product.id, variant: v.nameEn, stockQty: v.stockQty })),
    recentOrders: recent,
  };
}

export async function salesReport(from: Date, to: Date) {
  const where = { status: { notIn: ['CANCELLED', 'RETURNED'] as ('CANCELLED' | 'RETURNED')[] }, createdAt: { gte: from, lte: to } };
  const [byCategory, byZone, byStatus, coupons, totals] = await Promise.all([
    prisma.$queryRaw<{ category: string; revenue: bigint | number; qty: bigint | number }[]>`
      SELECT c.nameEn AS category, SUM(oi.lineTotal) AS revenue, SUM(oi.qty) AS qty
      FROM OrderItem oi JOIN \`Order\` o ON o.id = oi.orderId JOIN Product p ON p.id = oi.productId JOIN Category c ON c.id = p.categoryId
      WHERE o.status NOT IN ('CANCELLED','RETURNED') AND o.createdAt BETWEEN ${from} AND ${to}
      GROUP BY c.nameEn ORDER BY revenue DESC`,
    prisma.order.groupBy({ by: ['zoneName'], where, _sum: { total: true }, _count: true }),
    prisma.order.groupBy({ by: ['status'], where: { createdAt: { gte: from, lte: to } }, _count: true }),
    prisma.order.groupBy({ by: ['couponCode'], where: { ...where, couponCode: { not: null } }, _sum: { discount: true, total: true }, _count: true }),
    prisma.order.aggregate({ where, _sum: { total: true, discount: true, deliveryCharge: true }, _count: true }),
  ]);
  return {
    from, to,
    totals: { revenue: totals._sum.total ?? 0, discount: totals._sum.discount ?? 0, delivery: totals._sum.deliveryCharge ?? 0, orders: totals._count },
    byCategory: byCategory.map((r) => ({ category: r.category, revenue: Number(r.revenue), qty: Number(r.qty) })),
    byZone: byZone.map((z) => ({ zone: z.zoneName ?? '—', revenue: z._sum.total ?? 0, orders: z._count })),
    byStatus: byStatus.map((s) => ({ status: s.status, orders: s._count })),
    coupons: coupons.map((c) => ({ code: c.couponCode, orders: c._count, discount: c._sum.discount ?? 0, revenue: c._sum.total ?? 0 })),
  };
}
