import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Data interface for the confirm dialog.
 */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

/**
 * ConfirmDialogComponent - Reusable confirmation dialog.
 *
 * Used for destructive actions and unsaved changes warnings.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      @if (data.icon) {
        <mat-icon class="dialog-icon" [class]="data.confirmColor || 'warn'">
          {{ data.icon }}
        </mat-icon>
      }

      <h2 mat-dialog-title>{{ data.title }}</h2>

      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Anuluj' }}
        </button>
        <button mat-raised-button [color]="data.confirmColor || 'primary'" (click)="onConfirm()">
          {{ data.confirmText || 'Potwierdź' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .confirm-dialog {
        padding: 8px;
      }

      .dialog-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        display: block;

        &.warn {
          color: var(--mat-sys-error);
        }

        &.primary {
          color: var(--mat-sys-primary);
        }

        &.accent {
          color: var(--mat-sys-tertiary);
        }
      }

      h2[mat-dialog-title] {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 500;
      }

      mat-dialog-content p {
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
        line-height: 1.5;
      }

      mat-dialog-actions {
        margin-top: 24px;
        padding: 0;
        gap: 8px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
