import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import type { InvoiceStatus } from '../../../../types';

/**
 * Data passed to the status dialog.
 */
export interface InvoiceStatusDialogData {
  invoiceId: string;
  invoiceNumber: string;
  currentStatus: InvoiceStatus;
}

/**
 * Status option for radio group.
 */
interface StatusOption {
  value: InvoiceStatus;
  label: string;
  description: string;
  icon: string;
}

/**
 * Status options with descriptions.
 */
const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'draft',
    label: 'Szkic',
    description: 'Faktura w trakcie tworzenia, można ją edytować',
    icon: 'edit_note'
  },
  {
    value: 'unpaid',
    label: 'Wystawiona (nieopłacona)',
    description: 'Faktura wystawiona, oczekuje na płatność',
    icon: 'schedule'
  },
  {
    value: 'paid',
    label: 'Opłacona',
    description: 'Faktura została opłacona',
    icon: 'check_circle'
  }
];

/**
 * InvoiceStatusDialogComponent - Dialog for changing invoice status.
 *
 * Allows transitioning between statuses with validation:
 * - draft -> unpaid (requires complete data)
 * - unpaid -> paid
 * - Any status can go back to draft (with warning)
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(InvoiceStatusDialogComponent, {
 *   data: { invoiceId: '123', invoiceNumber: 'FV/2025/01/001', currentStatus: 'draft' }
 * });
 * dialogRef.afterClosed().subscribe(newStatus => { ... });
 * ```
 */
@Component({
  selector: 'app-invoice-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Zmień status faktury</h2>

    <mat-dialog-content>
      <p class="dialog-subtitle">
        Faktura: <strong>{{ data.invoiceNumber }}</strong>
      </p>

      <mat-radio-group
        [(ngModel)]="selectedStatus"
        class="status-radio-group"
        aria-label="Wybierz nowy status"
      >
        @for (option of statusOptions; track option.value) {
          <mat-radio-button
            [value]="option.value"
            [disabled]="!canTransitionTo(option.value)"
            class="status-option"
            [class.current]="option.value === data.currentStatus"
          >
            <div class="status-option__content">
              <mat-icon class="status-option__icon">{{ option.icon }}</mat-icon>
              <div class="status-option__text">
                <span class="status-option__label">
                  {{ option.label }}
                  @if (option.value === data.currentStatus) {
                    <span class="status-option__current">(aktualny)</span>
                  }
                </span>
                <span class="status-option__description">{{ option.description }}</span>
              </div>
            </div>
          </mat-radio-button>
        }
      </mat-radio-group>

      @if (showWarning()) {
        <div class="status-warning">
          <mat-icon color="warn">warning</mat-icon>
          <span>{{ warningMessage() }}</span>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Anuluj</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!canSave()"
        (click)="save()"
      >
        Zmień status
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 350px;
    }

    .dialog-subtitle {
      margin-bottom: 24px;
      color: var(--mat-sys-on-surface-variant);
    }

    .status-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-option {
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--mat-sys-outline-variant);
      transition: all 0.15s ease;

      &:hover:not(.mat-mdc-radio-disabled) {
        border-color: var(--mat-sys-primary);
        background-color: var(--mat-sys-surface-container-low);
      }

      &.current {
        border-color: var(--mat-sys-primary);
        background-color: var(--mat-sys-primary-container);
      }

      &.mat-mdc-radio-disabled {
        opacity: 0.5;
      }
    }

    .status-option__content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .status-option__icon {
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    .status-option__text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .status-option__label {
      font-weight: 500;
    }

    .status-option__current {
      font-weight: normal;
      color: var(--mat-sys-primary);
      font-size: 12px;
    }

    .status-option__description {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .status-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      margin-top: 16px;
      border-radius: 8px;
      background-color: #fff3e0;
      color: #e65100;
      font-size: 14px;
    }
  `]
})
export class InvoiceStatusDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InvoiceStatusDialogComponent>);
  readonly data = inject<InvoiceStatusDialogData>(MAT_DIALOG_DATA);

  readonly statusOptions = STATUS_OPTIONS;

  selectedStatus: InvoiceStatus;

  constructor() {
    this.selectedStatus = this.data.currentStatus;
  }

  /**
   * Check if transition to given status is allowed.
   */
  canTransitionTo(targetStatus: InvoiceStatus): boolean {
    const current = this.data.currentStatus;

    // Same status is always "allowed" (no change)
    if (targetStatus === current) return true;

    // Define allowed transitions
    switch (current) {
      case 'draft':
        // Draft can go to unpaid (issue) or stay draft
        return targetStatus === 'unpaid';
      case 'unpaid':
        // Unpaid can go to paid or back to draft
        return targetStatus === 'paid' || targetStatus === 'draft';
      case 'paid':
        // Paid can go back to unpaid (correction scenario)
        return targetStatus === 'unpaid';
      default:
        return false;
    }
  }

  /**
   * Check if save button should be enabled.
   */
  canSave(): boolean {
    return this.selectedStatus !== this.data.currentStatus &&
           this.canTransitionTo(this.selectedStatus);
  }

  /**
   * Check if warning should be shown.
   */
  showWarning(): boolean {
    // Show warning when going from issued to draft
    return this.data.currentStatus === 'unpaid' && this.selectedStatus === 'draft';
  }

  /**
   * Get warning message.
   */
  warningMessage(): string {
    if (this.data.currentStatus === 'unpaid' && this.selectedStatus === 'draft') {
      return 'Zmiana statusu na szkic umożliwi edycję faktury, ale spowoduje cofnięcie jej wystawienia.';
    }
    return '';
  }

  /**
   * Save and close dialog.
   */
  save(): void {
    if (this.canSave()) {
      this.dialogRef.close(this.selectedStatus);
    }
  }
}
