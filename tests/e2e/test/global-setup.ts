import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { request } from '@playwright/test';
import { ADMIN, CUSTOMER, STAFF, STORE } from './env';
import { RESOLVED } from './pages';

/** Resolves one real URL per dynamic route (from the sitemap) plus ids the admin pages need. */
export default async function globalSetup() {
  const api = await request.newContext();
  const xml = await (await api.get(`${STORE}/sitemap.xml`)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => p.startsWith('/en/'));
  const first = (prefix: string) => {
    const hit = locs.find((p) => p.startsWith(`/en/${prefix}/`));
    if (!hit) throw new Error(`no sitemap URL for /${prefix}/`);
    return hit.slice(3);
  };
  const out: Record<string, string | number> = {};
  for (const k of ['shop', 'p', 'collections', 'brands', 'projects', 'catalogues', 'journal', 'policy']) out[k] = first(k);
  out.gallery = locs.find((p) => p.startsWith('/en/gallery/'))?.slice(3) ?? '/gallery';

  // customer: an order they own + a public order link with its token
  await api.get(`${STORE}/api/v1/auth/csrf`);
  const csrf = (await api.storageState()).cookies.find((c) => c.name === 'shekor_csrf')!.value;
  const h = { 'x-csrf-token': csrf, origin: STORE };
  await api.post(`${STORE}/api/v1/auth/login`, { headers: h, data: { identifier: CUSTOMER.email, password: CUSTOMER.password } });
  const orders = await (await api.get(`${STORE}/api/v1/account/orders`)).json();
  const o = (orders.items ?? orders)[0];
  out.accountOrder = `/account/orders/${o.orderNo}`;
  const detail = await (await api.get(`${STORE}/api/v1/account/orders/${o.orderNo}`)).json();
  const token = detail.trackingToken ?? detail.order?.trackingToken;
  out.orderPublic = token ? `/order/${o.orderNo}?token=${token}` : `/track`;

  // admin ids
  const csrf2 = (await api.storageState()).cookies.find((c) => c.name === 'shekor_csrf')!.value;
  const al = await api.post(`${ADMIN}/api/v1/admin/auth/login`, { headers: { 'x-csrf-token': csrf2, origin: ADMIN }, data: { identifier: STAFF.email, password: STAFF.password } });
  if (!al.ok()) throw new Error(`admin login failed: ${al.status()} ${await al.text()}`);
  const ao = await (await api.get(`${ADMIN}/api/v1/admin/orders?pageSize=1`)).json();
  const ap = await (await api.get(`${ADMIN}/api/v1/admin/products?pageSize=1`)).json();
  const ac = await (await api.get(`${ADMIN}/api/v1/admin/customers?pageSize=1`)).json();
  out.adminOrderId = ao.items[0].id; out.adminProductId = ap.items[0].id; out.adminCustomerId = ac.items[0].id;
  mkdirSync(dirname(RESOLVED), { recursive: true });
  writeFileSync(RESOLVED, JSON.stringify(out, null, 2));
  await api.dispose();
}
