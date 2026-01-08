import { Component, inject, signal, computed, OnInit, DestroyRef, effect } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { InvoicesStore } from '../../stores/invoices.store';
import { InvoiceService } from '../../services/invoice.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InvoiceStatusBadgeComponent } from './components/invoice-status-badge.component';
import {
  InvoiceFiltersComponent,
  InvoiceFiltersViewModel,
} from './components/invoice-filters.component';
import {
  InvoiceStatusDialogComponent,
  InvoiceStatusDialogData,
} from './components/invoice-status-dialog.component';
import type { InvoiceListItem, InvoiceStatus, InvoiceListQuery } from '../../../types';

/**
 * InvoiceListComponent - Main invoice list view (dashboard).
 *
 * Features:
 * - Paginated table with sorting
 * - Quick status filters and date range
 * - Search with 300ms debounce
 * - Context menu with actions: View, Edit, Duplicate, Change Status, Delete
 * - Empty state with CTA
 * - URL query params synchronization
 */
@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    EmptyStateComponent,
    InvoiceStatusBadgeComponent,
    InvoiceFiltersComponent,
  ],
  template: `
    <div class="invoice-list">
      <!-- Header -->
      <div class="invoice-list__header">
        <h1 class="invoice-list__title">Faktury</h1>
        <a
          mat-raised-button
          color="primary"
          routerLink="/invoices/new"
          class="invoice-list__new-btn"
        >
          <mat-icon>add</mat-icon>
          Nowa faktura
        </a>
      </div>

      <!-- Filters -->
      <app-invoice-filters
        [filters]="filtersViewModel()"
        (filtersChange)="onFiltersChange($event)"
      />

      <!-- Content -->
      @if (store.loading()) {
        <div class="invoice-list__loading">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Ładowanie faktur...</p>
        </div>
      } @else if (store.error()) {
        <div class="invoice-list__error">
          <mat-icon color="warn">error_outline</mat-icon>
          <p>{{ store.error() }}</p>
          <button mat-button color="primary" (click)="reload()">Spróbuj ponownie</button>
        </div>
      } @else if (store.isEmpty() && !store.hasFilters()) {
        <app-empty-state
          icon="receipt_long"
          title="Brak faktur"
          description="Wystaw pierwszą fakturę, aby rozpocząć"
          actionLabel="Nowa faktura"
          actionRoute="/invoices/new"
        />
      } @else if (store.isEmpty() && store.hasFilters()) {
        <app-empty-state
          icon="search_off"
          title="Brak wyników"
          description="Nie znaleziono faktur spełniających kryteria wyszukiwania"
          actionLabel="Wyczyść filtry"
          (actionClick)="clearFilters()"
        />
      } @else {
        <!-- Table -->
        <div class="invoice-list__table-container mat-elevation-z1">
          <table
            mat-table
            [dataSource]="store.invoices()"
            matSort
            (matSortChange)="onSortChange($event)"
            class="invoice-list__table"
          >
            <!-- Invoice Number Column -->
            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Numer</th>
              <td mat-cell *matCellDef="let invoice">
                <a [routerLink]="['/invoices', invoice.id]" class="invoice-list__link">
                  {{ invoice.invoiceNumber }}
                </a>
              </td>
            </ng-container>

            <!-- Buyer Name Column -->
            <ng-container matColumnDef="buyerName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nabywca</th>
              <td mat-cell *matCellDef="let invoice">
                {{ invoice.buyerName }}
              </td>
            </ng-container>

            <!-- Issue Date Column -->
            <ng-container matColumnDef="issueDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Data wystawienia</th>
              <td mat-cell *matCellDef="let invoice">
                {{ invoice.issueDate | date: 'dd.MM.yyyy' }}
              </td>
            </ng-container>

            <!-- Due Date Column -->
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Termin płatności</th>
              <td mat-cell *matCellDef="let invoice" [class.overdue]="isOverdue(invoice)">
                {{ invoice.dueDate | date: 'dd.MM.yyyy' }}
                @if (isOverdue(invoice)) {
                  <mat-icon class="overdue-icon" matTooltip="Po terminie">warning</mat-icon>
                }
              </td>
            </ng-container>

            <!-- Total Gross Column -->
            <ng-container matColumnDef="totalGross">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-right">
                Kwota brutto
              </th>
              <td mat-cell *matCellDef="let invoice" class="text-right">
                {{ invoice.totalGross | currency: invoice.currency : 'symbol' : '1.2-2' : 'pl' }}
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let invoice">
                <app-invoice-status-badge [status]="invoice.status" />
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-column"></th>
              <td mat-cell *matCellDef="let invoice" class="actions-column">
                <button mat-icon-button [matMenuTriggerFor]="actionsMenu" aria-label="Akcje">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionsMenu="matMenu">
                  <a mat-menu-item [routerLink]="['/invoices', invoice.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>Podgląd</span>
                  </a>
                  @if (invoice.status === 'draft') {
                    <a mat-menu-item [routerLink]="['/invoices', invoice.id, 'edit']">
                      <mat-icon>edit</mat-icon>
                      <span>Edytuj</span>
                    </a>
                  }
                  <button mat-menu-item (click)="duplicateInvoice(invoice)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Duplikuj</span>
                  </button>
                  <button mat-menu-item (click)="openStatusDialog(invoice)">
                    <mat-icon>published_with_changes</mat-icon>
                    <span>Zmień status</span>
                  </button>
                  @if (invoice.status === 'draft') {
                    <button mat-menu-item class="delete-action" (click)="confirmDelete(invoice)">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Usuń</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              class="invoice-list__row"
              (click)="navigateToDetail(row)"
            ></tr>
          </table>
        </div>

        <!-- Paginator -->
        <mat-paginator
          [length]="store.totalCount()"
          [pageIndex]="store.currentPage() - 1"
          [pageSize]="store.pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
          aria-label="Nawigacja stron"
        />
      }

      <!-- Mobile FAB -->
      <a
        mat-fab
        color="primary"
        routerLink="/invoices/new"
        class="invoice-list__fab"
        aria-label="Nowa faktura"
      >
        <mat-icon>add</mat-icon>
      </a>
    </div>
  `,
  styles: [
    `
      .invoice-list {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .invoice-list__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .invoice-list__title {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .invoice-list__new-btn {
        @media (max-width: 599px) {
          display: none;
        }
      }

      .invoice-list__loading,
      .invoice-list__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        gap: 16px;
      }

      .invoice-list__error mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .invoice-list__table-container {
        overflow-x: auto;
        border-radius: 8px;
        background: var(--mat-sys-surface);
      }

      .invoice-list__table {
        width: 100%;
        min-width: 800px;
      }

      .invoice-list__link {
        color: var(--mat-sys-primary);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .invoice-list__row {
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:hover {
          background-color: var(--mat-sys-surface-container-low);
        }
      }

      .text-right {
        text-align: right !important;
      }

      .actions-column {
        width: 48px;
        text-align: center;
      }

      .overdue {
        color: #c62828;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .overdue-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #c62828;
      }

      .delete-action {
        color: var(--mat-sys-error);
      }

      mat-paginator {
        background: transparent;
        margin-top: 16px;
      }

      .invoice-list__fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100;

        @media (min-width: 600px) {
          display: none;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 959px) {
        .invoice-list {
          padding: 16px;
        }

        .invoice-list__title {
          font-size: 24px;
        }
      }
    `,
  ],
})
export class InvoiceListComponent implements OnInit {
  readonly store = inject(InvoicesStore);
  private readonly invoiceService = inject(InvoiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** Table columns to display */
  readonly displayedColumns = [
    'invoiceNumber',
    'buyerName',
    'issueDate',
    'dueDate',
    'totalGross',
    'status',
    'actions',
  ];

  /** Current filters view model derived from store query */
  readonly filtersViewModel = computed((): InvoiceFiltersViewModel => {
    const query = this.store.query();
    return {
      status: query.status ?? null,
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
      search: query.search ?? '',
    };
  });

  /** Query params from URL */
  private readonly queryParams = toSignal(this.route.queryParams);

  ngOnInit(): void {
    // Initialize from URL query params
    this.initFromQueryParams();
  }

  /**
   * Initialize store from URL query parameters.
   */
  private initFromQueryParams(): void {
    const params = this.queryParams();
    if (!params) {
      this.store.loadInvoices();
      return;
    }

    const query: InvoiceListQuery = {
      page: params['page'] ? parseInt(params['page'], 10) : 1,
      limit: params['limit'] ? parseInt(params['limit'], 10) : 20,
      status: params['status'] as InvoiceStatus | undefined,
      search: params['search'],
      dateFrom: params['dateFrom'],
      dateTo: params['dateTo'],
      sortBy: params['sortBy'],
      sortOrder: params['sortOrder'] as 'asc' | 'desc' | undefined,
    };

    this.store.loadInvoices(query);
  }

  /**
   * Update URL query parameters to reflect current state.
   */
  private updateQueryParams(query: Partial<InvoiceListQuery>): void {
    const currentQuery = this.store.query();
    const mergedQuery = { ...currentQuery, ...query };

    // Build clean query params (remove undefined/null values)
    const queryParams: Record<string, string> = {};
    if (mergedQuery.page && mergedQuery.page > 1) {
      queryParams['page'] = mergedQuery.page.toString();
    }
    if (mergedQuery.limit && mergedQuery.limit !== 20) {
      queryParams['limit'] = mergedQuery.limit.toString();
    }
    if (mergedQuery.status) {
      queryParams['status'] = mergedQuery.status;
    }
    if (mergedQuery.search) {
      queryParams['search'] = mergedQuery.search;
    }
    if (mergedQuery.dateFrom) {
      queryParams['dateFrom'] = mergedQuery.dateFrom;
    }
    if (mergedQuery.dateTo) {
      queryParams['dateTo'] = mergedQuery.dateTo;
    }
    if (mergedQuery.sortBy && mergedQuery.sortBy !== 'issueDate') {
      queryParams['sortBy'] = mergedQuery.sortBy;
    }
    if (mergedQuery.sortOrder && mergedQuery.sortOrder !== 'desc') {
      queryParams['sortOrder'] = mergedQuery.sortOrder;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  /**
   * Handle filters change from InvoiceFiltersComponent.
   */
  async onFiltersChange(filters: InvoiceFiltersViewModel): Promise<void> {
    const query: Partial<InvoiceListQuery> = {
      status: filters.status ?? undefined,
      dateFrom: filters.dateFrom ?? undefined,
      dateTo: filters.dateTo ?? undefined,
      search: filters.search || undefined,
    };

    this.updateQueryParams(query);
    await this.store.updateQuery(query);
  }

  /**
   * Handle sort change.
   */
  async onSortChange(sort: Sort): Promise<void> {
    const validSortFields = [
      'invoiceNumber',
      'issueDate',
      'dueDate',
      'totalGross',
      'createdAt',
    ] as const;
    const sortField = validSortFields.includes(sort.active as (typeof validSortFields)[number])
      ? (sort.active as InvoiceListQuery['sortBy'])
      : 'issueDate';

    const query: Partial<InvoiceListQuery> = {
      sortBy: sortField,
      sortOrder: sort.direction || 'desc',
    };

    this.updateQueryParams(query);
    await this.store.updateQuery(query);
  }

  /**
   * Handle page change.
   */
  async onPageChange(event: PageEvent): Promise<void> {
    const query: Partial<InvoiceListQuery> = {
      page: event.pageIndex + 1,
      limit: event.pageSize,
    };

    this.updateQueryParams(query);
    await this.store.updateQuery(query);
  }

  /**
   * Clear all filters.
   */
  async clearFilters(): Promise<void> {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
    await this.store.clearFilters();
  }

  /**
   * Reload invoices.
   */
  async reload(): Promise<void> {
    await this.store.loadInvoices(undefined, true);
  }

  /**
   * Navigate to invoice detail.
   */
  navigateToDetail(invoice: InvoiceListItem): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  /**
   * Check if invoice is overdue.
   */
  isOverdue(invoice: InvoiceListItem): boolean {
    if (invoice.status === 'paid') return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  /**
   * Open status change dialog.
   */
  openStatusDialog(invoice: InvoiceListItem): void {
    const dialogData: InvoiceStatusDialogData = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      currentStatus: invoice.status,
    };

    const dialogRef = this.dialog.open(InvoiceStatusDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (newStatus: InvoiceStatus | undefined) => {
      if (newStatus && newStatus !== invoice.status) {
        try {
          await this.invoiceService.updateStatus(invoice.id, { status: newStatus }).toPromise();
          this.store.updateInvoiceStatus(invoice.id, newStatus);
          this.snackBar.open('Status faktury został zmieniony', 'Zamknij', {
            duration: 3000,
          });
        } catch (error) {
          this.snackBar.open('Błąd podczas zmiany statusu', 'Zamknij', {
            duration: 5000,
            panelClass: ['snackbar-error'],
          });
        }
      }
    });
  }

  /**
   * Duplicate invoice.
   */
  async duplicateInvoice(invoice: InvoiceListItem): Promise<void> {
    try {
      const duplicated = await this.invoiceService.duplicate(invoice.id).toPromise();
      if (duplicated) {
        this.snackBar.open('Faktura została zduplikowana', 'Zamknij', {
          duration: 3000,
        });
        // Navigate to edit the duplicated invoice
        this.router.navigate(['/invoices', duplicated.id, 'edit']);
      }
    } catch (error) {
      this.snackBar.open('Błąd podczas duplikowania faktury', 'Zamknij', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    }
  }

  /**
   * Show delete confirmation dialog.
   */
  confirmDelete(invoice: InvoiceListItem): void {
    const dialogData: ConfirmDialogData = {
      title: 'Usuń fakturę',
      message: `Czy na pewno chcesz usunąć fakturę ${invoice.invoiceNumber}? Ta operacja jest nieodwracalna.`,
      confirmText: 'Usuń',
      cancelText: 'Anuluj',
      confirmColor: 'warn',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        const success = await this.store.deleteInvoice(invoice.id);
        if (success) {
          this.snackBar.open('Faktura została usunięta', 'Zamknij', {
            duration: 3000,
          });
        } else {
          this.snackBar.open('Błąd podczas usuwania faktury', 'Zamknij', {
            duration: 5000,
            panelClass: ['snackbar-error'],
          });
        }
      }
    });
  }
}
