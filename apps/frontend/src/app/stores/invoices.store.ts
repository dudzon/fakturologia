import { computed, inject, Injectable, signal } from '@angular/core';
import { InvoiceService } from '../services/invoice.service';
import type {
  InvoiceListItem,
  InvoiceListQuery,
  InvoiceStatus,
  PaginationInfo
} from '../../types';

/**
 * Cache TTL in milliseconds (5 minutes).
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Default query parameters for invoice list.
 */
const DEFAULT_QUERY: InvoiceListQuery = {
  page: 1,
  limit: 20,
  sortBy: 'issueDate',
  sortOrder: 'desc'
};

/**
 * InvoicesStore - Injectable service for managing invoices list state.
 *
 * Features:
 * - Caching with 5-minute TTL
 * - Pagination state management
 * - Filtering by status, dates, and search
 * - Loading and error states
 * - Optimistic updates for delete operations
 */
@Injectable({ providedIn: 'root' })
export class InvoicesStore {
  private readonly invoiceService = inject(InvoiceService);

  // State signals
  private readonly _invoices = signal<InvoiceListItem[]>([]);
  private readonly _pagination = signal<PaginationInfo | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetch = signal<number | null>(null);
  private readonly _query = signal<InvoiceListQuery>(DEFAULT_QUERY);

  // Public readonly signals
  readonly invoices = this._invoices.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly query = this._query.asReadonly();

  // Computed signals
  readonly isCacheValid = computed(() => {
    const lastFetch = this._lastFetch();
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_TTL;
  });

  readonly isEmpty = computed(() =>
    this._invoices().length === 0 && !this._loading()
  );

  readonly totalCount = computed(() => this._pagination()?.total ?? 0);

  readonly currentPage = computed(() => this._query().page ?? 1);

  readonly pageSize = computed(() => this._query().limit ?? 20);

  readonly activeStatus = computed(() => this._query().status ?? null);

  readonly hasFilters = computed(() => {
    const q = this._query();
    return !!(q.status || q.search || q.dateFrom || q.dateTo);
  });

  /**
   * Load invoices from API with optional query parameters.
   * Respects cache TTL unless forceRefresh is true.
   */
  async loadInvoices(query?: InvoiceListQuery, forceRefresh = false): Promise<void> {
    // Merge query with existing state
    const mergedQuery: InvoiceListQuery = {
      ...this._query(),
      ...query
    };

    // Check cache validity (only if query hasn't changed significantly)
    const queryChanged =
      JSON.stringify(mergedQuery) !== JSON.stringify(this._query());

    if (!forceRefresh && !queryChanged && this.isCacheValid()) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    this._query.set(mergedQuery);

    try {
      const response = await this.invoiceService.list(mergedQuery).toPromise();

      if (response) {
        this._invoices.set(response.data);
        this._pagination.set(response.pagination);
        this._lastFetch.set(Date.now());
      }
    } catch (error) {
      this._error.set(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas ładowania faktur'
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update query parameters and reload invoices.
   */
  async updateQuery(query: Partial<InvoiceListQuery>): Promise<void> {
    const newQuery: InvoiceListQuery = {
      ...this._query(),
      ...query
    };

    // Reset to page 1 if search, status, or date filters change
    if (
      query.search !== undefined ||
      query.status !== undefined ||
      query.dateFrom !== undefined ||
      query.dateTo !== undefined ||
      query.sortBy !== undefined ||
      query.sortOrder !== undefined
    ) {
      newQuery.page = 1;
    }

    await this.loadInvoices(newQuery, true);
  }

  /**
   * Set status filter and reload invoices.
   */
  async setStatusFilter(status: InvoiceStatus | null): Promise<void> {
    await this.updateQuery({ status: status ?? undefined });
  }

  /**
   * Set date range filter and reload invoices.
   */
  async setDateFilter(dateFrom?: string, dateTo?: string): Promise<void> {
    await this.updateQuery({ dateFrom, dateTo });
  }

  /**
   * Set search query and reload invoices.
   */
  async setSearch(search: string): Promise<void> {
    await this.updateQuery({ search: search || undefined });
  }

  /**
   * Clear all filters and reload invoices.
   */
  async clearFilters(): Promise<void> {
    await this.loadInvoices({
      ...DEFAULT_QUERY,
      page: 1
    }, true);
  }

  /**
   * Delete an invoice (optimistic update).
   */
  async deleteInvoice(id: string): Promise<boolean> {
    const previousInvoices = this._invoices();

    // Optimistic removal
    this._invoices.set(previousInvoices.filter((inv) => inv.id !== id));

    try {
      await this.invoiceService.delete(id).toPromise();

      // Invalidate cache to refresh pagination
      this._lastFetch.set(null);

      return true;
    } catch (error) {
      // Rollback on error
      this._invoices.set(previousInvoices);
      this._error.set(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas usuwania faktury'
      );
      return false;
    }
  }

  /**
   * Update invoice status in local state after API call.
   */
  updateInvoiceStatus(id: string, newStatus: InvoiceStatus): void {
    this._invoices.update((invoices) =>
      invoices.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus } : inv
      )
    );
    // Invalidate cache
    this._lastFetch.set(null);
  }

  /**
   * Invalidate cache to force refresh on next load.
   */
  invalidateCache(): void {
    this._lastFetch.set(null);
  }

  /**
   * Reset store to initial state.
   */
  reset(): void {
    this._invoices.set([]);
    this._pagination.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._lastFetch.set(null);
    this._query.set(DEFAULT_QUERY);
  }
}
