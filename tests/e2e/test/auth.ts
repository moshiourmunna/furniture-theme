import type { BrowserContext } from '@playwright/test';
import { ADMIN, CUSTOMER, STAFF, STORE } from './env';

async function csrf(ctx: BrowserContext, origin: string) {
  await ctx.request.get(`${origin}/api/v1/auth/csrf`);
  const c = (await ctx.cookies(origin)).find((x) => x.name === 'shekor_csrf');
  if (!c) throw new Error('no csrf cookie');
  return c.value;
}
export async function loginCustomer(ctx: BrowserContext) {
  const token = await csrf(ctx, STORE);
  const r = await ctx.request.post(`${STORE}/api/v1/auth/login`, { headers: { 'x-csrf-token': token, origin: STORE }, data: { identifier: CUSTOMER.email, password: CUSTOMER.password } });
  if (!r.ok()) throw new Error(`customer login ${r.status()}`);
}
export async function loginStaff(ctx: BrowserContext, email = STAFF.email) {
  const token = await csrf(ctx, ADMIN);
  const r = await ctx.request.post(`${ADMIN}/api/v1/admin/auth/login`, { headers: { 'x-csrf-token': token, origin: ADMIN }, data: { identifier: email, password: STAFF.password } });
  if (!r.ok()) throw new Error(`staff login ${r.status()}`);
}
