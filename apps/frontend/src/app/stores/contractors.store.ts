import { computed, inject, Injectable, signal } from '@angular/core';
import { ContractorService } from '../services/contractor.service';
import type {
  ContractorResponse,
  ContractorListQuery,
  PaginationInfo
} from '../../types';

/**
 * Cache TTL in milliseconds (5 minutes).
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * ContractorsStore - Injectable service for managing contractors state.
 *
 * Features:
 * - Caching with 5-minute TTL
 * - Pagination state management
 * - Loading and error states
 * - Optimistic updates for delete operations
 */
@Injectable({ providedIn: 'root' })
export class ContractorsStore {
  private readonly contractorService = inject(ContractorService);

  // State signals
  private readonly _contractors = signal<ContractorResponse[]>([]);
  private readonly _pagination = signal<PaginationInfo | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetch = signal<number | null>(null);
  private readonly _query = signal<ContractorListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Public readonly signals
  readonly contractors = this._contractors.asReadonly();
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
    this._contractors().length === 0 && !this._loading()
  );

  readonly totalCount = computed(() => this._pagination()?.total ?? 0);

  readonly currentPage = computed(() => this._query().page ?? 1);

  readonly pageSize = computed(() => this._query().limit ?? 20);

  /**
   * Load contractors from API with optional query parameters.
   * Respects cache TTL unless forceRefresh is true.
   */
  async loadContractors(query?: ContractorListQuery, forceRefresh = false): Promise<void> {
    // Merge query with existing state
    const mergedQuery: ContractorListQuery = {
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
      const response = await this.contractorService.list(mergedQuery).toPromise();

      if (response) {
        this._contractors.set(response.data);
        this._pagination.set(response.pagination);
        this._lastFetch.set(Date.now());
      }
    } catch (error) {
      this._error.set(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas ładowania kontrahentów'
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update query parameters and reload contractors.
   */
  async updateQuery(query: Partial<ContractorListQuery>): Promise<void> {
    const newQuery: ContractorListQuery = {
      ...this._query(),
      ...query
    };

    // Reset to page 1 if search or sort changes
    if (
      query.search !== undefined ||
      query.sortBy !== undefined ||
      query.sortOrder !== undefined
    ) {
      newQuery.page = 1;
    }

    await this.loadContractors(newQuery, true);
  }

  /**
   * Delete a contractor (optimistic update).
   */
  async deleteContractor(id: string): Promise<boolean> {
    const previousContractors = this._contractors();

    // Optimistic removal
    this._contractors.set(previousContractors.filter((c) => c.id !== id));

    try {
      await this.contractorService.delete(id).toPromise();

      // Invalidate cache to refresh pagination
      this._lastFetch.set(null);

      return true;
    } catch (error) {
      // Rollback on error
      this._contractors.set(previousContractors);
      this._error.set(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas usuwania kontrahenta'
      );
      return false;
    }
  }

  /**
   * Invalidate cache to force refresh on next load.
   */
  invalidateCache(): void {
    this._lastFetch.set(null);
  }

  /**
   * Clear error state.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store to initial state.
   */
  reset(): void {
    this._contractors.set([]);
    this._pagination.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._lastFetch.set(null);
    this._query.set({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }
}
