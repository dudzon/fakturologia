import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ContractorsStore } from '../../stores/contractors.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import type { ContractorResponse } from '../../../types';

/**
 * ContractorListComponent - Main view for managing contractors.
 *
 * Features:
 * - Paginated table with sorting
 * - Search with 300ms debounce
 * - Edit and delete actions
 * - Empty state with CTA
 * - Integration with ContractorsStore
 */
@Component({
  selector: 'app-contractor-list',
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
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="contractor-list">
      <!-- Header -->
      <app-page-header title="Kontrahenci">
        <a
          mat-raised-button
          color="primary"
          routerLink="/contractors/new"
          class="contractor-list__add-btn"
        >
          <mat-icon>add</mat-icon>
          <span class="contractor-list__add-btn-text">Nowy kontrahent</span>
        </a>
      </app-page-header>

      <!-- Toolbar -->
      <div class="contractor-list__toolbar">
        <mat-form-field
          class="contractor-list__search"
          appearance="outline"
          subscriptSizing="dynamic"
        >
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            type="text"
            placeholder="Szukaj po nazwie lub NIP..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            aria-label="Szukaj kontrahentów"
          />
          @if (searchQuery()) {
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
      </div>

      <!-- Loading state -->
      @if (store.loading()) {
        <div class="contractor-list__loading">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      <!-- Error state -->
      @if (store.error()) {
        <div class="contractor-list__error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ store.error() }}</p>
          <button mat-button color="primary" (click)="reload()">Spróbuj ponownie</button>
        </div>
      }

      <!-- Empty state -->
      @if (!store.loading() && !store.error() && store.isEmpty() && !searchQuery()) {
        <app-empty-state
          icon="people"
          title="Brak kontrahentów"
          description="Dodaj pierwszego kontrahenta, aby móc go później wybrać podczas tworzenia faktury."
          actionLabel="Dodaj kontrahenta"
          actionRoute="/contractors/new"
        />
      }

      <!-- Empty search results -->
      @if (!store.loading() && !store.error() && store.isEmpty() && searchQuery()) {
        <app-empty-state
          icon="search_off"
          title="Brak wyników"
          [description]="noResultsDescription()"
          actionLabel="Wyczyść wyszukiwanie"
          (actionClick)="clearSearch()"
        />
      }

      <!-- Data table -->
      @if (!store.loading() && !store.error() && !store.isEmpty()) {
        <div class="contractor-list__table-container mat-elevation-z1">
          <table
            mat-table
            [dataSource]="store.contractors()"
            matSort
            (matSortChange)="onSortChange($event)"
            [matSortActive]="sortBy()"
            [matSortDirection]="sortDirection()"
          >
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nazwa</th>
              <td mat-cell *matCellDef="let contractor">
                <span class="contractor-list__name">{{ contractor.name }}</span>
              </td>
            </ng-container>

            <!-- Address Column -->
            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef>Adres</th>
              <td mat-cell *matCellDef="let contractor">
                <span class="contractor-list__address">{{ contractor.address || '—' }}</span>
              </td>
            </ng-container>

            <!-- NIP Column -->
            <ng-container matColumnDef="nip">
              <th mat-header-cell *matHeaderCellDef>NIP</th>
              <td mat-cell *matCellDef="let contractor">
                <span class="contractor-list__nip">{{ formatNip(contractor.nip) }}</span>
              </td>
            </ng-container>

            <!-- Created At Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Data utworzenia</th>
              <td mat-cell *matCellDef="let contractor">
                {{ contractor.createdAt | date: 'dd.MM.yyyy' }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="contractor-list__actions-header">
                Akcje
              </th>
              <td mat-cell *matCellDef="let contractor" class="contractor-list__actions-cell">
                <a
                  mat-icon-button
                  [routerLink]="['/contractors', contractor.id, 'edit']"
                  matTooltip="Edytuj"
                  aria-label="Edytuj kontrahenta"
                >
                  <mat-icon>edit</mat-icon>
                </a>
                <button
                  mat-icon-button
                  matTooltip="Usuń"
                  aria-label="Usuń kontrahenta"
                  (click)="confirmDelete(contractor)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <mat-paginator
            [length]="store.totalCount()"
            [pageSize]="store.pageSize()"
            [pageIndex]="store.currentPage() - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
            aria-label="Paginacja listy kontrahentów"
          />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .contractor-list {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .contractor-list__toolbar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        align-items: center;
        flex-wrap: wrap;
      }

      .contractor-list__search {
        flex: 1;
        min-width: 250px;
        max-width: 400px;
      }

      .contractor-list__add-btn {
        white-space: nowrap;
      }

      .contractor-list__add-btn mat-icon {
        margin-right: 8px;
      }

      .contractor-list__loading {
        display: flex;
        justify-content: center;
        padding: 48px;
      }

      .contractor-list__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px;
        text-align: center;
        color: var(--mat-sys-error);
      }

      .contractor-list__error mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      .contractor-list__error p {
        margin: 0 0 16px;
        color: var(--mat-sys-on-surface-variant);
      }

      .contractor-list__table-container {
        margin-top: 150px;
        border-radius: 8px;
        overflow: hidden;
      }

      .contractor-list__table-container table {
        width: 100%;
      }

      .contractor-list__name {
        font-weight: 500;
      }

      .contractor-list__address {
        color: var(--mat-sys-on-surface-variant);
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }

      .contractor-list__nip {
        font-family: monospace;
        letter-spacing: 0.5px;
      }

      .contractor-list__actions-header,
      .contractor-list__actions-cell {
        width: 100px;
        text-align: center;
      }

      .contractor-list__actions-cell {
        white-space: nowrap;
      }

      mat-paginator {
        background: transparent;
        margin-top: 16px;
      }

      mat-paginator ::ng-deep .mat-mdc-paginator-page-size-select .mat-mdc-select-trigger {
        padding-left: 10px;
      }

      mat-paginator ::ng-deep .mat-mdc-paginator-page-size-select .mat-mdc-select-arrow-wrapper {
        padding-right: 5px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .contractor-list {
          padding: 16px;
        }

        .contractor-list__toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .contractor-list__search {
          max-width: none;
        }

        .contractor-list__add-btn-text {
          display: none;
        }

        .contractor-list__add-btn mat-icon {
          margin-right: 0;
        }
      }
    `,
  ],
})
export class ContractorListComponent implements OnInit {
  readonly store = inject(ContractorsStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // Local state signals
  readonly searchQuery = signal('');
  readonly sortBy = signal<'name' | 'createdAt' | 'updatedAt'>('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed signals
  readonly noResultsDescription = computed(
    () => `Nie znaleziono kontrahentów dla: „${this.searchQuery()}"`,
  );

  // Table configuration
  readonly displayedColumns = ['name', 'address', 'nip', 'createdAt', 'actions'];

  // Search debounce subject
  private readonly searchSubject = new Subject<string>();

  constructor() {
    // Setup search debounce
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
        this.store.updateQuery({ search: search || undefined });
      });
  }

  ngOnInit(): void {
    // Load initial data
    this.store.loadContractors();
  }

  /**
   * Handle search input changes with debounce.
   */
  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  /**
   * Clear search and reload.
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  /**
   * Handle sort changes from mat-sort.
   */
  onSortChange(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.sortBy.set('createdAt');
      this.sortDirection.set('desc');
    } else {
      this.sortBy.set(sort.active as 'name' | 'createdAt' | 'updatedAt');
      this.sortDirection.set(sort.direction);
    }

    this.store.updateQuery({
      sortBy: this.sortBy(),
      sortOrder: this.sortDirection(),
    });
  }

  /**
   * Handle pagination changes.
   */
  onPageChange(event: PageEvent): void {
    this.store.updateQuery({
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }

  /**
   * Reload contractors (force refresh).
   */
  reload(): void {
    this.store.clearError();
    this.store.loadContractors(undefined, true);
  }

  /**
   * Format NIP for display (XXX-XXX-XX-XX).
   */
  formatNip(nip: string | null | undefined): string {
    if (!nip) return '—';
    // Format: XXX-XXX-XX-XX
    const clean = nip.replace(/\D/g, '');
    if (clean.length !== 10) return nip;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
  }

  /**
   * Show delete confirmation dialog.
   */
  confirmDelete(contractor: ContractorResponse): void {
    const dialogData: ConfirmDialogData = {
      title: 'Usuń kontrahenta',
      message: `Czy na pewno chcesz usunąć kontrahenta "${contractor.name}"? Ta operacja jest nieodwracalna.`,
      confirmText: 'Usuń',
      cancelText: 'Anuluj',
      confirmColor: 'warn',
      icon: 'delete',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        const success = await this.store.deleteContractor(contractor.id);

        if (success) {
          this.snackBar.open('Kontrahent został usunięty', 'OK', {
            duration: 3000,
          });
        } else {
          this.snackBar.open(this.store.error() || 'Wystąpił błąd podczas usuwania', 'OK', {
            duration: 5000,
          });
        }
      }
    });
  }
}
