import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth.service';

/**
 * PageHeaderComponent - Reusable page header with title, actions, and user menu
 *
 * Features:
 * - Page title
 * - Optional action button slot (ng-content)
 * - User menu with navigation and logout
 * - Responsive design
 *
 * @example
 * ```html
 * <app-page-header title="Faktury">
 *   <button mat-raised-button color="primary">
 *     <mat-icon>add</mat-icon>
 *     Nowa faktura
 *   </button>
 * </app-page-header>
 * ```
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">{{ title() }}</h1>
      <div class="page-header__actions">
        <ng-content></ng-content>
        <button
          mat-icon-button
          [matMenuTriggerFor]="userMenu"
          matTooltip="Menu użytkownika"
          class="page-header__user-menu"
        >
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/invoices">
            <mat-icon>receipt_long</mat-icon>
            <span>Faktury</span>
          </button>
          <button mat-menu-item routerLink="/contractors">
            <mat-icon>people</mat-icon>
            <span>Kontrahenci</span>
          </button>
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profil firmy</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="onLogout()">
            <mat-icon>logout</mat-icon>
            <span>Wyloguj się</span>
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .page-header__title {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .page-header__actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .page-header__user-menu {
        margin-left: 8px;
      }
      ::ng-deep .mat-mdc-menu-content {
        background: #fff !important;
        z-index: 1200 !important;
      }

      @media (max-width: 959px) {
        .page-header__title {
          font-size: 24px;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Page title */
  readonly title = input.required<string>();

  /**
   * Handle user logout
   */
  async onLogout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.snackBar.open('Zostałeś wylogowany', 'Zamknij', {
        duration: 3000,
      });
      this.router.navigate(['/auth/login']);
    } catch (error) {
      this.snackBar.open('Błąd podczas wylogowania', 'Zamknij', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    }
  }
}
