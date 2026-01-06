import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthLayoutComponent } from './components/auth-layout.component';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../core/auth.service';

/**
 * ForgotPasswordComponent - Password reset request form.
 *
 * Features:
 * - Email input with validation
 * - Consistent success message (prevents email enumeration)
 * - Cooldown timer for resend (60 seconds)
 */
@Component({
  selector: 'app-forgot-password',
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
    LoadingButtonComponent
  ],
  template: `
    <app-auth-layout
      title="Zapomniałem hasła"
      subtitle="Podaj adres email, a wyślemy Ci link do resetowania hasła"
    >
      @if (emailSent()) {
        <!-- Success State -->
        <div class="forgot-password__success">
          <mat-icon class="forgot-password__success-icon">mark_email_read</mat-icon>
          <h2 class="forgot-password__success-title">Sprawdź swoją skrzynkę</h2>
          <p class="forgot-password__success-message">
            Jeśli konto z adresem <strong>{{ submittedEmail() }}</strong> istnieje,
            wysłaliśmy na nie link do resetowania hasła.
          </p>
          <p class="forgot-password__success-hint">
            Nie widzisz maila? Sprawdź folder spam.
          </p>

          @if (cooldownSeconds() > 0) {
            <p class="forgot-password__cooldown">
              Możesz wysłać ponownie za {{ cooldownSeconds() }}s
            </p>
          } @else {
            <button
              mat-stroked-button
              color="primary"
              (click)="resendEmail()"
              [disabled]="isLoading()"
              class="forgot-password__resend-btn"
            >
              Wyślij ponownie
            </button>
          }

          <a routerLink="/auth/login" class="forgot-password__back-link">
            <mat-icon>arrow_back</mat-icon>
            Powrót do logowania
          </a>
        </div>
      } @else {
        <!-- Request Form -->
        @if (errorMessage()) {
          <div class="forgot-password__error" role="alert">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form
          [formGroup]="forgotPasswordForm"
          (ngSubmit)="onSubmit()"
          class="forgot-password__form"
        >
          <mat-form-field appearance="outline" class="forgot-password__field">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="jan@example.com"
              autocomplete="email"
            >
            <mat-icon matPrefix>email</mat-icon>
            @if (forgotPasswordForm.get('email')?.hasError('required') && forgotPasswordForm.get('email')?.touched) {
              <mat-error>Email jest wymagany</mat-error>
            }
            @if (forgotPasswordForm.get('email')?.hasError('email') && forgotPasswordForm.get('email')?.touched) {
              <mat-error>Nieprawidłowy format email</mat-error>
            }
          </mat-form-field>

          <app-loading-button
            [loading]="isLoading()"
            [disabled]="forgotPasswordForm.invalid"
            type="submit"
            class="forgot-password__submit"
          >
            Wyślij link resetujący
          </app-loading-button>
        </form>

        <div class="forgot-password__footer">
          <a routerLink="/auth/login" class="forgot-password__back-link">
            <mat-icon>arrow_back</mat-icon>
            Powrót do logowania
          </a>
        </div>
      }
    </app-auth-layout>
  `,
  styles: [`
    .forgot-password__error {
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

    .forgot-password__error mat-icon {
      color: #c62828;
    }

    .forgot-password__form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .forgot-password__field {
      width: 100%;
    }

    .forgot-password__submit {
      width: 100%;
    }

    :host ::ng-deep .forgot-password__submit button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }

    .forgot-password__footer {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }

    .forgot-password__back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #667eea;
      font-size: 14px;
      text-decoration: none;
    }

    .forgot-password__back-link:hover {
      text-decoration: underline;
    }

    .forgot-password__back-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Success State */
    .forgot-password__success {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 0;
    }

    .forgot-password__success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .forgot-password__success-title {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .forgot-password__success-message {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.5;
    }

    .forgot-password__success-hint {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.4);
    }

    .forgot-password__cooldown {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    .forgot-password__resend-btn {
      margin-bottom: 24px;
    }
  `]
})
export class ForgotPasswordComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  /** Form definition */
  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /** UI state signals */
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly emailSent = signal(false);
  readonly submittedEmail = signal('');
  readonly cooldownSeconds = signal(0);

  /** Cooldown timer interval */
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearCooldownTimer();
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    await this.sendResetEmail();
  }

  /**
   * Resend password reset email
   */
  async resendEmail(): Promise<void> {
    await this.sendResetEmail();
  }

  /**
   * Send password reset email
   */
  private async sendResetEmail(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.forgotPasswordForm.get('email')?.value ?? this.submittedEmail();

    try {
      const { error } = await this.authService.forgotPassword(email);

      // Always show success (prevents email enumeration)
      this.submittedEmail.set(email);
      this.emailSent.set(true);
      this.startCooldown();

      // Log error silently for debugging
      if (error) {
        console.error('Password reset error:', error);
      }
    } catch (err) {
      this.errorMessage.set('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Start 60-second cooldown timer
   */
  private startCooldown(): void {
    this.clearCooldownTimer();
    this.cooldownSeconds.set(60);

    this.cooldownInterval = setInterval(() => {
      const current = this.cooldownSeconds();
      if (current <= 1) {
        this.clearCooldownTimer();
        this.cooldownSeconds.set(0);
      } else {
        this.cooldownSeconds.set(current - 1);
      }
    }, 1000);
  }

  /**
   * Clear cooldown timer
   */
  private clearCooldownTimer(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }
}
