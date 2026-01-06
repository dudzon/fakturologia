import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthLayoutComponent } from './components/auth-layout.component';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../core/auth.service';

/**
 * LoginComponent - User authentication form.
 *
 * Features:
 * - Email/password fields with validation
 * - "Remember me" checkbox
 * - Password visibility toggle
 * - Links to registration and password reset
 * - Error handling for various auth states
 */
@Component({
  selector: 'app-login',
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
    LoadingButtonComponent
  ],
  template: `
    <app-auth-layout
      title="Zaloguj się"
      subtitle="Wprowadź dane logowania, aby kontynuować"
    >
      @if (sessionExpired()) {
        <div class="login__info" role="status">
          <mat-icon>info_outline</mat-icon>
          <span>Twoja sesja wygasła. Zaloguj się ponownie.</span>
        </div>
      }

      @if (errorMessage()) {
        <div class="login__error" role="alert">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
          @if (showResendVerification()) {
            <button
              mat-button
              color="primary"
              class="login__resend-btn"
              (click)="resendVerificationEmail()"
              [disabled]="isResending()"
            >
              {{ isResending() ? 'Wysyłanie...' : 'Wyślij ponownie' }}
            </button>
          }
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login__form">
        <mat-form-field appearance="outline" class="login__field">
          <mat-label>Email</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
            placeholder="jan@example.com"
            autocomplete="email"
          >
          <mat-icon matPrefix>email</mat-icon>
          @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
            <mat-error>Email jest wymagany</mat-error>
          }
          @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
            <mat-error>Nieprawidłowy format email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="login__field">
          <mat-label>Hasło</mat-label>
          <input
            matInput
            [type]="hidePassword() ? 'password' : 'text'"
            formControlName="password"
            autocomplete="current-password"
          >
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
          @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
            <mat-error>Hasło jest wymagane</mat-error>
          }
        </mat-form-field>

        <div class="login__options">
          <mat-checkbox formControlName="rememberMe" color="primary">
            Zapamiętaj mnie
          </mat-checkbox>
          <a routerLink="/auth/forgot-password" class="login__forgot-link">
            Zapomniałem hasła
          </a>
        </div>

        <app-loading-button
          [loading]="isLoading()"
          [disabled]="loginForm.invalid"
          type="submit"
          class="login__submit"
        >
          Zaloguj się
        </app-loading-button>
      </form>

      <div class="login__footer">
        <span>Nie masz konta?</span>
        <a routerLink="/auth/register" class="login__register-link">Zarejestruj się</a>
      </div>
    </app-auth-layout>
  `,
  styles: [`
    .login__info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background-color: #e3f2fd;
      border-radius: 8px;
      color: #1565c0;
      font-size: 14px;
    }

    .login__info mat-icon {
      color: #1565c0;
    }

    .login__error {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background-color: #ffebee;
      border-radius: 8px;
      color: #c62828;
      font-size: 14px;
    }

    .login__error mat-icon {
      color: #c62828;
    }

    .login__resend-btn {
      margin-left: auto;
    }

    .login__form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .login__field {
      width: 100%;
    }

    .login__options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0 16px;
    }

    .login__forgot-link {
      font-size: 14px;
      color: #667eea;
      text-decoration: none;
    }

    .login__forgot-link:hover {
      text-decoration: underline;
    }

    .login__submit {
      width: 100%;
      margin-top: 8px;
    }

    :host ::ng-deep .login__submit button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }

    .login__footer {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    .login__register-link {
      color: #667eea;
      font-weight: 500;
      text-decoration: none;
    }

    .login__register-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Form state */
  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  /** UI state signals */
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showResendVerification = signal(false);
  readonly isResending = signal(false);
  readonly sessionExpired = signal(false);

  /** Store email for resend verification */
  private lastAttemptedEmail = '';

  ngOnInit(): void {
    // Check if user was redirected due to expired session
    const expired = this.route.snapshot.queryParamMap.get('sessionExpired');
    if (expired === 'true') {
      this.sessionExpired.set(true);
    }
  }

  /**
   * Toggle password field visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.showResendVerification.set(false);

    const { email, password, rememberMe } = this.loginForm.getRawValue();
    this.lastAttemptedEmail = email;

    try {
      const { data, error } = await this.authService.signInWithEmail(email, password);

      if (error) {
        this.handleAuthError(error);
        return;
      }

      if (data.session) {
        // Successfully logged in - redirect to invoices
        await this.router.navigate(['/invoices']);
      }
    } catch (err) {
      this.errorMessage.set('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(): Promise<void> {
    if (!this.lastAttemptedEmail) return;

    this.isResending.set(true);

    try {
      const { error } = await this.authService.resendVerificationEmail(this.lastAttemptedEmail);

      if (error) {
        this.errorMessage.set('Nie udało się wysłać emaila. Spróbuj ponownie.');
      } else {
        this.errorMessage.set('Email weryfikacyjny został wysłany. Sprawdź swoją skrzynkę.');
        this.showResendVerification.set(false);
      }
    } finally {
      this.isResending.set(false);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: { message: string; status?: number }): void {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      this.errorMessage.set('Nieprawidłowy email lub hasło');
    } else if (message.includes('email not confirmed')) {
      this.errorMessage.set('Adres email nie został zweryfikowany. Kliknij link w mailu, który wysłaliśmy.');
      this.showResendVerification.set(true);
    } else if (message.includes('too many requests')) {
      this.errorMessage.set('Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.');
    } else {
      this.errorMessage.set('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    }
  }
}
