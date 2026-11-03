import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures';
import { ADMIN, STAFF, STORE } from './env';
import { RESOLVED } from './pages';
import type { Page } from '@playwright/test';

const R = () => JSON.parse(readFileSync(RESOLVED, 'utf8')) as Record<string, string>;
async function signIn(page: Page, email = STAFF.email) {
  await page.goto(`${ADMIN}/login`);
  await page.fill('#identifier', email); await page.fill('#password', STAFF.password);
  await page.getByTestId('admin-login-submit').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}
const toast = (page: Page) => page.getByTestId('toast').first();

test.describe.configure({ mode: 'serial' });

test('login validation and redirect back to the requested page', async ({ page, guard }) => {
  void guard;
  await page.goto(`${ADMIN}/orders`);
  await page.waitForURL(/\/login\?next=%2Forders/);
  await page.fill('#identifier', STAFF.email); await page.fill('#password', 'nope-Wrong1');
  await page.getByTestId('admin-login-submit').click();
  await expect(page.getByTestId('admin-login-error')).toBeVisible();
  await page.fill('#password', STAFF.password); await page.getByTestId('admin-login-submit').click();
  await page.waitForURL(/\/orders$/);
  await expect(page.getByTestId('orders')).toBeVisible();
});

test('product price edit shows on the storefront, then reverts', async ({ page, guard, context }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/products/${R().adminProductId}`);
  const price = page.locator('#p-price');
  const old = await price.inputValue();
  const next = String(Number(old) + 1500);
  await price.fill(next);
  await page.getByTestId('product-save').click();
  await expect(toast(page)).toContainText(/saved/i);
  const slug = await page.locator('a', { hasText: /View on store/ }).getAttribute('href');
  const store = await context.newPage();
  await store.goto(slug!.replace(/^https?:\/\/[^/]+/, STORE));
  await expect(store.getByTestId('pdp-price')).toContainText(Number(next).toLocaleString('en-IN'));
  await store.close();
  await expect(page.getByTestId('product-save')).toBeDisabled();
  await price.fill(old);
  await page.getByTestId('product-save').click();
  await expect(page.getByTestId('product-save')).toBeDisabled();
});

test('product create (validation on the Bangla tab) and delete', async ({ page, guard }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/products/new`);
  await page.fill('#p-nameEn', 'E2E Stool');
  await page.getByTestId('product-save').click();
  await expect(page.locator('#p-nameBn')).toBeVisible(); // jumped to the BN tab with the error
  await page.fill('#p-nameBn', 'ই২ই টুল');
  await page.fill('#p-sku', `E2E-${Date.now() % 100000}`); await page.fill('#p-price', '5500');
  await page.locator('#p-categoryId').selectOption({ index: 1 });
  await page.getByTestId('variant-row').first().locator('input').first().fill(`E2E-V-${Date.now() % 100000}`);
  await page.getByTestId('product-save').click();
  await page.waitForURL(/\/products\/\d+$/);
  await page.getByTestId('product-delete').click(); await page.getByTestId('confirm-ok').click();
  await page.waitForURL(/\/products$/);
});

test('order status transition with note, delivery edit and invoice', async ({ page, guard }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/orders`);
  await page.getByTestId('status-chip-PENDING').click();
  await page.getByTestId('order-row').first().locator('a').first().click();
  await expect(page.getByTestId('order-detail')).toBeVisible();
  await page.getByTestId('to-CONFIRMED').click();
  await page.fill('#st-note', 'Confirmed by e2e');
  await page.getByTestId('confirm-status').click();
  await expect(toast(page)).toContainText(/updated/i);
  await expect(page.getByTestId('order-detail')).toContainText('Confirmed by e2e');
  const [pop] = await Promise.all([page.waitForEvent('popup'), page.getByTestId('invoice').click()]);
  await expect(pop.locator('body')).toContainText(/Invoice|Shekor/);
  await pop.close();
});

test('inventory adjust, customer points, coupon, settings, CSV, media upload', async ({ page, guard }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/inventory`);
  await page.getByTestId('adjust').first().click();
  await page.locator('[role=dialog] input[type=number]').first().fill('1');
  await page.getByTestId('adjust-save').click();
  await expect(toast(page)).toContainText(/updated/i);

  await page.goto(`${ADMIN}/customers/${R().adminCustomerId}`);
  const pts = page.getByTestId('points');
  const before = await pts.textContent();
  await page.fill('#pa', '10'); await page.fill('#pr', 'e2e');
  await page.getByTestId('points-save').click();
  await expect(pts).not.toHaveText(before ?? '');

  await page.goto(`${ADMIN}/r/coupons/1`);
  const md = page.getByLabel('Max discount (৳)');
  const old = await md.inputValue();
  await md.fill(String(Number(old) + 1)); await page.getByTestId('resource-save').click();
  await expect(toast(page)).toContainText(/saved/i);
  await expect(page.getByTestId('resource-save')).toBeDisabled();
  await md.fill(old);
  await expect(page.getByTestId('resource-save')).toBeEnabled();
  await page.getByTestId('resource-save').click();
  await expect(page.getByTestId('resource-save')).toHaveText(/Save changes/);
  await expect(page.getByTestId('resource-save')).toBeDisabled();

  await page.goto(`${ADMIN}/settings`);
  const f = page.locator('[data-testid^=setting-]').first();
  const v = await f.inputValue(); await f.fill(`${v} `); await f.fill(v);
  await page.getByTestId('settings-save').click();
  await expect(toast(page)).toContainText(/saved/i);

  await page.goto(`${ADMIN}/reports`);
  // Check the CSV link's response rather than the download event, which headless WebKit doesn't emit for attachments.
  const href = await page.getByTestId('report-csv').getAttribute('href');
  const csv = await page.request.get(new URL(href!, ADMIN).toString());
  expect(csv.ok()).toBe(true);
  expect(csv.headers()['content-disposition']).toMatch(/attachment; filename=".+\.csv"/);

  await page.goto(`${ADMIN}/media-library`);
  await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('../../../apps/web/public/brand/shekor-appicon-green-192.png', import.meta.url)));
  await expect(toast(page)).toContainText(/Upload complete/i);
});

test('FAQ create → visible on store → delete → gone', async ({ page, guard, context }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/r/faqs/new`);
  const q = `E2E: do you deliver to Sylhet ${Date.now() % 10000}?`;
  await page.getByLabel(/^Group \(EN\)/).fill('Delivery'); await page.getByLabel(/^Group \(বাংলা\)/).fill('ডেলিভারি');
  await page.getByLabel(/^Question \(EN\)/).fill(q); await page.getByLabel(/^Question \(বাংলা\)/).fill('সিলেটে ডেলিভারি?');
  await page.getByLabel(/^Answer \(EN\)/).fill('Yes.'); await page.getByLabel(/^Answer \(বাংলা\)/).fill('হ্যাঁ।');
  await page.getByTestId('resource-save').click();
  await page.waitForURL(/\/r\/faqs\/\d+$/);
  const store = await context.newPage();
  // Storefront pages are ISR (stale-while-revalidate after an admin write); the API warms them, so allow a few seconds.
  const faqText = async () => { await store.goto(`${STORE}/en/faq`); return (await store.locator('main').textContent()) ?? ''; };
  await expect.poll(faqText, { timeout: 15_000, intervals: [500, 1000, 2000] }).toContain(q);
  await page.getByTestId('resource-delete').click(); await page.getByTestId('confirm-ok').click();
  await page.waitForURL(/\/r\/faqs$/);
  await expect.poll(faqText, { timeout: 15_000, intervals: [500, 1000, 2000] }).not.toContain(q);
  await store.close();
});

test('banner edit shows on the home page', async ({ page, guard, context }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/r/banners/1`);
  const f = page.getByLabel(/^Title \(EN\)/);
  const old = await f.inputValue();
  await f.fill(`${old} (E2E)`); await page.getByTestId('resource-save').click();
  await expect(toast(page)).toContainText(/saved/i);
  await expect(page.getByTestId('resource-save')).toBeDisabled();
  const store = await context.newPage();
  const home = async () => { await store.goto(`${STORE}/en`); return (await store.locator('body').textContent()) ?? ''; };
  await expect.poll(home, { timeout: 15_000, intervals: [500, 1000, 2000] }).toContain(`${old} (E2E)`);
  await store.close();
  await f.fill(old); await expect(page.getByTestId('resource-save')).toBeEnabled();
  await page.getByTestId('resource-save').click();
  await expect(page.getByTestId('resource-save')).toHaveText(/Save changes/);
  await expect(page.getByTestId('resource-save')).toBeDisabled();
});

test('staff create and role-based navigation', async ({ page, guard }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/staff`);
  await page.getByRole('button', { name: /add staff|new/i }).first().click();
  const m = page.locator('[role=dialog]');
  await m.getByLabel(/name/i).first().fill('E2E Staff');
  await m.getByLabel(/email/i).fill(`e2e${Date.now()}@shekor.com.bd`);
  await m.getByLabel(/password/i).fill('E2eStaff@2026');
  await m.locator('select').first().selectOption({ index: 1 });
  await m.getByRole('button', { name: /save|create/i }).click();
  await expect(toast(page)).toContainText(/saved/i);
  await page.getByTestId('admin-logout').click();
  await signIn(page, 'content@shekor.com.bd');
  await expect(page.locator('aside nav')).not.toContainText('Orders');
  await page.goto(`${ADMIN}/staff`);
  await expect(page.locator('main')).toContainText(/don.t have access/i);
});

test('dark mode + Bangla persist across reloads', async ({ page, guard }) => {
  void guard;
  await signIn(page);
  await page.goto(`${ADMIN}/`);
  const wasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.getByTestId('admin-theme').click(); await page.getByTestId('admin-lang').click();
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(!wasDark);
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  await expect(page.getByTestId('dashboard')).toContainText(/ড্যাশবোর্ড/);
  await page.getByTestId('admin-theme').click(); await page.getByTestId('admin-lang').click();
});
