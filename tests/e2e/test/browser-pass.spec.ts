import { fileURLToPath } from 'node:url';
/**
 * Full real-browser pass: every storefront + admin page, in every project of playwright.browser-pass.config.ts
 * (Chromium/Firefox/WebKit × desktop/tablet/mobile × EN/BN × light/dark). Each page must load with no console errors,
 * no uncaught exceptions, no failed requests, no broken images and no horizontal overflow.
 */
import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { ADMIN, STORE } from './env';
import { PageGuard, inspectLayout } from './guards';
import { adminTargets, storefrontTargets, type Target } from './pages';
import { loginCustomer, loginStaff } from './auth';

type Meta = { engine: string; device: string; locale: 'en' | 'bn'; theme: 'light' | 'dark' };
const SHOT_ROOT = fileURLToPath(new URL('../../../docs/screenshots/browser-pass/', import.meta.url));

async function run(t: Target, app: 'store' | 'admin', meta: Meta, page: import('@playwright/test').Page, ctx: import('@playwright/test').BrowserContext, project: string) {
  await ctx.addInitScript(([theme, locale, cart]) => {
    try {
      localStorage.setItem('shekor-theme', theme);
      localStorage.setItem('shekor-admin-theme', theme);
      localStorage.setItem('shekor-admin-lang', locale);
      if (cart) localStorage.setItem('shekor-cart', cart);
    } catch { /* storage blocked */ }
  }, [meta.theme, meta.locale, t.cart ? JSON.stringify([{ productId: 1, variantId: null, qty: 1 }]) : ''] as const);
  if (t.auth === 'customer') await loginCustomer(ctx);
  if (t.auth === 'staff') await loginStaff(ctx);
  const guard = new PageGuard(page, t.expect404 || t.name === 'admin-404' ? [/^404 .*(this-room-does-not-exist|no-such-admin-page)/, /status of 404/] : []);
  const url = app === 'store' ? `${STORE}/${meta.locale}${t.path === '/' ? '' : t.path}` : `${ADMIN}${t.path}`;
  const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (t.expect404) expect(res?.status()).toBe(404); else expect(res?.status(), `HTTP status for ${url}`).toBeLessThan(400);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  if (app === 'admin' && t.auth) await expect(page.locator('main')).toBeVisible();
  const layout = await inspectLayout(page);
  const shot = t.shot || (meta.engine === 'chromium' && meta.device === 'desktop' && ((meta.locale === 'en' && meta.theme === 'light') || (meta.locale === 'bn' && meta.theme === 'dark')));
  if (shot) {
    mkdirSync(`${SHOT_ROOT}${project}`, { recursive: true });
    await page.screenshot({ path: `${SHOT_ROOT}${project}/${t.name}.jpg`, type: 'jpeg', quality: 60 });
  }
  test.info().annotations.push({ type: 'page', description: JSON.stringify({ name: t.name, url, ...layout }) });
  const problems = [...guard.issues()];
  if (layout.broken.length) problems.push(...layout.broken.map((b) => `broken image: ${b}`));
  if (layout.overflowPx > 1) problems.push(`horizontal overflow ${layout.overflowPx}px: ${layout.offenders.join(', ')}`);
  expect(layout.dark, 'theme applied').toBe(meta.theme === 'dark');
  if (app === 'store' || t.auth) expect(layout.lang.startsWith(meta.locale), `lang=${layout.lang}`).toBe(true);
  expect(problems, problems.join('\n')).toEqual([]);
}

const meta = (): Meta => test.info().project.metadata as Meta;

test.describe('storefront', () => {
  for (const t of storefrontTargets()) test(t.name, async ({ page, context }) => run(t, 'store', meta(), page, context, test.info().project.name));
});
test.describe('admin', () => {
  for (const t of adminTargets()) test(t.name, async ({ page, context }) => run(t, 'admin', meta(), page, context, test.info().project.name));
});
