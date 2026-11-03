import type { Page, Request, Response } from '@playwright/test';

/** Collects everything that would make a page "not clean": console errors, uncaught exceptions, failed requests. */
export class PageGuard {
  consoleErrors: string[] = [];
  pageErrors: string[] = [];
  failed: string[] = [];
  private allow: RegExp[];
  constructor(page: Page, allow: RegExp[] = []) {
    this.allow = allow;
    page.on('console', (m) => {
      if (m.type() !== 'error' || this.allowed(m.text())) return;
      // Firefox logs a font fetch the page itself cancelled by navigating away (NS_BINDING_ABORTED = 2152398850) as an error
      if (/downloadable font: download failed .*status=2152398850/.test(m.text())) return;
      this.consoleErrors.push(m.text().slice(0, 300));
    });
    page.on('pageerror', (e) => {
      // WebKit reports same-origin fetches (RSC prefetches, /api) it cancels on navigation as "... due to access control checks."
      if (/due to access control checks/.test(e.message) && /\/\/(localhost|127\.0\.0\.1)[:/]/.test(e.message)) return;
      this.pageErrors.push(e.message.slice(0, 300));
    });
    page.on('response', (r: Response) => { if (r.status() >= 400 && !this.allowed(`${r.status()} ${r.url()}`)) this.failed.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
    page.on('requestfailed', (r: Request) => {
      const err = r.failure()?.errorText ?? '';
      // navigations/prefetches cancelled by the browser are not failures
      if (/ERR_ABORTED|NS_BINDING_ABORTED|cancelled|Load request cancelled|interrupted/i.test(err)) return;
      // Firefox reports an RSC prefetch torn down by a full navigation as NS_BASE_STREAM_CLOSED
      if (err === 'NS_BASE_STREAM_CLOSED' && /[?&]_rsc=/.test(r.url())) return;
      if (!this.allowed(`${err} ${r.url()}`)) this.failed.push(`FAILED ${err} ${r.url()}`);
    });
  }
  private allowed(s: string) { return this.allow.some((re) => re.test(s)); }
  issues() { return [...this.pageErrors.map((e) => `pageerror: ${e}`), ...this.consoleErrors.map((e) => `console: ${e}`), ...this.failed.map((e) => `request: ${e}`)]; }
}

/** Scrolls the page to trigger lazy images, then reports broken images and horizontal overflow. */
export async function inspectLayout(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  return page.evaluate(() => {
    const imgs = [...document.images].filter((i) => i.getAttribute('src'));
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== 'none').map((i) => i.currentSrc || i.src);
    const vw = document.documentElement.clientWidth;
    const overflowPx = document.documentElement.scrollWidth - vw;
    const offenders = overflowPx > 1 ? [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(' ').slice(0, 3).join('.')}`) : [];
    return { broken, overflowPx, offenders, lang: document.documentElement.lang, dark: document.documentElement.classList.contains('dark'), title: document.title };
  });
}
