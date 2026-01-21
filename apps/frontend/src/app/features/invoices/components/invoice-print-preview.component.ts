import { Component, input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { InvoiceTotalsComponent } from './invoice-totals.component';
import { AmountToWordsService } from '../../../core/services/amount-to-words.service';
import type { InvoiceResponse } from '../../../../types';

/**
 * Payment method labels.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfer: 'Przelew',
  cash: 'Gotówka',
  card: 'Karta',
};

/**
 * InvoicePrintPreviewComponent - Print-like preview of invoice.
 *
 * Displays full invoice data in A4-like format:
 * - Header with seller info and logo
 * - Invoice title and dates
 * - Buyer information
 * - Items table
 * - Totals breakdown
 * - Amount in words
 * - Notes and bank info
 *
 * @example
 * ```html
 * <app-invoice-print-preview [invoice]="invoiceData" />
 * ```
 */
@Component({
  selector: 'app-invoice-print-preview',
  standalone: true,
  imports: [CommonModule, InvoiceTotalsComponent],
  template: `
    <div class="invoice-preview">
      <!-- Header: Seller Info & Logo -->
      <header class="invoice-preview__header">
        <div class="invoice-preview__seller">
          <h2 class="invoice-preview__seller-title">Sprzedawca</h2>
          <p class="invoice-preview__company-name">{{ invoice().seller.companyName }}</p>
          <p class="invoice-preview__address">{{ invoice().seller.address }}</p>
          <p class="invoice-preview__nip">NIP: {{ invoice().seller.nip }}</p>
        </div>

        @if (invoice().seller.logoUrl) {
          <div class="invoice-preview__logo">
            <img
              [src]="invoice().seller.logoUrl"
              alt="Logo firmy"
              class="invoice-preview__logo-img"
            />
          </div>
        }
      </header>

      <!-- Invoice Title & Number -->
      <div class="invoice-preview__title-section">
        <h1 class="invoice-preview__title">FAKTURA VAT</h1>
        <p class="invoice-preview__number">nr {{ invoice().invoiceNumber }}</p>
      </div>

      <!-- Dates Row -->
      <div class="invoice-preview__dates">
        <div class="invoice-preview__date-item">
          <span class="invoice-preview__date-label">Data wystawienia:</span>
          <span class="invoice-preview__date-value">{{
            invoice().issueDate | date: 'dd.MM.yyyy'
          }}</span>
        </div>
        <div class="invoice-preview__date-item">
          <span class="invoice-preview__date-label">Data sprzedaży:</span>
          <span class="invoice-preview__date-value">{{
            invoice().issueDate | date: 'dd.MM.yyyy'
          }}</span>
        </div>
        <div class="invoice-preview__date-item">
          <span class="invoice-preview__date-label">Termin płatności:</span>
          <span class="invoice-preview__date-value">{{
            invoice().dueDate | date: 'dd.MM.yyyy'
          }}</span>
        </div>
        <div class="invoice-preview__date-item">
          <span class="invoice-preview__date-label">Metoda płatności:</span>
          <span class="invoice-preview__date-value">{{ getPaymentMethodLabel() }}</span>
        </div>
      </div>

      <!-- Buyer Info -->
      <section class="invoice-preview__buyer">
        <h2 class="invoice-preview__section-title">Nabywca</h2>
        <p class="invoice-preview__company-name">{{ invoice().buyer.name }}</p>
        @if (invoice().buyer.address) {
          <p class="invoice-preview__address">{{ invoice().buyer.address }}</p>
        }
        @if (invoice().buyer.nip) {
          <p class="invoice-preview__nip">NIP: {{ invoice().buyer.nip }}</p>
        }
      </section>

      <!-- Items Table -->
      <section class="invoice-preview__items">
        <h2 class="invoice-preview__section-title">Pozycje faktury</h2>
        <div class="invoice-preview__items-table-container">
          <table class="invoice-preview__items-table">
            <thead>
              <tr>
                <th class="col-lp">Lp.</th>
                <th class="col-name">Nazwa towaru/usługi</th>
                <th class="col-unit">J.m.</th>
                <th class="col-qty">Ilość</th>
                <th class="col-price">Cena netto</th>
                <th class="col-vat">VAT</th>
                <th class="col-net">Wartość netto</th>
                <th class="col-gross">Wartość brutto</th>
              </tr>
            </thead>
            <tbody>
              @for (item of invoice().items; track item.id; let i = $index) {
                <tr>
                  <td class="col-lp">{{ i + 1 }}</td>
                  <td class="col-name">{{ item.name }}</td>
                  <td class="col-unit">{{ item.unit || 'szt.' }}</td>
                  <td class="col-qty">{{ formatNumber(item.quantity) }}</td>
                  <td class="col-price">{{ formatCurrency(item.unitPrice) }}</td>
                  <td class="col-vat">{{ formatVatRate(item.vatRate) }}</td>
                  <td class="col-net">{{ formatCurrency(item.netAmount) }}</td>
                  <td class="col-gross">{{ formatCurrency(item.grossAmount) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Totals -->
      <app-invoice-totals
        [items]="invoice().items"
        [currency]="invoice().currency"
        [totalNet]="invoice().totalNet"
        [totalVat]="invoice().totalVat"
        [totalGross]="invoice().totalGross"
      />

      <!-- Amount in Words -->
      <section class="invoice-preview__amount-words">
        <span class="invoice-preview__amount-words-label">Słownie:</span>
        <span class="invoice-preview__amount-words-value">
          {{ amountInWords() }}
        </span>
      </section>

      <!-- Notes -->
      @if (invoice().notes) {
        <section class="invoice-preview__notes">
          <h2 class="invoice-preview__section-title">Uwagi</h2>
          <p class="invoice-preview__notes-text">{{ invoice().notes }}</p>
        </section>
      }

      <!-- Bank Info -->
      <section class="invoice-preview__bank-info">
        <h2 class="invoice-preview__section-title">Dane do przelewu</h2>
        <p class="invoice-preview__bank-account">
          <span class="invoice-preview__bank-label">Numer konta:</span>
          <span class="invoice-preview__bank-value">{{
            formatIban(invoice().seller.bankAccount)
          }}</span>
        </p>
      </section>

      <!-- Footer -->
      <footer class="invoice-preview__footer">
        <div class="invoice-preview__signature">
          <div class="invoice-preview__signature-line"></div>
          <span>Podpis osoby upoważnionej do wystawienia</span>
        </div>
        <div class="invoice-preview__signature">
          <div class="invoice-preview__signature-line"></div>
          <span>Podpis osoby upoważnionej do odbioru</span>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .invoice-preview {
        padding: 40px;
        background: white;
        color: #333;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      /* Header */
      .invoice-preview__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 2px solid #e0e0e0;
      }

      .invoice-preview__seller-title {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: #666;
      }

      .invoice-preview__company-name {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 600;
      }

      .invoice-preview__address,
      .invoice-preview__nip {
        margin: 0 0 4px;
        color: #555;
      }

      .invoice-preview__logo {
        flex-shrink: 0;
        max-width: 150px;
      }

      .invoice-preview__logo-img {
        max-width: 100%;
        max-height: 80px;
        object-fit: contain;
      }

      /* Title */
      .invoice-preview__title-section {
        text-align: center;
        margin-bottom: 24px;
      }

      .invoice-preview__title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 2px;
      }

      .invoice-preview__number {
        margin: 4px 0 0;
        font-size: 16px;
        color: #666;
      }

      /* Dates */
      .invoice-preview__dates {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px 24px;
        margin-bottom: 32px;
        padding: 16px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .invoice-preview__date-item {
        display: flex;
        gap: 8px;
      }

      .invoice-preview__date-label {
        color: #666;
      }

      .invoice-preview__date-value {
        font-weight: 500;
      }

      /* Buyer */
      .invoice-preview__buyer {
        margin-bottom: 32px;
        padding: 16px;
        background: #fafafa;
        border-left: 4px solid var(--mat-sys-primary, #1976d2);
        border-radius: 0 8px 8px 0;
      }

      .invoice-preview__section-title {
        margin: 0 0 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: #666;
      }

      /* Items Table */
      .invoice-preview__items {
        margin-bottom: 24px;
      }

      .invoice-preview__items-table-container {
        overflow-x: auto;
      }

      .invoice-preview__items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;

        th,
        td {
          padding: 10px 8px;
          border: 1px solid #e0e0e0;
          text-align: left;
        }

        th {
          background: #f5f5f5;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          color: #555;
        }

        tbody tr:nth-child(even) {
          background: #fafafa;
        }

        .col-lp {
          width: 40px;
          text-align: center;
        }
        .col-name {
          min-width: 200px;
        }
        .col-unit {
          width: 60px;
          text-align: center;
        }
        .col-qty {
          width: 70px;
          text-align: right;
        }
        .col-price {
          width: 100px;
          text-align: right;
        }
        .col-vat {
          width: 60px;
          text-align: center;
        }
        .col-net {
          width: 110px;
          text-align: right;
        }
        .col-gross {
          width: 110px;
          text-align: right;
        }
      }

      /* Amount in Words */
      .invoice-preview__amount-words {
        display: flex;
        gap: 8px;
        margin: 24px 0;
        padding: 12px 16px;
        background: #fff3e0;
        border-radius: 8px;
        font-size: 14px;
      }

      .invoice-preview__amount-words-label {
        font-weight: 500;
        flex-shrink: 0;
      }

      .invoice-preview__amount-words-value {
        font-style: italic;
      }

      /* Notes */
      .invoice-preview__notes {
        margin-bottom: 24px;
        padding: 16px;
        background: #f9f9f9;
        border-radius: 8px;
      }

      .invoice-preview__notes-text {
        margin: 0;
        white-space: pre-wrap;
      }

      /* Bank Info */
      .invoice-preview__bank-info {
        margin-bottom: 48px;
        padding: 16px;
        background: #e3f2fd;
        border-radius: 8px;
      }

      .invoice-preview__bank-account {
        margin: 0;
        display: flex;
        gap: 12px;
      }

      .invoice-preview__bank-label {
        color: #555;
      }

      .invoice-preview__bank-value {
        font-family: 'Courier New', monospace;
        font-weight: 600;
        letter-spacing: 1px;
      }

      /* Footer */
      .invoice-preview__footer {
        display: flex;
        justify-content: space-between;
        gap: 48px;
        margin-top: 48px;
        padding-top: 32px;
      }

      .invoice-preview__signature {
        flex: 1;
        text-align: center;
        font-size: 11px;
        color: #888;
      }

      .invoice-preview__signature-line {
        height: 1px;
        background: #ccc;
        margin-bottom: 8px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .invoice-preview {
          padding: 24px 16px;
        }

        .invoice-preview__header {
          flex-direction: column-reverse;
          gap: 16px;
        }

        .invoice-preview__logo {
          align-self: flex-end;
        }

        .invoice-preview__title {
          font-size: 22px;
        }

        .invoice-preview__dates {
          grid-template-columns: 1fr;
        }

        .invoice-preview__footer {
          flex-direction: column;
          gap: 32px;
        }
      }

      @media print {
        .invoice-preview {
          padding: 0;
          box-shadow: none;
        }
      }
    `,
  ],
})
export class InvoicePrintPreviewComponent {
  private readonly amountToWordsService = inject(AmountToWordsService);

  /** Invoice data to display */
  readonly invoice = input.required<InvoiceResponse>();

  /**
   * Get payment method label.
   */
  getPaymentMethodLabel(): string {
    return PAYMENT_METHOD_LABELS[this.invoice().paymentMethod] || this.invoice().paymentMethod;
  }

  /**
   * Get amount in words.
   */
  amountInWords(): string {
    const amount = parseFloat(this.invoice().totalGross) || 0;
    const currency = this.invoice().currency;
    return this.amountToWordsService.convert(amount, currency);
  }

  /**
   * Format number for display.
   */
  formatNumber(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Format currency value.
   */
  formatCurrency(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Format VAT rate for display.
   */
  formatVatRate(rate: string): string {
    return rate === 'zw' ? 'zw.' : `${rate}%`;
  }

  /**
   * Format IBAN for display (groups of 4).
   */
  formatIban(iban: string | null): string {
    if (!iban) return '-';
    // Remove spaces and format in groups of 4
    const clean = iban.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || iban;
  }
}
