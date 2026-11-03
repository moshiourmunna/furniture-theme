import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@shekor/db';
import * as adminLogin from '@/app/api/v1/admin/auth/login/route';
import * as adminMe from '@/app/api/v1/admin/auth/me/route';
import * as adminProducts from '@/app/api/v1/admin/products/route';
import * as adminProduct from '@/app/api/v1/admin/products/[id]/route';
import * as orderStatus from '@/app/api/v1/admin/orders/[id]/status/route';
import * as resList from '@/app/api/v1/admin/r/[resource]/route';
import * as resOne from '@/app/api/v1/admin/r/[resource]/[id]/route';
import * as staff from '@/app/api/v1/admin/staff/route';
import * as reports from '@/app/api/v1/admin/reports/route';
import * as dashboard from '@/app/api/v1/admin/dashboard/route';
import * as inventory from '@/app/api/v1/admin/inventory/route';
import * as storeProducts from '@/app/api/v1/products/route';
import * as login from '@/app/api/v1/auth/login/route';
import { Client } from './client';
import { productInput } from '@/server/admin/products';
const productInputKeys = productInput.shape;

const admin = new Client();
/** Builds a full product payload from the admin GET (PUT replaces the product, like the admin form). */
async function productBody(id: number, patch: Record<string, unknown>) {
  const g = await admin.call(adminProduct, 'GET', `/api/v1/admin/products/${id}`, { params: { id: String(id) } });
  const p = g.data;
  const keys = Object.keys(productInputKeys);
  const body: Record<string, unknown> = {};
  for (const k of keys) if (p[k] !== undefined) body[k] = p[k];
  body.images = (p.images ?? []).map((i: { url: string }) => ({ url: i.url }));
  body.variants = (p.variants ?? []).map((v: Record<string, unknown>) => ({ id: v.id, sku: v.sku, nameEn: v.nameEn, nameBn: v.nameBn, optionType: v.optionType, swatchHex: v.swatchHex, priceDelta: v.priceDelta, stockQty: v.stockQty, lowStockAt: v.lowStockAt, isDefault: v.isDefault }));
  return { ...body, ...patch };
}
const as = async (email: string) => {
  const c = new Client();
  const r = await c.call(adminLogin, 'POST', '/api/v1/admin/auth/login', { body: { identifier: email, password: 'Shekor@2026' } });
  expect(r.status).toBe(200);
  return c;
};

beforeAll(async () => {
  const r = await admin.call(adminLogin, 'POST', '/api/v1/admin/auth/login', { body: { identifier: 'admin@shekor.com.bd', password: 'Shekor@2026' } });
  expect(r.status).toBe(200);
});

describe('admin auth + RBAC', () => {
  it('signed-out me is null; customers cannot use admin login', async () => {
    const c = new Client();
    expect((await c.call(adminMe, 'GET', '/api/v1/admin/auth/me')).data.user).toBeNull();
    expect((await c.call(adminLogin, 'POST', '/api/v1/admin/auth/login', { body: { identifier: 'customer@shekor.test', password: 'Customer@2026' } })).status).toBe(401);
    expect((await c.call(adminProducts, 'GET', '/api/v1/admin/products')).status).toBe(401);
  });
  it('a store session is not an admin session', async () => {
    const c = new Client();
    await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: 'customer@shekor.test', password: 'Customer@2026' } });
    expect((await c.call(adminProducts, 'GET', '/api/v1/admin/products')).status).toBe(401);
  });
  it('enforces permissions per role', async () => {
    const content = await as('content@shekor.com.bd');
    expect((await content.call(resList, 'GET', '/api/v1/admin/r/faqs', { params: { resource: 'faqs' } })).status).toBe(200);
    expect((await content.call(staff, 'GET', '/api/v1/admin/staff')).status).toBe(403);
    expect((await content.call(orderStatus, 'POST', '/api/v1/admin/orders/1/status', { params: { id: '1' }, body: { status: 'CANCELLED' } })).status).toBe(403);
    const accounts = await as('accounts@shekor.com.bd');
    expect((await accounts.call(reports, 'GET', '/api/v1/admin/reports')).status).toBe(200);
    expect((await accounts.call(adminProducts, 'POST', '/api/v1/admin/products', { body: {} })).status).toBe(403);
  });
});

describe('admin writes persist to the storefront', () => {
  it('price change is visible in the public API; archived product disappears', async () => {
    const p = await prisma.product.findFirstOrThrow({ where: { isActive: true }, orderBy: { id: 'desc' } });
    const r = await admin.call(adminProduct, 'PUT', `/api/v1/admin/products/${p.id}`, { params: { id: String(p.id) }, body: await productBody(p.id, { price: p.price + 1111 }) });
    expect(r.status, JSON.stringify(r.data)).toBe(200);
    const pub = await admin.call(storeProducts, 'GET', `/api/v1/products?ids=${p.id}`);
    expect(pub.data.items[0].price).toBe(p.price + 1111);
    await admin.call(adminProduct, 'PUT', `/api/v1/admin/products/${p.id}`, { params: { id: String(p.id) }, body: await productBody(p.id, { isActive: false }) });
    expect((await admin.call(storeProducts, 'GET', `/api/v1/products?ids=${p.id}`)).data.items).toHaveLength(0);
    await admin.call(adminProduct, 'PUT', `/api/v1/admin/products/${p.id}`, { params: { id: String(p.id) }, body: await productBody(p.id, { isActive: true, price: p.price }) });
  });
  it('generic resource CRUD with validation errors', async () => {
    const bad = await admin.call(resList, 'POST', '/api/v1/admin/r/faqs', { params: { resource: 'faqs' }, body: { questionEn: '' } });
    expect(bad.status).toBe(422);
    expect(bad.data.error.fields ?? bad.data.error.details?.fields).toBeTruthy();
    const made = await admin.call(resList, 'POST', '/api/v1/admin/r/faqs', { params: { resource: 'faqs' }, body: { groupEn: 'Orders', groupBn: 'অর্ডার', questionEn: 'IT question?', questionBn: 'প্রশ্ন?', answerEn: 'Yes', answerBn: 'হ্যাঁ', isActive: true } });
    expect(made.status).toBe(201);
    const id = String(made.data.id);
    expect((await admin.call(resOne, 'PUT', `/api/v1/admin/r/faqs/${id}`, { params: { resource: 'faqs', id }, body: { answerEn: 'Yes, always' } })).data.answerEn).toBe('Yes, always');
    expect((await admin.call(resOne, 'DELETE', `/api/v1/admin/r/faqs/${id}`, { params: { resource: 'faqs', id } })).status).toBe(200);
    expect((await admin.call(resOne, 'GET', `/api/v1/admin/r/faqs/${id}`, { params: { resource: 'faqs', id } })).status).toBe(404);
    expect((await admin.call(resList, 'GET', '/api/v1/admin/r/nope', { params: { resource: 'nope' } })).status).toBe(404);
  });
  it('rich text is sanitized on save', async () => {
    const page = await prisma.page.findFirstOrThrow();
    const id = String(page.id);
    const r = await admin.call(resOne, 'PUT', `/api/v1/admin/r/pages/${id}`, { params: { resource: 'pages', id }, body: { bodyEn: '<p>Hi</p><script>alert(1)</script><img src=x onerror=alert(1)>' } });
    expect(r.status).toBe(200);
    const saved = await prisma.page.findUniqueOrThrow({ where: { id: page.id } });
    expect(saved.bodyEn).not.toMatch(/script|onerror/);
    await prisma.page.update({ where: { id: page.id }, data: { bodyEn: page.bodyEn } });
  });
});

describe('order workflow + inventory + audit', () => {
  it('only allows valid transitions and writes the audit log', async () => {
    const o = await prisma.order.findFirstOrThrow({ where: { status: 'PENDING' } });
    const id = String(o.id);
    expect((await admin.call(orderStatus, 'POST', `/api/v1/admin/orders/${id}/status`, { params: { id }, body: { status: 'DELIVERED' } })).status).toBeGreaterThanOrEqual(400);
    const ok = await admin.call(orderStatus, 'POST', `/api/v1/admin/orders/${id}/status`, { params: { id }, body: { status: 'CONFIRMED', note: 'IT' } });
    expect(ok.status).toBe(200);
    expect(await prisma.auditLog.count({ where: { entity: 'order', entityId: String(o.id) } })).toBeGreaterThan(0);
  });
  it('cancelling returns stock', async () => {
    const o = await prisma.order.findFirstOrThrow({ where: { status: 'PENDING', items: { some: { variant: { product: { stockStatus: { not: 'MADE_TO_ORDER' } } } } } }, include: { items: { include: { variant: { include: { product: true } } } } } });
    const it0 = o.items.find((i) => i.variant && i.variant.product.stockStatus !== 'MADE_TO_ORDER')!;
    const before = (await prisma.productVariant.findUniqueOrThrow({ where: { id: it0.variantId! } })).stockQty;
    await admin.call(orderStatus, 'POST', `/api/v1/admin/orders/${o.id}/status`, { params: { id: String(o.id) }, body: { status: 'CANCELLED' } });
    const after = (await prisma.productVariant.findUniqueOrThrow({ where: { id: it0.variantId! } })).stockQty;
    expect(after).toBe(before + o.items.filter((i) => i.variantId === it0.variantId).reduce((s, i) => s + i.qty, 0));
  });
  it('inventory adjust and dashboard/report shapes', async () => {
    const v = await prisma.productVariant.findFirstOrThrow();
    const r = await admin.call(inventory, 'POST', '/api/v1/admin/inventory', { body: { variantId: v.id, delta: 3, reason: 'restock' } });
    expect(r.status).toBe(200);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: v.id } })).stockQty).toBe(v.stockQty + 3);
    const d = await admin.call(dashboard, 'GET', '/api/v1/admin/dashboard?range=30');
    expect(d.data.kpis).toBeTruthy();
    const csv = await admin.call(reports, 'GET', '/api/v1/admin/reports?format=csv');
    expect(csv.headers.get('content-type')).toContain('text/csv');
  });
});
