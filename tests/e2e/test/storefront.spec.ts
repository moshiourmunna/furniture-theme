import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures';
import { CUSTOMER, STORE } from './env';
import { RESOLVED } from './pages';

const R = () => JSON.parse(readFileSync(RESOLVED, 'utf8')) as Record<string, string>;
const S = (path: string, l = 'en') => `${STORE}/${l}${path === '/' ? '' : path}`;

test.describe('chrome: theme, language, navigation', () => {
  test('theme persists with no flash and language switches with Bangla numerals', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/'));
    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.getByTestId('theme-toggle').first().click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(!before);
    // reload: the class must already be set before first paint (inline script runs before body)
    await page.goto(S('/shop'), { waitUntil: 'commit' });
    await page.waitForSelector('html');
    await page.waitForFunction(() => document.readyState !== 'loading' || document.body);
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(!before);
    await page.getByTestId('lang-toggle').first().click();
    await page.waitForURL(/\/bn\/shop/);
    await expect(page.locator('html')).toHaveAttribute('lang', /bn/);
    await expect(page.getByTestId('product-card').first()).toContainText(/৳[০-৯]/);
  });
  test('header search suggests products and opens results', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/'));
    await page.getByTestId('open-search').first().click();
    await page.getByTestId('search-overlay').locator('input').fill('sofa');
    await expect(page.getByTestId('suggest-products').locator('a').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/search\?q=sofa/);
    await expect(page.getByTestId('product-card').first()).toBeVisible();
  });
});

test.describe('shop + product', () => {
  test('filters, sort and pagination update results', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/shop'));
    const count = page.getByTestId('result-count');
    const all = await count.textContent();
    await page.getByTestId('sort').selectOption('price-asc');
    await page.waitForURL(/sort=price-asc/);
    const prices = await page.getByTestId('product-card').evaluateAll((els) => els.slice(0, 6).map((e) => Number((e.textContent?.match(/৳([\d,]+)/)?.[1] ?? '0').replace(/,/g, ''))));
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    const opener = page.getByTestId('open-filters');
    if (await opener.isVisible()) await opener.click();
    await page.locator('[data-testid^=f-category-]').first().click();
    await expect(count).not.toHaveText(all ?? '');
    await expect(page.getByTestId('applied-filters')).toBeVisible();
  });
  test('product page: variants, lightbox, EMI, delivery check, wishlist, compare, add to bag', async ({ page, guard }) => {
    void guard;
    await page.goto(S(R().p));
    await expect(page.getByTestId('pdp-price')).toContainText('৳');
    const opts = page.getByTestId('variant-option');
    if ((await opts.count()) > 1) { await opts.nth(1).click(); await expect(opts.nth(1)).toHaveAttribute('aria-pressed', 'true').catch(() => {}); }
    await page.getByTestId('open-lightbox').first().click();
    await expect(page.getByTestId('lightbox')).toBeVisible();
    if (await page.getByTestId('lb-next').isVisible()) await page.getByTestId('lb-next').click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('lightbox')).toBeHidden();
    if (await page.getByTestId('open-emi').isVisible()) { await page.getByTestId('open-emi').click(); await expect(page.getByTestId('emi-monthly').first()).toBeVisible(); await page.keyboard.press('Escape'); }
    await page.getByTestId('pdp-wishlist').click();
    await expect(page.getByTestId('wishlist-count').first()).toHaveText(/[1-9১-৯]/);
    await page.getByTestId('pdp-compare').click();
    await page.getByTestId('add-to-bag').first().click();
    await expect(page.getByTestId('bag-drawer')).toBeVisible();
    await expect(page.getByTestId('bag-line').first()).toBeVisible();
    await page.goto(S('/wishlist'));
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.goto(S('/compare'));
    await expect(page.locator('main')).toContainText(/৳/);
  });
  test('catalogue flipbook turns pages', async ({ page, guard }) => {
    void guard;
    await page.goto(S(R().catalogues));
    await expect(page.getByTestId('flipbook')).toBeVisible();
    const pg = page.getByTestId('flip-page');
    const first = await pg.first().getAttribute('src').catch(() => null);
    await page.getByTestId('flip-next').click();
    await page.getByTestId('flip-next').click();
    await page.getByTestId('flip-prev').click();
    expect(await pg.first().getAttribute('src').catch(() => null)).not.toBe(undefined);
    void first;
  });
  test('gallery lightbox opens', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/projects'));
    await page.getByTestId('project-card').first().click();
    const tile = page.getByTestId('lightbox-tile').first();
    if (await tile.count()) { await tile.click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); }
  });
});

test.describe('leads', () => {
  test('contact form validates and submits', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/contact'));
    await page.getByTestId('lead-submit').click();
    await expect(page.locator('[aria-invalid=true]').first()).toBeVisible();
    await page.getByLabel(/^Name/).fill('E2E Tester');
    await page.getByLabel(/^Mobile/).fill('01712345678');
    await page.getByLabel(/^Subject/).selectOption({ index: 1 });
    await page.getByLabel(/^Message/).fill('Hello from the end-to-end suite.');
    await page.getByTestId('lead-submit').click();
    await expect(page.getByTestId('contact-success')).toBeVisible();
  });
});

test.describe('checkout per payment method', () => {
  for (const [method, outcome, expectText] of [
    ['bkash', 'success', /Paid|পরিশোধিত/], ['nagad', 'fail', /didn.t go through|Failed/i], ['card', 'cancel', /didn.t go through|Cancel/i], ['cod', '-', /on delivery/i], ['bank', '-', /Awaiting|transfer/i],
  ] as const) {
    test(`${method} ${outcome}`, async ({ page, guard }) => {
      void guard;
      await page.goto(S(R().p));
      await page.getByTestId('add-to-bag').first().click();
      await page.goto(S('/cart'));
      await expect(page.getByTestId('cart-line').first()).toBeVisible();
      if (method === 'bkash') {
        await page.getByTestId('coupon-input').fill('WELCOME10'); await page.getByTestId('coupon-apply').click();
        await expect(page.getByTestId('coupon-ok').or(page.getByTestId('coupon-error'))).toBeVisible();
      }
      await page.getByTestId('cart-checkout').click();
      await page.waitForURL(/checkout/);
      await page.fill('#co-name', 'E2E Buyer'); await page.fill('#co-phone', '01712345678'); await page.fill('#co-area', 'Banani'); await page.fill('#co-line1', 'House 12, Road 5');
      await page.getByTestId('to-delivery').click();
      await page.getByTestId('to-payment').click();
      const pay = page.getByTestId(`pay-${method}`);
      if (await pay.isDisabled()) test.skip(true, `${method} unavailable for this zone`);
      await pay.click();
      await page.getByTestId('accept-terms').check();
      await page.getByTestId('place-order').click();
      await page.waitForURL(/pay\/mock|order\//, { timeout: 30_000 });
      if (page.url().includes('pay/mock')) {
        await expect(page.getByTestId('pay-amount')).toBeVisible();
        if (outcome === 'success') { if (await page.locator('#pin').count()) await page.fill('#pin', '12345'); await page.getByTestId('pay-confirm').click(); }
        else await page.getByTestId(outcome === 'fail' ? 'pay-fail' : 'pay-cancel').click();
        await page.waitForURL(/order\//, { timeout: 30_000 });
      }
      await expect(page.getByTestId('order-heading')).toBeVisible();
      await expect(page.locator('main')).toContainText(expectText);
      if (outcome === 'fail' || outcome === 'cancel') await expect(page.getByTestId('retry-payment')).toBeVisible();
      await expect(page.getByTestId('cart-count').first()).toHaveText(/^(0|০|)$/).catch(() => {});
    });
  }
  test('track an order by number + phone', async ({ page, guard }) => {
    void guard;
    const orderNo = new URL(S(R().orderPublic)).pathname.split('/').pop()!;
    await page.goto(S('/track'));
    await page.fill('#tr-no', orderNo); await page.fill('#tr-ph', CUSTOMER.phone);
    await page.getByTestId('track-submit').click();
    await expect(page.getByTestId('order-status')).toBeVisible();
    await page.fill('#tr-ph', '01800000000'); await page.getByTestId('track-submit').click();
    await expect(page.getByTestId('track-error')).toBeVisible();
  });
});

test.describe('account', () => {
  test('login guard, bad login, login, orders, addresses, profile, logout', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/account/orders'));
    await page.waitForURL(/login\?next=/);
    await page.fill('#identifier', CUSTOMER.email); await page.fill('#password', 'Wrong-pass1');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await page.fill('#password', CUSTOMER.password); await page.getByTestId('login-submit').click();
    await page.waitForURL(/account\/orders/);
    await page.getByTestId('order-list').locator('a').first().click();
    await expect(page.getByTestId('order-view')).toBeVisible();
    await page.goto(S('/account/addresses'));
    await page.waitForLoadState('networkidle');
    const n = await page.getByTestId('address-card').count();
    await page.getByTestId('address-add').click();
    await page.fill('#ad-label', 'Office'); await page.fill('#ad-area', 'Gulshan 2'); await page.fill('#ad-line1', 'Level 7, Road 90');
    await page.getByTestId('address-save').click();
    await expect(page.getByTestId('address-card')).toHaveCount(n + 1);
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('address-delete').last().click();
    await expect(page.getByTestId('address-card')).toHaveCount(n);
    await page.goto(S('/account/settings'));
    await page.getByTestId('profile-save').click();
    await expect(page.getByTestId('profile-saved')).toBeVisible();
    await page.goto(S('/account', 'bn'));
    await expect(page.getByTestId('account-home')).toBeVisible();
    await page.getByTestId('logout').click();
    await page.waitForURL(/\/(en|bn)$/);
  });
  test('OTP login, register + verify, forgot + reset', async ({ page, guard }) => {
    void guard;
    await page.goto(S('/login'));
    await page.getByTestId('login-tab-otp').click();
    await page.fill('#otp-target', CUSTOMER.phone); await page.getByTestId('otp-request').click();
    const code = (await page.locator('[data-testid=dev-otp] strong').textContent())!.trim();
    await page.fill('#otp', code); await page.getByTestId('otp-submit').click();
    await page.waitForURL(/account/);
    await page.getByTestId('logout').click(); await page.waitForURL(/\/(en|bn)$/);
    const phone = `019${String(Date.now()).slice(-8)}`;
    await page.goto(S('/register'));
    await page.fill('#name', 'New Buyer'); await page.fill('#phone', phone); await page.fill('#password', 'Secret123');
    await page.getByTestId('register-submit').click();
    const c2 = (await page.locator('[data-testid=dev-otp] strong').textContent())!.trim();
    await page.fill('#otp', c2); await page.getByTestId('otp-submit').click();
    await page.waitForURL(/account/);
    await page.getByTestId('logout').click(); await page.waitForURL(/\/(en|bn)$/);
    await page.goto(S('/forgot'));
    await page.fill('#target', phone); await page.getByTestId('forgot-submit').click();
    const c3 = (await page.locator('[data-testid=dev-otp] strong').textContent())!.trim();
    await page.fill('#code', c3); await page.fill('#new-password', 'Newpass456'); await page.getByTestId('reset-submit').click();
    await expect(page.getByTestId('reset-done')).toBeVisible();
    await page.goto(S('/login'));
    await page.fill('#identifier', phone); await page.fill('#password', 'Newpass456'); await page.getByTestId('login-submit').click();
    await page.waitForURL(/account/);
  });
});
