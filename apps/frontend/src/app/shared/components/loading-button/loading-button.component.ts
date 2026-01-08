import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * LoadingButtonComponent - Button with integrated loading spinner.
 *
 * Replaces button content with a spinner when loading is true.
 * Automatically disables the button during loading state.
 *
 * @example
 * ```html
 * <app-loading-button
 *   [loading]="isSaving()"
 *   [disabled]="form.invalid"
 *   color="primary"
 *   (clicked)="onSubmit()"
 * >
 *   Zapisz
 * </app-loading-button>
 * ```
 */
@Component({
  selector: 'app-loading-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-raised-button
      [color]="color()"
      [disabled]="disabled() || loading()"
      [type]="type()"
      (click)="onClick($event)"
      class="loading-button"
    >
      @if (loading()) {
        <mat-spinner diameter="20" class="loading-button__spinner"></mat-spinner>
      }
      <span class="loading-button__content" [class.loading-button__content--hidden]="loading()">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [
    `
      .loading-button {
        position: relative;
        min-width: 100px;
      }

      .loading-button__spinner {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      .loading-button__content {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.15s ease;
      }

      .loading-button__content--hidden {
        opacity: 0;
      }
    `,
  ],
})
export class LoadingButtonComponent {
  /** Whether the button is in loading state */
  readonly loading = input(false);

  /** Whether the button is disabled (in addition to loading state) */
  readonly disabled = input(false);

  /** Button color theme */
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');

  /** Button type attribute */
  readonly type = input<'button' | 'submit'>('button');

  /** Emitted when button is clicked (not emitted during loading) */
  readonly clicked = output<MouseEvent>();

  /**
   * Handle click event - only emit if not loading.
   */
  onClick(event: MouseEvent): void {
    if (!this.loading()) {
      this.clicked.emit(event);
    }
  }
}
