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
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop testing
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile testing - phones
    {
      name: 'mobile-iphone-14',
      use: {
        ...devices['iPhone 14'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
    {
      name: 'mobile-iphone-14-pro-max',
      use: {
        ...devices['iPhone 14 Pro Max'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
    {
      name: 'mobile-pixel-7',
      use: {
        ...devices['Pixel 7'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
    {
      name: 'mobile-samsung-s21',
      use: {
        ...devices['Galaxy S9+'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    // Tablet testing
    {
      name: 'tablet-ipad-air',
      use: {
        ...devices['iPad (gen 7)'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
    {
      name: 'tablet-ipad-pro',
      use: {
        ...devices['iPad Pro 11'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    // Landscape modes for common mobile devices
    {
      name: 'mobile-iphone-14-landscape',
      use: {
        ...devices['iPhone 14 landscape'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
