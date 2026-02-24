// @ts-ignore - Playwright is optional for dev
let defineConfig: any;
let devices: any;

try {
  const playwright = require('@playwright/test');
  defineConfig = playwright.defineConfig;
  devices = playwright.devices;
} catch (e) {
  // Playwright not installed in production
  defineConfig = (config: any) => config;
  devices = {};
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
  } : undefined,
});
