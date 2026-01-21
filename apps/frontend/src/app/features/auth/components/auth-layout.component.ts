import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

/**
 * AuthLayoutComponent - Wrapper layout for all authentication pages.
 *
 * Provides consistent styling with a centered card, logo, and optional subtitle.
 * Uses ng-content for form content projection.
 *
 * @example
 * ```html
 * <app-auth-layout title="Zaloguj się" subtitle="Wprowadź dane logowania">
 *   <form>...</form>
 * </app-auth-layout>
 * ```
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__container">
        <mat-card class="auth-layout__card">
          <mat-card-header class="auth-layout__header">
            <a routerLink="/" class="auth-layout__logo-link">
              <div class="auth-layout__logo">
                <span class="auth-layout__logo-icon">📄</span>
                <span class="auth-layout__logo-text">Fakturologia</span>
              </div>
            </a>
            <h1 class="auth-layout__title">{{ title() }}</h1>
            @if (subtitle()) {
              <p class="auth-layout__subtitle">{{ subtitle() }}</p>
            }
          </mat-card-header>

          <mat-card-content class="auth-layout__content">
            <ng-content></ng-content>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-layout {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .auth-layout__container {
        width: 100%;
        max-width: 440px;
      }

      .auth-layout__card {
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      }

      .auth-layout__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 24px;
        padding: 0;
      }

      .auth-layout__logo-link {
        text-decoration: none;
        color: inherit;
        margin-bottom: 24px;
      }

      .auth-layout__logo {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .auth-layout__logo-icon {
        font-size: 32px;
      }

      .auth-layout__logo-text {
        font-size: 24px;
        font-weight: 700;
        color: #667eea;
      }

      .auth-layout__title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      .auth-layout__subtitle {
        margin: 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.5;
      }

      .auth-layout__content {
        padding: 0;
      }

      @media (max-width: 480px) {
        .auth-layout {
          padding: 8px;
          align-items: flex-start;
          padding-top: 40px;
        }

        .auth-layout__card {
          padding: 24px 16px;
        }
      }
    `,
  ],
})
export class AuthLayoutComponent {
  /** Page title displayed in the card */
  readonly title = input.required<string>();

  /** Optional subtitle displayed below the title */
  readonly subtitle = input<string>();
}
