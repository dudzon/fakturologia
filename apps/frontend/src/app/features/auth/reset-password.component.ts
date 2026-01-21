import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthLayoutComponent } from './components/auth-layout.component';
import { PasswordStrengthComponent } from './components/password-strength.component';
import { PasswordRequirementsComponent } from './components/password-requirements.component';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../core/auth.service';

/**
 * Custom validator for password confirmation match
 */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (confirmPassword.value && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }

  if (confirmPassword.hasError('passwordMismatch')) {
    confirmPassword.setErrors(null);
  }

  return null;
}

/**
 * Custom validator for strong password
 */
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasMinLength = value.length >= 8;
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);

  const valid = hasMinLength && hasLowercase && hasUppercase && hasNumber;

  return valid ? null : { weakPassword: true };
}

/**
 * ResetPasswordComponent - Set new password form.
 *
 * Features:
 * - Token validation from URL (handled by Supabase session)
 * - New password with strength indicator
 * - Password requirements checklist
 * - Confirm password validation
 * - Error handling for invalid/expired tokens
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    AuthLayoutComponent,
    PasswordStrengthComponent,
    PasswordRequirementsComponent,
    LoadingButtonComponent,
  ],
  template: `
    <app-auth-layout [title]="getTitle()" [subtitle]="getSubtitle()">
      @if (tokenError()) {
        <!-- Invalid/Expired Token State -->
        <div class="reset-password__token-error">
          <mat-icon class="reset-password__error-icon">error_outline</mat-icon>
          <h2 class="reset-password__error-title">Link wygasł lub jest nieprawidłowy</h2>
          <p class="reset-password__error-message">
            Link do resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link resetujący.
          </p>
          <a
            routerLink="/auth/forgot-password"
            mat-raised-button
            color="primary"
            class="reset-password__request-btn"
          >
            Wyślij nowy link
          </a>
          <a routerLink="/auth/login" class="reset-password__back-link">
            <mat-icon>arrow_back</mat-icon>
            Powrót do logowania
          </a>
        </div>
      } @else if (resetSuccess()) {
        <!-- Success State -->
        <div class="reset-password__success">
          <mat-icon class="reset-password__success-icon">check_circle</mat-icon>
          <h2 class="reset-password__success-title">Hasło zostało zmienione</h2>
          <p class="reset-password__success-message">
            Twoje hasło zostało pomyślnie zmienione. Możesz teraz zalogować się używając nowego
            hasła.
          </p>
          <a
            routerLink="/auth/login"
            mat-raised-button
            color="primary"
            class="reset-password__login-btn"
          >
            Przejdź do logowania
          </a>
        </div>
      } @else {
        <!-- Reset Password Form -->
        @if (errorMessage()) {
          <div class="reset-password__error" role="alert">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="reset-password__form">
          <mat-form-field appearance="outline" class="reset-password__field">
            <mat-label>Nowe hasło</mat-label>
            <input
              matInput
              [type]="hidePassword() ? 'password' : 'text'"
              formControlName="password"
              autocomplete="new-password"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="hidePassword() ? 'Pokaż hasło' : 'Ukryj hasło'"
            >
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (
              resetPasswordForm.get('password')?.hasError('required') &&
              resetPasswordForm.get('password')?.touched
            ) {
              <mat-error>Hasło jest wymagane</mat-error>
            }
            @if (
              resetPasswordForm.get('password')?.hasError('weakPassword') &&
              resetPasswordForm.get('password')?.touched
            ) {
              <mat-error>Hasło nie spełnia wymagań</mat-error>
            }
          </mat-form-field>

          <app-password-strength [password]="resetPasswordForm.get('password')?.value" />
          <app-password-requirements [password]="resetPasswordForm.get('password')?.value" />

          <mat-form-field
            appearance="outline"
            class="reset-password__field reset-password__field--confirm"
          >
            <mat-label>Potwierdź nowe hasło</mat-label>
            <input
              matInput
              [type]="hideConfirmPassword() ? 'password' : 'text'"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="toggleConfirmPasswordVisibility()"
              [attr.aria-label]="hideConfirmPassword() ? 'Pokaż hasło' : 'Ukryj hasło'"
            >
              <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (
              resetPasswordForm.get('confirmPassword')?.hasError('required') &&
              resetPasswordForm.get('confirmPassword')?.touched
            ) {
              <mat-error>Potwierdzenie hasła jest wymagane</mat-error>
            }
            @if (
              resetPasswordForm.get('confirmPassword')?.hasError('passwordMismatch') &&
              resetPasswordForm.get('confirmPassword')?.touched
            ) {
              <mat-error>Hasła nie są zgodne</mat-error>
            }
          </mat-form-field>

          <app-loading-button
            [loading]="isLoading()"
            [disabled]="resetPasswordForm.invalid"
            type="submit"
            class="reset-password__submit"
          >
            Ustaw nowe hasło
          </app-loading-button>
        </form>

        <div class="reset-password__footer">
          <a routerLink="/auth/login" class="reset-password__back-link">
            <mat-icon>arrow_back</mat-icon>
            Powrót do logowania
          </a>
        </div>
      }
    </app-auth-layout>
  `,
  styles: [
    `
      .reset-password__error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        margin-bottom: 16px;
        background-color: #ffebee;
        border-radius: 8px;
        color: #c62828;
        font-size: 14px;
      }

      .reset-password__error mat-icon {
        color: #c62828;
      }

      .reset-password__form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .reset-password__field {
        width: 100%;
      }

      .reset-password__field--confirm {
        margin-top: 16px;
      }

      .reset-password__submit {
        width: 100%;
        margin-top: 16px;
      }

      :host ::ng-deep .reset-password__submit button {
        width: 100%;
        height: 48px;
        font-size: 16px;
      }

      .reset-password__footer {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }

      .reset-password__back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #667eea;
        font-size: 14px;
        text-decoration: none;
      }

      .reset-password__back-link:hover {
        text-decoration: underline;
      }

      .reset-password__back-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Token Error State */
      .reset-password__token-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px 0;
      }

      .reset-password__error-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #f44336;
        margin-bottom: 16px;
      }

      .reset-password__error-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      .reset-password__error-message {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.5;
      }

      .reset-password__request-btn {
        margin-bottom: 16px;
        min-width: 200px;
      }

      /* Success State */
      .reset-password__success {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px 0;
      }

      .reset-password__success-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #4caf50;
        margin-bottom: 16px;
      }

      .reset-password__success-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      .reset-password__success-message {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.5;
      }

      .reset-password__login-btn {
        min-width: 200px;
      }
    `,
  ],
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Form definition */
  readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  /** UI state signals */
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly tokenError = signal(false);
  readonly resetSuccess = signal(false);

  ngOnInit(): void {
    // Check if we have a valid recovery session from Supabase
    this.validateRecoverySession();
  }

  /**
   * Get dynamic title based on state
   */
  getTitle(): string {
    if (this.tokenError()) return 'Błąd';
    if (this.resetSuccess()) return 'Sukces';
    return 'Ustaw nowe hasło';
  }

  /**
   * Get dynamic subtitle based on state
   */
  getSubtitle(): string {
    if (this.tokenError() || this.resetSuccess()) return '';
    return 'Wprowadź i potwierdź nowe hasło';
  }

  /**
   * Validate recovery session from Supabase
   */
  private async validateRecoverySession(): Promise<void> {
    try {
      const { data } = await this.authService.getSession();

      // Supabase handles the recovery token automatically via URL hash
      // If there's no session after redirect, the token was invalid
      if (!data.session) {
        // Check if this is a fresh page load without recovery context
        const hash = window.location.hash;
        if (!hash.includes('type=recovery')) {
          // No recovery session and no recovery hash - likely direct navigation
          this.tokenError.set(true);
        }
      }
    } catch (error) {
      this.tokenError.set(true);
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { password } = this.resetPasswordForm.getRawValue();

    try {
      const { error } = await this.authService.resetPassword(password);

      if (error) {
        this.handleResetError(error);
        return;
      }

      // Success - show success message
      this.resetSuccess.set(true);

      // Sign out after password reset so user can log in fresh
      await this.authService.signOut();
    } catch (err) {
      this.errorMessage.set('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle password reset errors
   */
  private handleResetError(error: { message: string; status?: number }): void {
    const message = error.message.toLowerCase();

    if (message.includes('session') || message.includes('token')) {
      this.tokenError.set(true);
    } else if (message.includes('password')) {
      this.errorMessage.set('Hasło nie spełnia wymagań bezpieczeństwa');
    } else {
      this.errorMessage.set('Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.');
    }
  }
}
