import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/cmrp-happy-path.spec.ts'],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 90000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'off',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
