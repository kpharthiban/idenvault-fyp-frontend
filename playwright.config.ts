import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Run tests sequentially — blockchain calls and the 31s V05 wait need serial order
  fullyParallel: false,
  workers: 1,

  // Retry once on CI, never locally
  retries: 0,

  // Default timeout per test — V05 overrides this to 90s
  timeout: 45000,

  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',

    // Capture everything for report evidence
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});