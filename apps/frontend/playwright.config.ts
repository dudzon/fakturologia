import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
// Fallback to local if root not found or to complement
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Run E2E tests:
 *   npm run test:e2e        - Run all tests
 *   npm run test:e2e:ui     - Run with UI mode for debugging
 *   npm run test:e2e:report - Show HTML report
 *
 * Environment variables:
 *   E2E_BASE_URL - Base URL for tests (default: http://localhost:4200)
 *   CI           - Set in CI environments
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit parallel workers in CI to avoid resource issues
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  // Shared settings for all projects
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    // Collect trace on first retry (useful for debugging)
    trace: 'on-first-retry',
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    // Record video on first retry
    video: 'on-first-retry',
    // Viewport size
    viewport: { width: 1280, height: 720 },
    // Locale and timezone for consistent test results
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
  },

  // Configure projects for Chromium only (as per tech-stack.md)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'e2e-results',

  // Web server configuration - starts Angular dev server before tests
  webServer: {
    command: 'npm run start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
