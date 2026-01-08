import { computed, Injectable, signal } from '@angular/core';
import type { InvoiceItemRequest, VatRate, Currency } from '../../types';

/**
 * Invoice item form model with calculated fields.
 */
export interface InvoiceItemFormModel {
  id?: string;
  position: number;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  vatRate: VatRate;
  // Calculated fields
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
}

/**
 * Invoice form totals.
 */
export interface InvoiceTotalsModel {
  totalNet: number;
  totalVat: number;
  totalGross: number;
  vatBreakdown: Map<VatRate, { net: number; vat: number; gross: number }>;
}

/**
 * VAT rate percentages for calculation.
 */
const VAT_PERCENTAGES: Record<VatRate, number> = {
  '23': 0.23,
  '8': 0.08,
  '5': 0.05,
  '0': 0,
  zw: 0,
};

/**
 * InvoiceFormStore - Signal-based store for invoice form state.
 *
 * Manages:
 * - Invoice items with automatic calculations
 * - Totals computation (net, VAT, gross)
 * - VAT breakdown by rate
 * - Form dirty state
 */
@Injectable()
export class InvoiceFormStore {
  // State signals
  private readonly _items = signal<InvoiceItemFormModel[]>([]);
  private readonly _currency = signal<Currency>('PLN');
  private readonly _isDirty = signal(false);

  // Public readonly signals
  readonly items = this._items.asReadonly();
  readonly currency = this._currency.asReadonly();
  readonly isDirty = this._isDirty.asReadonly();

  // Computed totals
  readonly totals = computed((): InvoiceTotalsModel => {
    const itemsList = this._items();
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;
    const vatBreakdown = new Map<VatRate, { net: number; vat: number; gross: number }>();

    for (const item of itemsList) {
      const net = parseFloat(item.netAmount) || 0;
      const vat = parseFloat(item.vatAmount) || 0;
      const gross = parseFloat(item.grossAmount) || 0;

      totalNet += net;
      totalVat += vat;
      totalGross += gross;

      // Update VAT breakdown
      const rate = item.vatRate;
      const existing = vatBreakdown.get(rate) || { net: 0, vat: 0, gross: 0 };
      vatBreakdown.set(rate, {
        net: existing.net + net,
        vat: existing.vat + vat,
        gross: existing.gross + gross,
      });
    }

    return {
      totalNet,
      totalVat,
      totalGross,
      vatBreakdown,
    };
  });

  readonly totalNetFormatted = computed(() => this.totals().totalNet.toFixed(2));

  readonly totalVatFormatted = computed(() => this.totals().totalVat.toFixed(2));

  readonly totalGrossFormatted = computed(() => this.totals().totalGross.toFixed(2));

  readonly hasItems = computed(() => this._items().length > 0);

  /**
   * Initialize store with existing items (for edit mode).
   */
  initializeItems(items: InvoiceItemFormModel[]): void {
    this._items.set(items);
    this._isDirty.set(false);
  }

  /**
   * Set currency.
   */
  setCurrency(currency: Currency): void {
    this._currency.set(currency);
  }

  /**
   * Add a new empty item.
   */
  addItem(): void {
    const items = this._items();
    const newPosition = items.length + 1;

    const newItem: InvoiceItemFormModel = {
      position: newPosition,
      name: '',
      unit: 'szt.',
      quantity: '1',
      unitPrice: '0.00',
      vatRate: '23',
      netAmount: '0.00',
      vatAmount: '0.00',
      grossAmount: '0.00',
    };

    this._items.update((current) => [...current, newItem]);
    this._isDirty.set(true);
  }

  /**
   * Update an item at given index.
   */
  updateItem(index: number, updates: Partial<InvoiceItemFormModel>): void {
    this._items.update((current) => {
      const newItems = [...current];
      if (index >= 0 && index < newItems.length) {
        const item = { ...newItems[index], ...updates };
        // Recalculate amounts if relevant fields changed
        if ('quantity' in updates || 'unitPrice' in updates || 'vatRate' in updates) {
          const calculated = this.calculateItemAmounts(item);
          newItems[index] = { ...item, ...calculated };
        } else {
          newItems[index] = item;
        }
      }
      return newItems;
    });
    this._isDirty.set(true);
  }

  /**
   * Remove an item at given index.
   */
  removeItem(index: number): void {
    this._items.update((current) => {
      const newItems = current.filter((_, i) => i !== index);
      // Update positions
      return newItems.map((item, i) => ({ ...item, position: i + 1 }));
    });
    this._isDirty.set(true);
  }

  /**
   * Move item from one position to another.
   */
  moveItem(fromIndex: number, toIndex: number): void {
    this._items.update((current) => {
      const newItems = [...current];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      // Update positions
      return newItems.map((item, i) => ({ ...item, position: i + 1 }));
    });
    this._isDirty.set(true);
  }

  /**
   * Clear all items.
   */
  clearItems(): void {
    this._items.set([]);
    this._isDirty.set(true);
  }

  /**
   * Mark form as pristine.
   */
  markAsPristine(): void {
    this._isDirty.set(false);
  }

  /**
   * Get items as request DTOs.
   */
  getItemsForRequest(): InvoiceItemRequest[] {
    return this._items().map((item) => ({
      id: item.id,
      position: item.position,
      name: item.name,
      unit: item.unit || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
    }));
  }

  /**
   * Calculate item amounts based on quantity, unit price, and VAT rate.
   */
  private calculateItemAmounts(
    item: InvoiceItemFormModel,
  ): Pick<InvoiceItemFormModel, 'netAmount' | 'vatAmount' | 'grossAmount'> {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const vatPercentage = VAT_PERCENTAGES[item.vatRate];

    const netAmount = quantity * unitPrice;
    const vatAmount = netAmount * vatPercentage;
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount: netAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      grossAmount: grossAmount.toFixed(2),
    };
  }

  /**
   * Reset store to initial state.
   */
  reset(): void {
    this._items.set([]);
    this._currency.set('PLN');
    this._isDirty.set(false);
  }
}
