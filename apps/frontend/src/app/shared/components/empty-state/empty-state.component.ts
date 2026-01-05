import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Configuration interface for empty state component.
 */
export interface EmptyStateConfig {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
}

/**
 * EmptyStateComponent - Displays a friendly empty state with optional CTA.
 *
 * Used when lists are empty to guide users on next steps.
 *
 * @example
 * ```html
 * <app-empty-state
 *   icon="people"
 *   title="Brak kontrahentów"
 *   description="Dodaj pierwszego kontrahenta, aby rozpocząć"
 *   actionLabel="Dodaj kontrahenta"
 *   actionRoute="/contractors/new"
 * />
 * ```
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon-container">
        <mat-icon class="empty-state__icon">{{ icon() }}</mat-icon>
      </div>

      <h2 class="empty-state__title">{{ title() }}</h2>

      <p class="empty-state__description">{{ description() }}</p>

      @if (actionLabel()) {
        @if (actionRoute()) {
          <a
            mat-raised-button
            color="primary"
            [routerLink]="actionRoute()"
            class="empty-state__action"
          >
            {{ actionLabel() }}
          </a>
        } @else {
          <button
            mat-raised-button
            color="primary"
            class="empty-state__action"
            (click)="actionClick.emit()"
          >
            {{ actionLabel() }}
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 300px;
    }

    .empty-state__icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--mat-sys-surface-container-high);
      margin-bottom: 24px;
    }

    .empty-state__icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state__title {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .empty-state__description {
      margin: 0 0 24px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      max-width: 400px;
      line-height: 1.5;
    }

    .empty-state__action {
      min-width: 160px;
    }
  `]
})
export class EmptyStateComponent {
  /** Material icon name to display */
  readonly icon = input.required<string>();

  /** Title text for the empty state */
  readonly title = input.required<string>();

  /** Description text explaining the empty state */
  readonly description = input.required<string>();

  /** Optional action button label */
  readonly actionLabel = input<string>();

  /** Optional route for the action button (uses routerLink) */
  readonly actionRoute = input<string>();

  /** Emitted when action button is clicked (when no actionRoute is provided) */
  readonly actionClick = output<void>();
}
