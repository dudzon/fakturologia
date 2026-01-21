/**
 * Page Object Model - Login Page
 * Handles authentication page interactions
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // Locators
  private readonly emailInput = () => this.page.locator('input[formControlName="email"]');
  private readonly passwordInput = () => this.page.locator('input[formControlName="password"]');
  private readonly submitButton = () => this.page.getByRole('button', { name: /zaloguj|login/i });
  private readonly registerLink = () => this.page.getByRole('link', { name: /zarejestruj|register/i });
  private readonly forgotPasswordLink = () => this.page.getByRole('link', { name: /zapomniałem|forgot/i });
  private readonly errorMessage = () => this.page.locator('[role="alert"], .login__error, mat-error');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async waitForReady(): Promise<void> {
    await this.emailInput().waitFor({ state: 'visible' });
  }

  /**
   * Fill login form with credentials
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
  }

  /**
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.submitButton().click();
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.submit();
  }

  /**
   * Navigate to registration page
   */
  async goToRegister(): Promise<void> {
    await this.registerLink().click();
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink().click();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    const error = this.errorMessage();
    if (await error.isVisible()) {
      return error.textContent();
    }
    return null;
  }

  /**
   * Assert login page is displayed
   */
  async assertOnLoginPage(): Promise<void> {
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }
}
