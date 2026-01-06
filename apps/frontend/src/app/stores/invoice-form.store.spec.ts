import { InvoiceFormStore, InvoiceItemFormModel } from './invoice-form.store';
import type { VatRate, Currency } from '../../types';

describe('InvoiceFormStore', () => {
  let store: InvoiceFormStore;

  beforeEach(() => {
    store = new InvoiceFormStore();
  });

  describe('initial state', () => {
    it('should initialize with empty items', () => {
      expect(store.items()).toEqual([]);
      expect(store.isDirty()).toBe(false);
    });

    it('should initialize with PLN currency', () => {
      expect(store.currency()).toBe('PLN');
    });
  });

  describe('totals calculation', () => {
    it('should calculate totals for empty items', () => {
      const totals = store.totals();
      expect(totals.totalNet).toBe(0);
      expect(totals.totalVat).toBe(0);
      expect(totals.totalGross).toBe(0);
      expect(totals.vatBreakdown.size).toBe(0);
    });

    it('should calculate totals for single item', () => {
      const item: InvoiceItemFormModel = {
        position: 1,
        name: 'Test Item',
        unit: 'szt',
        quantity: '2',
        unitPrice: '100.00',
        vatRate: '23',
        netAmount: '200.00',
        vatAmount: '46.00',
        grossAmount: '246.00',
      };

      store.initializeItems([item]);

      const totals = store.totals();
      expect(totals.totalNet).toBe(200);
      expect(totals.totalVat).toBe(46);
      expect(totals.totalGross).toBe(246);
      expect(totals.vatBreakdown.get('23')).toEqual({
        net: 200,
        vat: 46,
        gross: 246,
      });
    });

    it('should calculate totals for multiple items with different VAT rates', () => {
      const item1: InvoiceItemFormModel = {
        position: 1,
        name: 'Item 1',
        unit: 'szt',
        quantity: '1',
        unitPrice: '100.00',
        vatRate: '23',
        netAmount: '100.00',
        vatAmount: '23.00',
        grossAmount: '123.00',
      };

      const item2: InvoiceItemFormModel = {
        position: 2,
        name: 'Item 2',
        unit: 'szt',
        quantity: '1',
        unitPrice: '50.00',
        vatRate: '8',
        netAmount: '50.00',
        vatAmount: '4.00',
        grossAmount: '54.00',
      };

      store.initializeItems([item1, item2]);

      const totals = store.totals();
      expect(totals.totalNet).toBe(150);
      expect(totals.totalVat).toBe(27);
      expect(totals.totalGross).toBe(177);

      expect(totals.vatBreakdown.get('23')).toEqual({
        net: 100,
        vat: 23,
        gross: 123,
      });
      expect(totals.vatBreakdown.get('8')).toEqual({
        net: 50,
        vat: 4,
        gross: 54,
      });
    });

    it('should handle zero VAT rate', () => {
      const item: InvoiceItemFormModel = {
        position: 1,
        name: 'Zero VAT Item',
        unit: 'szt',
        quantity: '1',
        unitPrice: '100.00',
        vatRate: '0',
        netAmount: '100.00',
        vatAmount: '0.00',
        grossAmount: '100.00',
      };

      store.initializeItems([item]);

      const totals = store.totals();
      expect(totals.totalNet).toBe(100);
      expect(totals.totalVat).toBe(0);
      expect(totals.totalGross).toBe(100);
    });

    it('should handle zw (exempt) VAT rate', () => {
      const item: InvoiceItemFormModel = {
        position: 1,
        name: 'Exempt Item',
        unit: 'szt',
        quantity: '1',
        unitPrice: '100.00',
        vatRate: 'zw',
        netAmount: '100.00',
        vatAmount: '0.00',
        grossAmount: '100.00',
      };

      store.initializeItems([item]);

      const totals = store.totals();
      expect(totals.totalNet).toBe(100);
      expect(totals.totalVat).toBe(0);
      expect(totals.totalGross).toBe(100);
    });

    it('should handle invalid numeric values', () => {
      const item: InvoiceItemFormModel = {
        position: 1,
        name: 'Invalid Item',
        unit: 'szt',
        quantity: '1',
        unitPrice: '100.00',
        vatRate: '23',
        netAmount: 'invalid',
        vatAmount: 'invalid',
        grossAmount: 'invalid',
      };

      store.initializeItems([item]);

      const totals = store.totals();
      expect(totals.totalNet).toBe(0);
      expect(totals.totalVat).toBe(0);
      expect(totals.totalGross).toBe(0);
    });
  });

  describe('formatted totals', () => {
    it('should format total net with 2 decimal places', () => {
      const item: InvoiceItemFormModel = {
        position: 1,
        name: 'Test Item',
        unit: 'szt',
        quantity: '1',
        unitPrice: '123.456',
        vatRate: '23',
        netAmount: '123.456',
        vatAmount: '28.39',
        grossAmount: '151.85',
      };

      store.initializeItems([item]);

      expect(store.totalNetFormatted()).toBe('123.46');
    });
  });

  describe('item management', () => {
    let item: InvoiceItemFormModel;

    beforeEach(() => {
      item = {
        position: 1,
        name: 'Test Item',
        unit: 'szt',
        quantity: '2',
        unitPrice: '100.00',
        vatRate: '23',
        netAmount: '200.00',
        vatAmount: '46.00',
        grossAmount: '246.00',
      };
    });

    it('should add empty item', () => {
      store.addItem();
      expect(store.items()).toHaveLength(1);
      expect(store.items()[0].name).toBe('');
      expect(store.items()[0].position).toBe(1);
    });

    it('should update item', () => {
      store.initializeItems([item]);
      const updatedItem = { ...item, name: 'Updated Item' };
      store.updateItem(0, updatedItem);
      expect(store.items()[0].name).toBe('Updated Item');
    });

    it('should remove item', () => {
      store.initializeItems([item]);
      store.removeItem(0);
      expect(store.items()).toHaveLength(0);
    });

    it('should check if has items', () => {
      expect(store.hasItems()).toBe(false);
      store.initializeItems([item]);
      expect(store.hasItems()).toBe(true);
    });

    it('should reset items', () => {
      store.initializeItems([item]);
      store.reset();
      expect(store.items()).toHaveLength(0);
    });
  });

  describe('dirty state', () => {
    it('should mark as dirty when items change', () => {
      store.addItem();
      expect(store.isDirty()).toBe(true);
    });

    it('should reset dirty state', () => {
      store.addItem();
      expect(store.isDirty()).toBe(true);
      store.markAsPristine();
      expect(store.isDirty()).toBe(false);
    });
  });

  describe('currency management', () => {
    it('should update currency', () => {
      store.setCurrency('EUR');
      expect(store.currency()).toBe('EUR');
    });
  });
});
