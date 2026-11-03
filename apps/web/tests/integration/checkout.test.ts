import { describe, expect, it } from 'vitest';
import { prisma } from '@shekor/db';
import * as quote from '@/app/api/v1/cart/quote/route';
import * as checkout from '@/app/api/v1/checkout/route';
import * as mockComplete from '@/app/api/v1/payments/mock/complete/route';
import * as retry from '@/app/api/v1/payments/retry/route';
import * as track from '@/app/api/v1/orders/track/route';
import { Client } from './client';

const c = new Client();
const tomorrow = (d = 10) => new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10);

async function inStockLine(minPrice = 0) {
  const v = await prisma.productVariant.findFirstOrThrow({ where: { stockQty: { gte: 5 }, product: { isActive: true, stockStatus: 'IN_STOCK', price: { gte: minPrice } } }, include: { product: true }, orderBy: { id: 'asc' } });
  return { productId: v.productId, variantId: v.id, qty: 1, v };
}
const base = (line: { productId: number; variantId: number; qty: number }, method: string, extra: Record<string, unknown> = {}) => ({
  items: [{ productId: line.productId, variantId: line.variantId, qty: line.qty }],
  customer: { name: 'Integration Tester', phone: '01712345678', email: 'it@shekor.test' },
  address: { division: 'Dhaka', district: 'Dhaka', area: 'Banani', line1: 'House 12, Road 5' },
  deliveryDate: tomorrow(), deliverySlot: 'morning', assembly: true, paymentMethod: method, acceptTerms: true, ...extra,
});
const session = (url: string) => new URL(url, 'http://x').searchParams.get('session')!;

describe('cart quote', () => {
  it('prices lines server-side and applies a coupon', async () => {
    const l = await inStockLine(20000);
    const q = await c.call(quote, 'POST', '/api/v1/cart/quote', { body: { items: [l], couponCode: 'WELCOME10', division: 'Dhaka', district: 'Dhaka' } });
    expect(q.status).toBe(200);
    expect(q.data.totals.subtotal).toBe(l.v.product.price + l.v.priceDelta);
    expect(q.data.totals.discount).toBeGreaterThan(0);
    expect(q.data.coupon.ok).toBe(true);
    const bad = await c.call(quote, 'POST', '/api/v1/cart/quote', { body: { items: [l], couponCode: 'NOPE' } });
    expect(bad.data.coupon?.ok ?? false).toBe(false);
  });
});

describe('checkout + payments', () => {
  it('bKash success marks the order paid, decrements stock and is idempotent', async () => {
    const l = await inStockLine();
    const before = l.v.stockQty;
    const r = await c.call(checkout, 'POST', '/api/v1/checkout', { body: base(l, 'bkash') });
    expect(r.status).toBe(201);
    expect(r.data.redirectUrl).toContain('session=');
    const s = session(r.data.redirectUrl);
    const done = await c.call(mockComplete, 'POST', '/api/v1/payments/mock/complete', { body: { session: s, outcome: 'success' } });
    expect(done.data.status).toBe('success');
    const again = await c.call(mockComplete, 'POST', '/api/v1/payments/mock/complete', { body: { session: s, outcome: 'fail' } });
    expect(again.data.status).toBe('success');
    const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.data.orderNo } });
    expect(o.paymentStatus).toBe('PAID');
    expect(o.status).toBe('CONFIRMED');
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: l.variantId } })).stockQty).toBe(before - 1);
  });
  it('a failed Nagad payment can be retried', async () => {
    const l = await inStockLine();
    const r = await c.call(checkout, 'POST', '/api/v1/checkout', { body: base(l, 'nagad') });
    await c.call(mockComplete, 'POST', '/api/v1/payments/mock/complete', { body: { session: session(r.data.redirectUrl), outcome: 'fail' } });
    expect((await prisma.order.findUniqueOrThrow({ where: { orderNo: r.data.orderNo } })).paymentStatus).toBe('FAILED');
    const rr = await c.call(retry, 'POST', '/api/v1/payments/retry', { body: { orderNo: r.data.orderNo, token: r.data.trackingToken } });
    expect(rr.status).toBe(200);
    expect(rr.data.redirectUrl).toContain('session=');
  });
  it('COD under ৳50,000 needs nothing now; bank transfer awaits payment', async () => {
    const l = await inStockLine();
    const cod = await c.call(checkout, 'POST', '/api/v1/checkout', { body: base(l, 'cod') });
    expect(cod.status).toBe(201);
    if (cod.data.total < 50000) { expect(cod.data.payNow).toBe(0); expect(cod.data.redirectUrl ?? null).toBeNull(); }
    const bank = await c.call(checkout, 'POST', '/api/v1/checkout', { body: base(l, 'bank') });
    expect(bank.status).toBe(201);
    expect((await prisma.order.findUniqueOrThrow({ where: { orderNo: bank.data.orderNo } })).paymentStatus).not.toBe('PAID');
  });
  it('rejects bad input: no terms, past date, unknown product, too many', async () => {
    const l = await inStockLine();
    expect((await c.call(checkout, 'POST', '/api/v1/checkout', { body: { ...base(l, 'bkash'), acceptTerms: false } })).status).toBe(422);
    expect((await c.call(checkout, 'POST', '/api/v1/checkout', { body: base(l, 'bkash', { deliveryDate: '2020-01-01' }) })).status).toBeGreaterThanOrEqual(400);
    expect((await c.call(checkout, 'POST', '/api/v1/checkout', { body: base({ productId: 999999, variantId: 999999, qty: 1 }, 'bkash') })).status).toBeGreaterThanOrEqual(400);
    const r = await c.call(checkout, 'POST', '/api/v1/checkout', { body: base({ ...l, qty: 20 }, 'bkash') });
    if (l.v.stockQty < 20 && l.v.product.stockStatus !== 'MADE_TO_ORDER') expect(r.status).toBeGreaterThanOrEqual(400);
  });
  it('never trusts client prices', async () => {
    const l = await inStockLine();
    const r = await c.call(checkout, 'POST', '/api/v1/checkout', { body: { ...base(l, 'bank'), price: 1, total: 1, items: [{ ...l, v: undefined, price: 1 }] } });
    expect(r.status).toBe(201);
    expect(r.data.total).toBeGreaterThan(1000);
  });
  it('tracks an order by number + phone, hiding the token', async () => {
    const l = await inStockLine();
    const r = await c.call(checkout, 'POST', '/api/v1/checkout', { body: base(l, 'cod') });
    const t = await c.call(track, 'GET', `/api/v1/orders/track?orderNo=${r.data.orderNo}&phone=01712345678`);
    expect(t.status).toBe(200);
    expect(t.data.trackingToken).toBeUndefined();
    expect((await c.call(track, 'GET', `/api/v1/orders/track?orderNo=${r.data.orderNo}&phone=01800000000`)).status).toBe(404);
  });
});
