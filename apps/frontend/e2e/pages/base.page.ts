/**
 * Page Object Model - Base Page
 * Base class for all page objects, providing common functionality
 */
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to the page URL
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for the page to be fully loaded
   */
  abstract waitForReady(): Promise<void>;

  /**
   * Common selectors and actions
   */

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click a link by its text
   */
  async clickLink(text: string): Promise<void> {
    await this.page.getByRole('link', { name: text }).click();
  }

  /**
   * Click a button by its text
   */
  async clickButton(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Fill a form field by label
   */
  async fillField(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Check if an element with text is visible
   */
  async isTextVisible(text: string): Promise<boolean> {
    return this.page.getByText(text).isVisible();
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `e2e-results/screenshots/${name}.png` });
  }

  /**
   * Wait for a toast/snackbar message
   */
  async waitForSnackbar(text?: string): Promise<Locator> {
    const snackbar = this.page.locator('mat-snack-bar-container');
    await snackbar.waitFor({ state: 'visible' });
    if (text) {
      await this.page.getByText(text).waitFor({ state: 'visible' });
    }
    return snackbar;
  }

  /**
   * Dismiss any open dialog/modal
   */
  async dismissDialog(): Promise<void> {
    const backdrop = this.page.locator('.cdk-overlay-backdrop');
    if (await backdrop.isVisible()) {
      await backdrop.click({ force: true });
    }
  }
}
