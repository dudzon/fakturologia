import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { InvoiceStatus } from '../../../../types';

/**
 * ViewModel for invoice filters.
 */
export interface InvoiceFiltersViewModel {
  status: InvoiceStatus | null;
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

/**
 * Quick filter option configuration.
 */
interface QuickFilterOption {
  value: InvoiceStatus | null;
  label: string;
}

/**
 * Quick filter options.
 */
const QUICK_FILTERS: QuickFilterOption[] = [
  { value: null, label: 'Wszystkie' },
  { value: 'draft', label: 'Szkice' },
  { value: 'unpaid', label: 'Nieopłacone' },
  { value: 'paid', label: 'Opłacone' },
];

/**
 * InvoiceFiltersComponent - Filter panel for invoice list.
 *
 * Features:
 * - Quick status filter chips
 * - Date range picker
 * - Search input with debounce
 * - Clear filters button
 *
 * @example
 * ```html
 * <app-invoice-filters
 *   [filters]="currentFilters"
 *   (filtersChange)="onFiltersChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-invoice-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <div class="invoice-filters">
      <!-- Quick Filters -->
      <div class="invoice-filters__quick">
        @for (filter of quickFilters; track filter.value) {
          <button
            mat-stroked-button
            [class.active]="filters().status === filter.value"
            (click)="setStatus(filter.value)"
          >
            {{ filter.label }}
          </button>
        }
      </div>

      <!-- Advanced Filters Row -->
      <div class="invoice-filters__advanced">
        <!-- Date Range -->
        <mat-form-field
          appearance="outline"
          subscriptSizing="dynamic"
          class="invoice-filters__date-range"
        >
          <mat-label>Zakres dat</mat-label>
          <mat-date-range-input [rangePicker]="picker">
            <input
              matStartDate
              placeholder="Od"
              [ngModel]="dateFromValue()"
              (dateChange)="onDateFromChange($event.value)"
            />
            <input
              matEndDate
              placeholder="Do"
              [ngModel]="dateToValue()"
              (dateChange)="onDateToChange($event.value)"
            />
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
        </mat-form-field>

        <!-- Search -->
        <mat-form-field
          appearance="outline"
          subscriptSizing="dynamic"
          class="invoice-filters__search"
        >
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Szukaj</mat-label>
          <input
            matInput
            type="text"
            placeholder="Numer faktury lub nabywca..."
            [ngModel]="searchValue()"
            (ngModelChange)="onSearchChange($event)"
            aria-label="Szukaj faktur"
          />
          @if (searchValue()) {
            <button
              matSuffix
              mat-icon-button
              aria-label="Wyczyść wyszukiwanie"
              (click)="clearSearch()"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <!-- Clear Filters -->
        @if (hasActiveFilters()) {
          <button
            mat-button
            color="primary"
            class="invoice-filters__clear"
            (click)="clearAllFilters()"
          >
            <mat-icon>filter_alt_off</mat-icon>
            Wyczyść filtry
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .invoice-filters {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }

      .invoice-filters__quick {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        button {
          border-radius: 20px;

          &.active {
            background-color: var(--mat-sys-primary);
            color: var(--mat-sys-on-primary);
          }
        }
      }

      .invoice-filters__advanced {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: flex-start;
      }

      .invoice-filters__date-range {
        min-width: 280px;
      }

      .invoice-filters__search {
        flex: 1;
        min-width: 250px;
        max-width: 400px;
      }

      .invoice-filters__clear {
        align-self: center;
      }

      @media (max-width: 599px) {
        .invoice-filters__advanced {
          flex-direction: column;
        }

        .invoice-filters__date-range,
        .invoice-filters__search {
          width: 100%;
          max-width: none;
        }

        .invoice-filters__clear {
          width: 100%;
        }
      }
    `,
  ],
})
export class InvoiceFiltersComponent {
  /** Current filter values */
  readonly filters = input.required<InvoiceFiltersViewModel>();

  /** Emits when filters change */
  readonly filtersChange = output<InvoiceFiltersViewModel>();

  /** Quick filter options */
  readonly quickFilters = QUICK_FILTERS;

  /** Local search value for debouncing */
  readonly searchValue = signal('');

  /** Search subject for debouncing */
  private readonly searchSubject = new Subject<string>();

  /** Computed date values for date picker */
  readonly dateFromValue = computed(() => {
    const dateStr = this.filters().dateFrom;
    return dateStr ? new Date(dateStr) : null;
  });

  readonly dateToValue = computed(() => {
    const dateStr = this.filters().dateTo;
    return dateStr ? new Date(dateStr) : null;
  });

  /** Check if any filters are active */
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.status || f.dateFrom || f.dateTo || f.search);
  });

  constructor() {
    // Initialize search value from input
    const initialFilters = this.filters;

    // Set up search debouncing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => {
        this.emitChange({ search });
      });
  }

  /**
   * Set status filter.
   */
  setStatus(status: InvoiceStatus | null): void {
    this.emitChange({ status });
  }

  /**
   * Handle date from change.
   */
  onDateFromChange(date: Date | null): void {
    const dateFrom = date ? this.formatDate(date) : null;
    this.emitChange({ dateFrom });
  }

  /**
   * Handle date to change.
   */
  onDateToChange(date: Date | null): void {
    const dateTo = date ? this.formatDate(date) : null;
    this.emitChange({ dateTo });
  }

  /**
   * Handle search input change.
   */
  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.searchSubject.next(value);
  }

  /**
   * Clear search input.
   */
  clearSearch(): void {
    this.searchValue.set('');
    this.emitChange({ search: '' });
  }

  /**
   * Clear all filters.
   */
  clearAllFilters(): void {
    this.searchValue.set('');
    this.filtersChange.emit({
      status: null,
      dateFrom: null,
      dateTo: null,
      search: '',
    });
  }

  /**
   * Emit filter change with merged values.
   */
  private emitChange(changes: Partial<InvoiceFiltersViewModel>): void {
    this.filtersChange.emit({
      ...this.filters(),
      ...changes,
    });
  }

  /**
   * Format date to ISO string (YYYY-MM-DD).
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
