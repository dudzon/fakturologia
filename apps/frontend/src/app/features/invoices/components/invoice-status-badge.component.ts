import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import type { InvoiceStatus } from '../../../../types';

/**
 * Status configuration for display purposes.
 */
interface StatusConfig {
  label: string;
  icon: string;
  cssClass: string;
}

/**
 * Status configuration map.
 */
const STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  draft: {
    label: 'Szkic',
    icon: 'edit_note',
    cssClass: 'status-badge--draft',
  },
  unpaid: {
    label: 'Nieopłacona',
    icon: 'schedule',
    cssClass: 'status-badge--unpaid',
  },
  paid: {
    label: 'Opłacona',
    icon: 'check_circle',
    cssClass: 'status-badge--paid',
  },
};

/**
 * InvoiceStatusBadgeComponent - Displays invoice status as a colored chip.
 *
 * Shows appropriate icon, label, and color based on invoice status:
 * - draft: Gray/neutral styling
 * - unpaid: Warning/amber styling
 * - paid: Success/green styling
 *
 * @example
 * ```html
 * <app-invoice-status-badge [status]="invoice.status" />
 * ```
 */
@Component({
  selector: 'app-invoice-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    <span
      class="status-badge"
      [class]="config().cssClass"
      [attr.aria-label]="'Status: ' + config().label"
    >
      <mat-icon class="status-badge__icon">{{ config().icon }}</mat-icon>
      <span class="status-badge__label">{{ config().label }}</span>
    </span>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
      }

      .status-badge__icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .status-badge__label {
        line-height: 1;
      }

      .status-badge--draft {
        background-color: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
      }

      .status-badge--unpaid {
        background-color: #fff3e0;
        color: #e65100;
      }

      .status-badge--paid {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
    `,
  ],
})
export class InvoiceStatusBadgeComponent {
  /** Invoice status to display */
  readonly status = input.required<InvoiceStatus>();

  /** Computed status configuration */
  readonly config = computed(() => STATUS_CONFIG[this.status()]);
}
