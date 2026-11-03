import { defineConfig, devices, type Project } from '@playwright/test';

const engines = { chromium: devices['Desktop Chrome'], firefox: devices['Desktop Firefox'], webkit: devices['Desktop Safari'] } as const;
const sizes = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, mobile: { width: 390, height: 844 } } as const;
const only = (process.env.PASS_ENGINES || 'chromium,firefox,webkit').split(',');

const projects: Project[] = [];
for (const [engine, device] of Object.entries(engines)) {
  if (!only.includes(engine)) continue;
  for (const [size, viewport] of Object.entries(sizes))
    for (const locale of ['en', 'bn'] as const)
      for (const theme of ['light', 'dark'] as const)
        projects.push({
          name: `${engine}-${size}-${locale}-${theme}`,
          metadata: { engine, device: size, locale, theme },
          use: { ...device, viewport, colorScheme: theme, deviceScaleFactor: 1, locale: locale === 'bn' ? 'bn-BD' : 'en-US', timezoneId: 'Asia/Dhaka' },
        });
}

export default defineConfig({
  testDir: './test',
  testMatch: /browser-pass\.spec\.ts/,
  globalSetup: './test/global-setup.ts',
  fullyParallel: true,
  workers: Number(process.env.PW_WORKERS || 4),
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'reports/browser-pass.json' }], ['html', { outputFolder: 'reports/browser-pass-html', open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', actionTimeout: 15_000, navigationTimeout: 30_000 },
  projects,
});
