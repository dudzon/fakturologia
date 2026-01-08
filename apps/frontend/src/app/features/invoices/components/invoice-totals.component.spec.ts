import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { InvoiceTotalsComponent } from './invoice-totals.component';
import type { InvoiceItemResponse } from '../../../../types';

describe('InvoiceTotalsComponent', () => {
  let component: InvoiceTotalsComponent;
  let fixture: ComponentFixture<InvoiceTotalsComponent>;

  beforeAll(() => {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceTotalsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceTotalsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  describe('default values', () => {
    it('should have empty items by default', () => {
      expect(component.items()).toEqual([]);
    });

    it('should have PLN currency by default', () => {
      expect(component.currency()).toBe('PLN');
    });

    it('should have zero totals by default', () => {
      expect(component.totalNet()).toBe('0.00');
      expect(component.totalVat()).toBe('0.00');
      expect(component.totalGross()).toBe('0.00');
    });
  });

  describe('computed total values', () => {
    it('should parse totalNet correctly', () => {
      fixture.componentRef.setInput('totalNet', '100.50');
      fixture.detectChanges();
      expect(component.totalNetValue()).toBe(100.5);
    });

    it('should parse totalVat correctly', () => {
      fixture.componentRef.setInput('totalVat', '23.12');
      fixture.detectChanges();
      expect(component.totalVatValue()).toBe(23.12);
    });

    it('should parse totalGross correctly', () => {
      fixture.componentRef.setInput('totalGross', '123.62');
      fixture.detectChanges();
      expect(component.totalGrossValue()).toBe(123.62);
    });

    it('should handle invalid numbers as 0', () => {
      fixture.componentRef.setInput('totalNet', 'invalid');
      fixture.detectChanges();
      expect(component.totalNetValue()).toBe(0);
    });

    it('should handle empty strings as 0', () => {
      fixture.componentRef.setInput('totalNet', '');
      fixture.detectChanges();
      expect(component.totalNetValue()).toBe(0);
    });
  });

  describe('VAT totals calculation', () => {
    const mockItems: InvoiceItemResponse[] = [
      {
        id: '1',
        position: 1,
        name: 'Item 1',
        quantity: '2',
        unit: 'szt.',
        unitPrice: '100.00',
        vatRate: '23',
        netAmount: '200.00',
        vatAmount: '46.00',
        grossAmount: '246.00',
      },
      {
        id: '2',
        position: 2,
        name: 'Item 2',
        quantity: '1',
        unit: 'szt.',
        unitPrice: '50.00',
        vatRate: '8',
        netAmount: '50.00',
        vatAmount: '4.00',
        grossAmount: '54.00',
      },
    ];

    it('should calculate VAT breakdown from items', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      const totals = component.vatTotals();
      expect(totals).toHaveLength(2);

      // 23% rate
      expect(totals[0].rate).toBe('23');
      expect(totals[0].netAmount).toBe(200);
      expect(totals[0].vatAmount).toBe(46);
      expect(totals[0].grossAmount).toBe(246);

      // 8% rate
      expect(totals[1].rate).toBe('8');
      expect(totals[1].netAmount).toBe(50);
      expect(totals[1].vatAmount).toBe(4);
      expect(totals[1].grossAmount).toBe(54);
    });

    it('should use totals when no items provided', () => {
      fixture.componentRef.setInput('totalNet', '100.00');
      fixture.componentRef.setInput('totalVat', '23.00');
      fixture.componentRef.setInput('totalGross', '123.00');
      fixture.detectChanges();

      const totals = component.vatTotals();
      expect(totals).toHaveLength(1);
      expect(totals[0].rate).toBe('23');
      expect(totals[0].netAmount).toBe(100);
      expect(totals[0].vatAmount).toBe(23);
      expect(totals[0].grossAmount).toBe(123);
    });

    it('should group items by VAT rate', () => {
      const multipleItemsSameRate: InvoiceItemResponse[] = [
        {
          id: '1',
          position: 1,
          name: 'Item 1',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '100.00',
          vatRate: '23',
          netAmount: '100.00',
          vatAmount: '23.00',
          grossAmount: '123.00',
        },
        {
          id: '2',
          position: 2,
          name: 'Item 2',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '50.00',
          vatRate: '23',
          netAmount: '50.00',
          vatAmount: '11.50',
          grossAmount: '61.50',
        },
      ];

      fixture.componentRef.setInput('items', multipleItemsSameRate);
      fixture.detectChanges();

      const totals = component.vatTotals();
      expect(totals).toHaveLength(1);
      expect(totals[0].netAmount).toBe(150);
      expect(totals[0].vatAmount).toBe(34.5);
      expect(totals[0].grossAmount).toBe(184.5);
    });

    it('should sort VAT rates correctly (23, 8, 5, 0, zw)', () => {
      const mixedRates: InvoiceItemResponse[] = [
        {
          id: '1',
          position: 1,
          name: 'Item 1',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '100',
          vatRate: 'zw',
          netAmount: '100',
          vatAmount: '0',
          grossAmount: '100',
        },
        {
          id: '2',
          position: 2,
          name: 'Item 2',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '100',
          vatRate: '23',
          netAmount: '100',
          vatAmount: '23',
          grossAmount: '123',
        },
        {
          id: '3',
          position: 3,
          name: 'Item 3',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '100',
          vatRate: '5',
          netAmount: '100',
          vatAmount: '5',
          grossAmount: '105',
        },
      ];

      fixture.componentRef.setInput('items', mixedRates);
      fixture.detectChanges();

      const totals = component.vatTotals();
      expect(totals.map((t) => t.rate)).toEqual(['23', '5', 'zw']);
    });

    it('should label zw rate correctly', () => {
      const zwItem: InvoiceItemResponse[] = [
        {
          id: '1',
          position: 1,
          name: 'Item',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '100',
          vatRate: 'zw',
          netAmount: '100',
          vatAmount: '0',
          grossAmount: '100',
        },
      ];

      fixture.componentRef.setInput('items', zwItem);
      fixture.detectChanges();

      const totals = component.vatTotals();
      expect(totals[0].rateLabel).toBe('zw.');
    });
  });

  describe('formatCurrency', () => {
    it('should format number with 2 decimal places', () => {
      const result = component.formatCurrency(100);
      expect(result).toBe('100,00');
    });

    it('should format number with Polish locale', () => {
      const result = component.formatCurrency(1234.56);
      // Locale formatting might vary in test environment
      expect(result).toMatch(/1[\s ]?234,56/);
    });

    it('should handle zero', () => {
      const result = component.formatCurrency(0);
      expect(result).toBe('0,00');
    });

    it('should handle negative numbers', () => {
      const result = component.formatCurrency(-50.5);
      expect(result).toBe('-50,50');
    });

    it('should round to 2 decimal places', () => {
      const result = component.formatCurrency(10.999);
      expect(result).toBe('11,00');
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      const mockItems: InvoiceItemResponse[] = [
        {
          id: '1',
          position: 1,
          name: 'Item 1',
          quantity: '1',
          unit: 'szt.',
          unitPrice: '100',
          vatRate: '23',
          netAmount: '100',
          vatAmount: '23',
          grossAmount: '123',
        },
      ];
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('currency', 'PLN');
      fixture.componentRef.setInput('totalNet', '100');
      fixture.componentRef.setInput('totalVat', '23');
      fixture.componentRef.setInput('totalGross', '123');
      fixture.detectChanges();
    });

    it('should display currency code', () => {
      const element = fixture.nativeElement as HTMLElement;
      const grandTotal = element.querySelector('.invoice-totals__grand-total-amount');
      expect(grandTotal?.textContent).toContain('PLN');
    });

    it('should display grand total amount', () => {
      const element = fixture.nativeElement as HTMLElement;
      const grandTotal = element.querySelector('.invoice-totals__grand-total-amount');
      expect(grandTotal?.textContent).toContain('123,00');
    });

    it('should display VAT breakdown table', () => {
      const element = fixture.nativeElement as HTMLElement;
      const table = element.querySelector('.invoice-totals__breakdown');
      expect(table).toBeTruthy();
    });

    it('should display correct number of VAT rate rows', () => {
      const element = fixture.nativeElement as HTMLElement;
      const rows = element.querySelectorAll('.invoice-totals__breakdown tbody tr');
      expect(rows.length).toBe(1);
    });

    it('should display "Do zapłaty:" label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const label = element.querySelector('.invoice-totals__grand-total-label');
      expect(label?.textContent).toBe('Do zapłaty:');
    });

    it('should display formatted amounts in table', () => {
      const element = fixture.nativeElement as HTMLElement;
      const cells = element.querySelectorAll('.invoice-totals__breakdown tbody td');
      expect(cells[0].textContent).toBe('23%');
      expect(cells[1].textContent?.trim()).toBe('100,00');
      expect(cells[2].textContent?.trim()).toBe('23,00');
      expect(cells[3].textContent?.trim()).toBe('123,00');
    });
  });
});
