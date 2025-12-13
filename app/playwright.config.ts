import { defineConfig, devices } from '@playwright/test';
import path from 'path';
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
