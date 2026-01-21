import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { generateInvoiceNumberPreview } from '../../../shared/validators/invoice-number-format.validator';

/**
 * InvoiceNumberPreviewComponent - Displays a preview of the invoice number
 * based on the provided format and counter.
 *
 * Shows the user how their invoice numbers will look with the current format.
 */
@Component({
  selector: 'app-invoice-number-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="preview-container">
      <div class="preview-label">
        <mat-icon>visibility</mat-icon>
        <span>Podgląd numeru faktury:</span>
      </div>
      @if (previewNumber()) {
        <div class="preview-number">{{ previewNumber() }}</div>
      } @else {
        <div class="preview-empty">Wprowadź format, aby zobaczyć podgląd</div>
      }
      <div class="preview-hint">Następna faktura będzie miała numer {{ counter() }}</div>
    </div>
  `,
  styles: [
    `
      .preview-container {
        background-color: var(--mat-sys-surface-variant);
        border-radius: 8px;
        padding: 16px;
        margin-top: 8px;
      }

      .preview-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 8px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .preview-number {
        font-size: 18px;
        font-weight: 500;
        font-family: 'Roboto Mono', monospace;
        color: var(--mat-sys-primary);
        background-color: var(--mat-sys-surface);
        padding: 8px 12px;
        border-radius: 4px;
        display: inline-block;
      }

      .preview-empty {
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
        font-style: italic;
      }

      .preview-hint {
        font-size: 11px;
        color: var(--mat-sys-on-surface-variant);
        margin-top: 8px;
      }
    `,
  ],
})
export class InvoiceNumberPreviewComponent {
  /**
   * The invoice number format with placeholders.
   * Example: "FV/{YYYY}/{MM}/{NNN}"
   */
  readonly format = input<string>('');

  /**
   * The current invoice counter (sequential number).
   */
  readonly counter = input<number>(1);

  /**
   * Computed preview number based on format and counter.
   */
  readonly previewNumber = computed(() => {
    const fmt = this.format();
    const cnt = this.counter();

    if (!fmt) {
      return '';
    }

    return generateInvoiceNumberPreview(fmt, cnt);
  });
}
