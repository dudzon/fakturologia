import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
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

  // Clear the error if passwords match
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
 * RegisterComponent - User registration form.
 *
 * Features:
 * - Email/password/confirm password fields
 * - Password strength indicator
 * - Password requirements checklist
 * - Terms acceptance checkbox
 * - Success state with verification email message
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    AuthLayoutComponent,
    PasswordStrengthComponent,
    PasswordRequirementsComponent,
    LoadingButtonComponent,
  ],
  template: `
    <app-auth-layout
      title="Zarejestruj się"
      [subtitle]="registrationSuccess() ? '' : 'Utwórz bezpłatne konto'"
    >
      @if (registrationSuccess()) {
        <!-- Success State -->
        <div class="register__success">
          <mat-icon class="register__success-icon">mark_email_read</mat-icon>
          <h2 class="register__success-title">Sprawdź swoją skrzynkę</h2>
          <p class="register__success-message">
            Wysłaliśmy link weryfikacyjny na adres <strong>{{ registeredEmail() }}</strong
            >. Kliknij w link, aby aktywować konto.
          </p>
          <p class="register__success-hint">Nie widzisz maila? Sprawdź folder spam.</p>
          <a
            routerLink="/auth/login"
            mat-stroked-button
            color="primary"
            class="register__success-btn"
          >
            Przejdź do logowania
          </a>
        </div>
      } @else {
        <!-- Registration Form -->
        @if (errorMessage()) {
          <div class="register__error" role="alert">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register__form">
          <mat-form-field appearance="outline" class="register__field">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="jan@example.com"
              autocomplete="email"
            />
            <mat-icon matPrefix>email</mat-icon>
            @if (
              registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched
            ) {
              <mat-error>Email jest wymagany</mat-error>
            }
            @if (
              registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched
            ) {
              <mat-error>Nieprawidłowy format email</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="register__field">
            <mat-label>Hasło</mat-label>
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
              registerForm.get('password')?.hasError('required') &&
              registerForm.get('password')?.touched
            ) {
              <mat-error>Hasło jest wymagane</mat-error>
            }
            @if (
              registerForm.get('password')?.hasError('weakPassword') &&
              registerForm.get('password')?.touched
            ) {
              <mat-error>Hasło nie spełnia wymagań</mat-error>
            }
          </mat-form-field>

          <app-password-strength [password]="registerForm.get('password')?.value" />
          <app-password-requirements [password]="registerForm.get('password')?.value" />

          <mat-form-field appearance="outline" class="register__field register__field--confirm">
            <mat-label>Potwierdź hasło</mat-label>
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
              registerForm.get('confirmPassword')?.hasError('required') &&
              registerForm.get('confirmPassword')?.touched
            ) {
              <mat-error>Potwierdzenie hasła jest wymagane</mat-error>
            }
            @if (
              registerForm.get('confirmPassword')?.hasError('passwordMismatch') &&
              registerForm.get('confirmPassword')?.touched
            ) {
              <mat-error>Hasła nie są zgodne</mat-error>
            }
          </mat-form-field>

          <div class="register__terms">
            <mat-checkbox formControlName="acceptTerms" color="primary">
              Akceptuję
              <a
                href="/regulamin"
                target="_blank"
                rel="noopener"
                (click)="$event.stopPropagation()"
              >
                regulamin
              </a>
              i
              <a
                href="/polityka-prywatnosci"
                target="_blank"
                rel="noopener"
                (click)="$event.stopPropagation()"
              >
                politykę prywatności
              </a>
            </mat-checkbox>
            @if (
              registerForm.get('acceptTerms')?.hasError('requiredTrue') &&
              registerForm.get('acceptTerms')?.touched
            ) {
              <mat-error class="register__terms-error">Musisz zaakceptować regulamin</mat-error>
            }
          </div>

          <app-loading-button
            [loading]="isLoading()"
            [disabled]="registerForm.invalid"
            type="submit"
            class="register__submit"
          >
            Zarejestruj się
          </app-loading-button>
        </form>

        <div class="register__footer">
          <span>Masz już konto?</span>
          <a routerLink="/auth/login" class="register__login-link">Zaloguj się</a>
        </div>
      }
    </app-auth-layout>
  `,
  styles: [
    `
      .register__error {
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

      .register__error mat-icon {
        color: #c62828;
      }

      .register__form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .register__field {
        width: 100%;
      }

      .register__field--confirm {
        margin-top: 16px;
      }

      .register__terms {
        margin: 16px 0;
      }

      .register__terms a {
        color: #667eea;
        text-decoration: none;
      }

      .register__terms a:hover {
        text-decoration: underline;
      }

      .register__terms-error {
        display: block;
        margin-top: 4px;
        font-size: 12px;
      }

      .register__submit {
        width: 100%;
        margin-top: 8px;
      }

      :host ::ng-deep .register__submit button {
        width: 100%;
        height: 48px;
        font-size: 16px;
      }

      .register__footer {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 24px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }

      .register__login-link {
        color: #667eea;
        font-weight: 500;
        text-decoration: none;
      }

      .register__login-link:hover {
        text-decoration: underline;
      }

      /* Success State */
      .register__success {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px 0;
      }

      .register__success-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #4caf50;
        margin-bottom: 16px;
      }

      .register__success-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      .register__success-message {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.5;
      }

      .register__success-hint {
        margin: 0 0 24px 0;
        font-size: 13px;
        color: rgba(0, 0, 0, 0.4);
      }

      .register__success-btn {
        min-width: 200px;
      }
    `,
  ],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Form definition with custom validators */
  readonly registerForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator },
  );

  /** UI state signals */
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly registrationSuccess = signal(false);
  readonly registeredEmail = signal('');

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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.getRawValue();

    try {
      const { data, error } = await this.authService.signUp(email, password);

      if (error) {
        this.handleAuthError(error);
        return;
      }

      // Show success message
      this.registeredEmail.set(email);
      this.registrationSuccess.set(true);
    } catch (err) {
      this.errorMessage.set('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle registration errors
   */
  private handleAuthError(error: { message: string; status?: number }): void {
    const message = error.message.toLowerCase();

    if (message.includes('user already registered') || message.includes('already exists')) {
      this.errorMessage.set('Ten adres email jest już zarejestrowany');
    } else if (message.includes('invalid email')) {
      this.errorMessage.set('Nieprawidłowy format adresu email');
    } else if (message.includes('password')) {
      this.errorMessage.set('Hasło nie spełnia wymagań bezpieczeństwa');
    } else {
      this.errorMessage.set('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
    }
  }
}
