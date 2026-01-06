/**
 * Playwright Test Fixtures
 * Custom fixtures extending Playwright's test capabilities
 */
import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages';

/**
 * Custom test fixtures type definition
 */
export type TestFixtures = {
  loginPage: LoginPage;
};

/**
 * Extended test instance with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  // Login page fixture - automatically creates LoginPage instance
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect };

/**
 * Test data for authentication tests
 */
export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

/**
 * Common test helpers
 */
export const helpers = {
  /**
   * Generate a unique email for test user creation
   */
  generateTestEmail: (): string => {
    const timestamp = Date.now();
    return `test-${timestamp}@example.com`;
  },

  /**
   * Wait for API response
   */
  waitForApiResponse: async (
    page: import('@playwright/test').Page,
    urlPattern: string | RegExp,
    timeout = 10000
  ) => {
    return page.waitForResponse(
      (response) =>
        (typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url())) && response.status() === 200,
      { timeout }
    );
  },

  /**
   * Mock API response
   */
  mockApiResponse: async (
    page: import('@playwright/test').Page,
    urlPattern: string,
    responseData: unknown,
    status = 200
  ) => {
    await page.route(`**/${urlPattern}`, (route) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      })
    );
  },
};
