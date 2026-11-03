import { beforeAll, describe, expect, it } from 'vitest';
import * as adminLogin from '@/app/api/v1/admin/auth/login/route';
import * as resList from '@/app/api/v1/admin/r/[resource]/route';
import * as resOne from '@/app/api/v1/admin/r/[resource]/[id]/route';
import * as lookups from '@/app/api/v1/admin/lookups/route';
import { RESOURCES } from '@/server/admin/resources';
import { Client } from './client';

const admin = new Client();
beforeAll(async () => {
  expect((await admin.call(adminLogin, 'POST', '/api/v1/admin/auth/login', { body: { identifier: 'admin@shekor.com.bd', password: 'Shekor@2026' } })).status).toBe(200);
});

describe('every admin resource lists and reads', () => {
  it.each(Object.keys(RESOURCES))('%s', async (resource) => {
    const list = await admin.call(resList, 'GET', `/api/v1/admin/r/${resource}?page=1`, { params: { resource } });
    expect(list.status, JSON.stringify(list.data)).toBe(200);
    expect(list.data).toMatchObject({ page: 1 });
    expect(Array.isArray(list.data.items)).toBe(true);
    if (list.data.items[0]) {
      const id = String(list.data.items[0].id);
      const one = await admin.call(resOne, 'GET', `/api/v1/admin/r/${resource}/${id}`, { params: { resource, id } });
      expect(one.status).toBe(200);
    }
  });
  it('lookups feed the admin selects', async () => {
    const r = await admin.call(lookups, 'GET', '/api/v1/admin/lookups');
    expect(r.data.categories.length).toBeGreaterThan(0);
  });
});
