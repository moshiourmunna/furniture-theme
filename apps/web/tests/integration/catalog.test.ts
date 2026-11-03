import { describe, expect, it } from 'vitest';
import { prisma } from '@shekor/db';
import * as products from '@/app/api/v1/products/route';
import * as product from '@/app/api/v1/products/[slug]/route';
import * as suggest from '@/app/api/v1/search/suggest/route';
import * as taxonomy from '@/app/api/v1/taxonomy/route';
import * as health from '@/app/api/v1/health/route';
import { Client } from './client';

const c = new Client();

describe('catalogue API (real MySQL)', () => {
  it('health reports the database is up', async () => {
    const r = await c.call(health, 'GET', '/api/v1/health');
    expect(r.status).toBe(200);
  });
  it('lists active products with pagination and facets', async () => {
    const r = await c.call(products, 'GET', '/api/v1/products?pageSize=12&facets=1');
    expect(r.status).toBe(200);
    expect(r.data.items).toHaveLength(12);
    expect(r.data.total).toBe(await prisma.product.count({ where: { isActive: true } }));
    expect(r.data.facets).toBeTruthy();
  });
  it('filters by price and sorts ascending', async () => {
    const r = await c.call(products, 'GET', '/api/v1/products?minPrice=20000&maxPrice=60000&sort=price-asc&pageSize=48');
    const prices: number[] = r.data.items.map((p: { price: number }) => p.price);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices.every((p) => p >= 20000 && p <= 60000)).toBe(true);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });
  it('returns a product by slug and 404s unknown slugs', async () => {
    const p = await prisma.product.findFirstOrThrow({ where: { isActive: true } });
    const ok = await c.call(product, 'GET', `/api/v1/products/${p.slug}`, { params: { slug: p.slug } });
    expect(ok.status).toBe(200);
    expect(ok.data.product?.nameEn ?? ok.data.nameEn).toBe(p.nameEn);
    const missing = await c.call(product, 'GET', '/api/v1/products/nope', { params: { slug: 'nope-not-here' } });
    expect(missing.status).toBe(404);
  });
  it('search suggest matches English and Bangla names', async () => {
    const en = await c.call(suggest, 'GET', '/api/v1/search/suggest?q=sofa');
    expect(en.status).toBe(200);
    expect(JSON.stringify(en.data).toLowerCase()).toContain('sofa');
  });
  it('taxonomy has categories, rooms and materials', async () => {
    const r = await c.call(taxonomy, 'GET', '/api/v1/taxonomy');
    expect(r.status).toBe(200);
    expect(r.data.categories.length).toBeGreaterThan(5);
  });
});
