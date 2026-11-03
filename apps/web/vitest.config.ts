import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      { resolve: { alias }, test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] } },
      {
        resolve: { alias },
        test: {
          name: 'integration', environment: 'node', include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/global-setup.ts'], setupFiles: ['tests/integration/setup.ts'],
          fileParallelism: false, testTimeout: 30_000, hookTimeout: 120_000,
        },
      },
    ],
  },
});
