import { defineConfig, devices } from '@playwright/test';

/** Functional end-to-end flows (storefront + admin) on all three engines. Start the apps first (see README). */
export default defineConfig({
  testDir: './test',
  testIgnore: /browser-pass\.spec\.ts/,
  globalSetup: './test/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'reports/e2e.json' }], ['html', { outputFolder: 'reports/e2e-html', open: 'never' }]],
  use: { viewport: { width: 1366, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', timezoneId: 'Asia/Dhaka' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 900 } } },
  ],
});
