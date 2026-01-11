/**
 * E2E Test Suite - User Authentication (Login)
 * Tests the login functionality using real test credentials
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages';
import { testUsers } from './fixtures';

test.describe('User Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    // Arrange: Navigate to login page
    await loginPage.goto();
    await loginPage.waitForReady();
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // Arrange: Verify we're on the login page
    await loginPage.assertOnLoginPage();

    // Act: Perform login with test credentials
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Assert: Wait for navigation to authenticated area (should redirect to /invoices)
    await page.waitForURL(/\/invoices/, {
      timeout: 10000,
    });

    // Assert: Verify we're on the invoices page
    await expect(page).toHaveURL(/\/invoices/);

    // Assert: Verify the page header is visible (confirms successful login)
    await expect(page.getByRole('heading', { name: /faktury/i })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Arrange: Verify we're on the login page
    await loginPage.assertOnLoginPage();

    // Act: Try to login with invalid credentials
    await loginPage.login(testUsers.invalid.email, testUsers.invalid.password);

    // Assert: Should stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Assert: Error message should be visible
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('should have logout functionality after login', async ({ page }) => {
    // Act: Login with valid credentials
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Assert: Wait for navigation to invoices
    await page.waitForURL(/\/invoices/, { timeout: 10000 });

    // Act: Open user menu
    await page.locator('.page-header__user-menu').click();

    // Assert: Logout button should be visible
    await expect(page.getByRole('menuitem', { name: /wyloguj się/i })).toBeVisible();

    // Act: Click logout
    await page.getByRole('menuitem', { name: /wyloguj się/i }).click();

    // Assert: Should redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
