import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/auth.service';

/**
 * NotFoundComponent - 404 page for non-existent routes.
 *
 * Features:
 * - Friendly illustration/icon
 * - Clear message about the missing page
 * - Smart navigation: redirects to /invoices for logged users, / for guests
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <!-- 404 Illustration -->
        <div class="illustration">
          <span class="error-code">404</span>
        </div>

        <!-- Message -->
        <h1 class="title">Strona nie znaleziona</h1>
        <p class="description">
          Przepraszamy, ale strona której szukasz nie istnieje lub została przeniesiona.
        </p>

        <!-- Action Button -->
        <button mat-raised-button color="primary" [routerLink]="homeRoute()" class="home-button">
          <mat-icon>home</mat-icon>
          {{ homeButtonText() }}
        </button>

        <!-- Additional Help -->
        <p class="help-text">Jeśli uważasz, że to błąd, skontaktuj się z nami.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background-color: var(--mat-sys-surface);
      }

      .not-found-content {
        text-align: center;
        max-width: 400px;
      }

      .illustration {
        position: relative;
        margin-bottom: 32px;
      }

      .error-code {
        font-size: 120px;
        font-weight: 700;
        color: var(--mat-sys-outline);
        opacity: 0.3;
        line-height: 1;
        display: block;
      }

      .error-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--mat-sys-primary);
      }

      .title {
        font-size: 24px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        margin: 0 0 12px;
      }

      .description {
        font-size: 16px;
        color: var(--mat-sys-on-surface-variant);
        margin: 0 0 32px;
        line-height: 1.5;
      }

      .home-button {
        mat-icon {
          margin-right: 8px;
        }
      }

      .help-text {
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant);
        margin: 24px 0 0;
      }

      @media (max-width: 599px) {
        .error-code {
          font-size: 80px;
        }

        .error-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }

        .title {
          font-size: 20px;
        }

        .description {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class NotFoundComponent {
  private readonly authService = inject(AuthService);

  /**
   * Determines the home route based on authentication status.
   */
  readonly homeRoute = computed(() => {
    return this.authService.currentUser() ? '/invoices' : '/';
  });

  /**
   * Button text based on authentication status.
   */
  readonly homeButtonText = computed(() => {
    return this.authService.currentUser() ? 'Przejdź do faktur' : 'Przejdź do strony głównej';
  });
}
