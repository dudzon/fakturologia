import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { InvoiceFiltersComponent, InvoiceFiltersViewModel } from './invoice-filters.component';
import { signal } from '@angular/core';

describe('InvoiceFiltersComponent', () => {
  let component: InvoiceFiltersComponent;
  let fixture: ComponentFixture<InvoiceFiltersComponent>;

  const defaultFilters: InvoiceFiltersViewModel = {
    status: null,
    dateFrom: null,
    dateTo: null,
    search: ''
  };

  beforeAll(() => {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceFiltersComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filters', defaultFilters);
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have quick filter options', () => {
      expect(component.quickFilters).toBeDefined();
      expect(component.quickFilters.length).toBe(4);
      expect(component.quickFilters[0].label).toBe('Wszystkie');
    });

    it('should initialize search value as empty', () => {
      fixture.detectChanges();
      expect(component.searchValue()).toBe('');
    });
  });

  describe('computed values', () => {
    it('should compute dateFromValue as null when no date', () => {
      fixture.detectChanges();
      expect(component.dateFromValue()).toBeNull();
    });

    it('should compute dateFromValue from string', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        dateFrom: '2024-01-15'
      });
      fixture.detectChanges();

      const date = component.dateFromValue();
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toContain('2024-01-15');
    });

    it('should compute dateToValue as null when no date', () => {
      fixture.detectChanges();
      expect(component.dateToValue()).toBeNull();
    });

    it('should compute dateToValue from string', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        dateTo: '2024-01-31'
      });
      fixture.detectChanges();

      const date = component.dateToValue();
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toContain('2024-01-31');
    });

    it('should compute hasActiveFilters as false when no filters', () => {
      fixture.detectChanges();
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should detect active status filter', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        status: 'paid'
      });
      fixture.detectChanges();
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should detect active date filter', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        dateFrom: '2024-01-01'
      });
      fixture.detectChanges();
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should detect active search filter', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        search: 'test'
      });
      fixture.detectChanges();
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('setStatus', () => {
    it('should emit filter change with new status', () => {
      return new Promise<void>((resolve) => {
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.status).toBe('paid');
          resolve();
        });

        component.setStatus('paid');
      });
    });

    it('should emit null status when clearing', () => {
      return new Promise<void>((resolve) => {
        fixture.componentRef.setInput('filters', {
          ...defaultFilters,
          status: 'paid'
        });
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.status).toBeNull();
          resolve();
        });

        component.setStatus(null);
      });
    });

    it('should preserve other filter values', () => {
      return new Promise<void>((resolve) => {
        fixture.componentRef.setInput('filters', {
          ...defaultFilters,
          search: 'test',
          dateFrom: '2024-01-01'
        });
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.status).toBe('draft');
          expect(filters.search).toBe('test');
          expect(filters.dateFrom).toBe('2024-01-01');
          resolve();
        });

        component.setStatus('draft');
      });
    });
  });

  describe('date handling', () => {
    it('should emit dateFrom change with formatted date', () => {
      return new Promise<void>((resolve) => {
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.dateFrom).toBe('2024-01-15');
          resolve();
        });

        component.onDateFromChange(new Date('2024-01-15'));
      });
    });

    it('should emit null when clearing dateFrom', () => {
      return new Promise<void>((resolve) => {
        fixture.componentRef.setInput('filters', {
          ...defaultFilters,
          dateFrom: '2024-01-01'
        });
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.dateFrom).toBeNull();
          resolve();
        });

        component.onDateFromChange(null);
      });
    });

    it('should emit dateTo change with formatted date', () => {
      return new Promise<void>((resolve) => {
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.dateTo).toBe('2024-01-31');
          resolve();
        });

        component.onDateToChange(new Date('2024-01-31'));
      });
    });

    it('should emit null when clearing dateTo', () => {
      return new Promise<void>((resolve) => {
        fixture.componentRef.setInput('filters', {
          ...defaultFilters,
          dateTo: '2024-01-31'
        });
        fixture.detectChanges();

        component.filtersChange.subscribe((filters) => {
          expect(filters.dateTo).toBeNull();
          resolve();
        });

        component.onDateToChange(null);
      });
    });
  });

  describe('search handling', () => {
    it('should update searchValue signal', () => {
      fixture.detectChanges();

      component.onSearchChange('test query');
      expect(component.searchValue()).toBe('test query');
    });

    it('should debounce search emissions', async () => {
      fixture.detectChanges();
      let emissionCount = 0;

      component.filtersChange.subscribe(() => {
        emissionCount++;
      });

      // Trigger multiple rapid changes
      component.onSearchChange('t');
      component.onSearchChange('te');
      component.onSearchChange('tes');
      component.onSearchChange('test');

      // Wait for debounce (300ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should only emit once after debounce
      expect(emissionCount).toBe(1);
    });

    it('should clear search value', () => {
      return new Promise<void>((resolve) => {
        fixture.componentRef.setInput('filters', {
          ...defaultFilters,
          search: 'test'
        });
        fixture.detectChanges();
        component.searchValue.set('test');

        component.filtersChange.subscribe((filters) => {
          expect(filters.search).toBe('');
          expect(component.searchValue()).toBe('');
          resolve();
        });

        component.clearSearch();
      });
    });
  });

  describe('clearAllFilters', () => {
    it('should reset all filters to default', () => {
      return new Promise<void>((resolve) => {
        fixture.componentRef.setInput('filters', {
          status: 'paid',
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
          search: 'test'
        });
        fixture.detectChanges();
        component.searchValue.set('test');

        component.filtersChange.subscribe((filters) => {
          expect(filters.status).toBeNull();
          expect(filters.dateFrom).toBeNull();
          expect(filters.dateTo).toBeNull();
          expect(filters.search).toBe('');
          expect(component.searchValue()).toBe('');
          resolve();
        });

        component.clearAllFilters();
      });
    });
  });

  describe('rendering', () => {
    it('should render quick filter buttons', () => {
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const buttons = element.querySelectorAll('.invoice-filters__quick button');
      expect(buttons.length).toBe(4);
    });

    it('should mark active status button', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        status: 'paid'
      });
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const buttons = element.querySelectorAll('.invoice-filters__quick button');

      // The 4th button should be 'Opłacone' (paid)
      const paidButton = Array.from(buttons).find(btn =>
        btn.textContent?.trim() === 'Opłacone'
      );
      expect(paidButton?.classList.contains('active')).toBe(true);
    });

    it('should show clear filters button when filters are active', () => {
      fixture.componentRef.setInput('filters', {
        ...defaultFilters,
        status: 'paid'
      });
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const clearButton = element.querySelector('.invoice-filters__clear');
      expect(clearButton).toBeTruthy();
      expect(clearButton?.textContent).toContain('Wyczyść filtry');
    });

    it('should hide clear filters button when no filters active', () => {
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const clearButton = element.querySelector('.invoice-filters__clear');
      expect(clearButton).toBeFalsy();
    });

    it('should render search input', () => {
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const searchInput = element.querySelector('.invoice-filters__search input');
      expect(searchInput).toBeTruthy();
      expect(searchInput?.getAttribute('placeholder')).toBe('Numer faktury lub nabywca...');
    });

    it('should render date range picker', () => {
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const dateRange = element.querySelector('.invoice-filters__date-range');
      expect(dateRange).toBeTruthy();
    });
  });
});
