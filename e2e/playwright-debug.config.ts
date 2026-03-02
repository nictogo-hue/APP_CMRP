import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /cmrp-debug\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'off',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
