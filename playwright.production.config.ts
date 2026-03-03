import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000,
  use: {
    baseURL: 'https://app-cmrp.vercel.app',
    headless: true,
    screenshot: 'on',
    video: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'production',
      testMatch: /cmrp-production-test\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
