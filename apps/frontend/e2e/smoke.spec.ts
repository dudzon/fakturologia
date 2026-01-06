import { test, expect } from '@playwright/test';

test('landing loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Fakturologia/i);
});

test('login page loads', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByText('Zaloguj się')).toBeVisible();
});
