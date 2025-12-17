import { defineConfig, devices } from '@playwright/test';
import { register } from 'tsconfig-paths';

// Register TypeScript path mappings for module resolution
register({
  baseUrl: __dirname,
  paths: {
    '@/*': ['./*'],
  },
});

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/*.disabled/**', '**/*.spec.ts.disabled'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-iphone-14',
      use: {
        ...devices['iPhone 14'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
    {
      name: 'tablet-ipad-air',
      use: {
        ...devices['iPad (gen 7)'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
  ],

  // No webServer - assumes server is already running
});
