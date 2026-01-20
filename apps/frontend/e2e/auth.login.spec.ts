/**
 * E2E Test Suite - User Authentication (Login)
 * Tests the login functionality using real test credentials
 * 
 * @auth - These tests require a running Supabase instance with a test user.
 *         Skipped in CI (GitHub Actions) - run locally only.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages';
import { testUsers } from './fixtures';

test.describe('User Login @auth', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Capture browser console for debugging auth errors
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('[LoginComponent]')) {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });
    
    loginPage = new LoginPage(page);
    // Arrange: Navigate to login page
    await loginPage.goto();
    await loginPage.waitForReady();
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // Debug: Log what credentials we're using (email only, not password)
    console.log('E2E Test: Using email:', testUsers.valid.email || '(EMPTY - check E2E_USERNAME secret)');
    console.log('E2E Test: Password set:', testUsers.valid.password ? 'YES' : 'NO (EMPTY - check E2E_PASSWORD secret)');
    
    // Arrange: Verify we're on the login page
    await loginPage.assertOnLoginPage();

    // Act: Perform login with test credentials
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Wait for either: redirect to /invoices OR an error message appears
    const redirectPromise = page.waitForURL(/\/invoices/, { timeout: 15000 });
    const errorPromise = page.locator('[role="alert"], .login__error, mat-error, .snackbar-error').first().waitFor({ state: 'visible', timeout: 15000 });
    
    const result = await Promise.race([
      redirectPromise.then(() => 'redirect'),
      errorPromise.then(() => 'error'),
    ]).catch(() => 'timeout');

    if (result === 'error') {
      // Get the error message for debugging
      const errorText = await page.locator('[role="alert"], .login__error, mat-error, .snackbar-error').first().textContent();
      console.log('E2E Test: Login error message:', errorText);
      throw new Error(`Login failed with error: ${errorText}`);
    }

    if (result === 'timeout') {
      // Screenshot and log current URL for debugging
      console.log('E2E Test: Current URL after timeout:', page.url());
      throw new Error(`Login timed out. Current URL: ${page.url()}. Check if the test user exists in the target Supabase instance.`);
    }

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
    // Debug: Log credentials being used
    console.log('E2E Test (logout): Using email:', testUsers.valid.email || '(EMPTY)');
    
    // Act: Login with valid credentials
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Wait for either: redirect to /invoices OR an error message appears
    const redirectPromise = page.waitForURL(/\/invoices/, { timeout: 15000 });
    const errorPromise = page.locator('[role="alert"], .login__error, mat-error, .snackbar-error').first().waitFor({ state: 'visible', timeout: 15000 });
    
    const loginResult = await Promise.race([
      redirectPromise.then(() => 'redirect'),
      errorPromise.then(() => 'error'),
    ]).catch(() => 'timeout');

    if (loginResult !== 'redirect') {
      const errorText = loginResult === 'error' 
        ? await page.locator('[role="alert"], .login__error, mat-error, .snackbar-error').first().textContent()
        : 'Timeout waiting for redirect';
      console.log('E2E Test (logout): Login failed:', errorText);
      throw new Error(`Login failed: ${errorText}. Current URL: ${page.url()}`);
    }

    // Act: Open user menu
    await page.locator('.page-header__user-menu').click();

    // Assert: Logout button should be visible (wait for animation)
    const logoutButton = page.getByRole('menuitem', { name: /wyloguj się/i });
    await logoutButton.waitFor({ state: 'visible' });
    // Small wait for animation to settle to prevent "element detached" errors
    await page.waitForTimeout(500);

    // Act: Click logout (force to bypass strict checks during animation)
    await logoutButton.click({ force: true });

    // Assert: Should redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
