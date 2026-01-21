import { Component, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import type { InvoiceItemResponse, Currency } from '../../../../types';
import type { InvoiceItemFormModel } from '../../../stores/invoice-form.store';

/**
 * Item type that can be either response or form model.
 */
type InvoiceItem = InvoiceItemResponse | InvoiceItemFormModel;

/**
 * VAT totals grouped by rate.
 */
interface VatTotalRow {
  rate: string;
  rateLabel: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

/**
 * InvoiceTotalsComponent - Displays invoice totals summary.
 *
 * Shows:
 * - VAT breakdown by rate
 * - Total net, VAT, and gross amounts
 *
 * @example
 * ```html
 * <app-invoice-totals
 *   [items]="invoice.items"
 *   [currency]="invoice.currency"
 *   [totalNet]="invoice.totalNet"
 *   [totalVat]="invoice.totalVat"
 *   [totalGross]="invoice.totalGross"
 * />
 * ```
 */
@Component({
  selector: 'app-invoice-totals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoice-totals">
      <!-- VAT Breakdown Table -->
      <table class="invoice-totals__breakdown">
        <thead>
          <tr>
            <th>Stawka VAT</th>
            <th class="text-right">Netto</th>
            <th class="text-right">VAT</th>
            <th class="text-right">Brutto</th>
          </tr>
        </thead>
        <tbody>
          @for (row of vatTotals(); track row.rate) {
            <tr>
              <td>{{ row.rateLabel }}</td>
              <td class="text-right">{{ formatCurrency(row.netAmount) }}</td>
              <td class="text-right">{{ formatCurrency(row.vatAmount) }}</td>
              <td class="text-right">{{ formatCurrency(row.grossAmount) }}</td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr class="invoice-totals__summary-row">
            <td><strong>RAZEM</strong></td>
            <td class="text-right">
              <strong>{{ formatCurrency(totalNetValue()) }}</strong>
            </td>
            <td class="text-right">
              <strong>{{ formatCurrency(totalVatValue()) }}</strong>
            </td>
            <td class="text-right">
              <strong>{{ formatCurrency(totalGrossValue()) }}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Grand Total -->
      <div class="invoice-totals__grand-total">
        <span class="invoice-totals__grand-total-label">Do zapłaty:</span>
        <span class="invoice-totals__grand-total-amount">
          {{ formatCurrency(totalGrossValue()) }} {{ currency() }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .invoice-totals {
        margin-top: 24px;
      }

      .invoice-totals__breakdown {
        width: 100%;
        max-width: 500px;
        margin-left: auto;
        border-collapse: collapse;
        font-size: 14px;

        th,
        td {
          padding: 8px 12px;
          border: 1px solid var(--mat-sys-outline-variant);
        }

        th {
          background-color: var(--mat-sys-surface-container);
          font-weight: 500;
          text-align: left;
        }

        .text-right {
          text-align: right;
        }
      }

      .invoice-totals__summary-row {
        background-color: var(--mat-sys-surface-container-high);
      }

      .invoice-totals__grand-total {
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
        gap: 16px;
        margin-top: 16px;
        padding: 16px;
        background-color: var(--mat-sys-primary-container);
        border-radius: 8px;
      }

      .invoice-totals__grand-total-label {
        font-size: 16px;
        font-weight: 500;
      }

      .invoice-totals__grand-total-amount {
        font-size: 24px;
        font-weight: 700;
        color: var(--mat-sys-primary);
      }

      @media (max-width: 599px) {
        .invoice-totals__breakdown {
          font-size: 12px;

          th,
          td {
            padding: 6px 8px;
          }
        }

        .invoice-totals__grand-total {
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
      }
    `,
  ],
})
export class InvoiceTotalsComponent {
  /** Invoice items for VAT breakdown calculation */
  readonly items = input<InvoiceItem[]>([]);

  /** Currency code */
  readonly currency = input<Currency>('PLN');

  /** Total net amount as string */
  readonly totalNet = input<string>('0.00');

  /** Total VAT amount as string */
  readonly totalVat = input<string>('0.00');

  /** Total gross amount as string */
  readonly totalGross = input<string>('0.00');

  /** Parsed total net value */
  readonly totalNetValue = computed(() => parseFloat(this.totalNet()) || 0);

  /** Parsed total VAT value */
  readonly totalVatValue = computed(() => parseFloat(this.totalVat()) || 0);

  /** Parsed total gross value */
  readonly totalGrossValue = computed(() => parseFloat(this.totalGross()) || 0);

  /** VAT totals grouped by rate */
  readonly vatTotals = computed((): VatTotalRow[] => {
    const itemsList = this.items();
    if (!itemsList.length) {
      return [
        {
          rate: '23',
          rateLabel: '23%',
          netAmount: this.totalNetValue(),
          vatAmount: this.totalVatValue(),
          grossAmount: this.totalGrossValue(),
        },
      ];
    }

    // Group items by VAT rate
    const groups = new Map<string, VatTotalRow>();

    for (const item of itemsList) {
      const rate = item.vatRate;
      const rateLabel = rate === 'zw' ? 'zw.' : `${rate}%`;

      if (!groups.has(rate)) {
        groups.set(rate, {
          rate,
          rateLabel,
          netAmount: 0,
          vatAmount: 0,
          grossAmount: 0,
        });
      }

      const group = groups.get(rate)!;
      group.netAmount += parseFloat(item.netAmount) || 0;
      group.vatAmount += parseFloat(item.vatAmount) || 0;
      group.grossAmount += parseFloat(item.grossAmount) || 0;
    }

    // Sort by rate (descending), with 'zw' at the end
    const sortOrder = ['23', '8', '5', '0', 'zw'];
    return Array.from(groups.values()).sort((a, b) => {
      return sortOrder.indexOf(a.rate) - sortOrder.indexOf(b.rate);
    });
  });

  /**
   * Format number as currency.
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
