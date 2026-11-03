import { test as base, expect } from '@playwright/test';
import { PageGuard } from './guards';

/** Every functional test fails if the page logged a console error, threw, or had a failed request. */
export const test = base.extend<{ guard: PageGuard }>({
  guard: async ({ page }, use) => {
    const g = new PageGuard(page, [/status of 401/, /^401 .*\/api\/v1\/auth\/login/, /status of 404/, /^404 .*(nope|does-not-exist)/, /^40[0-9] .*\/api\/v1\/(auth|admin\/auth)\/(login|otp)/, /status of 4(00|01|22)/, /^422 /]);
    await use(g);
    expect(g.pageErrors, 'uncaught exceptions').toEqual([]);
    expect(g.consoleErrors, 'console errors').toEqual([]);
    expect(g.failed.filter((f) => !/^4(00|01|22) /.test(f)), 'failed requests').toEqual([]);
  },
});
export { expect };
