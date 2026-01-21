import { Component, inject, input, output, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { ContractorService } from '../../../services/contractor.service';
import { ContractorsStore } from '../../../stores/contractors.store';
import type { ContractorResponse } from '../../../../types';

/**
 * Contractor data emitted on selection.
 */
export interface SelectedContractor {
  id: string;
  name: string;
  address?: string;
  nip?: string;
}

/**
 * ContractorSelectComponent - Autocomplete for selecting contractors.
 *
 * Features:
 * - Search contractors with debounce
 * - Select from dropdown
 * - Option to add new contractor
 * - Toggle for manual entry mode
 *
 * @example
 * ```html
 * <app-contractor-select
 *   [selectedContractorId]="contractorId"
 *   (contractorSelected)="onSelect($event)"
 *   (manualModeChange)="onModeChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-contractor-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <div class="contractor-select">
      <!-- Manual Mode Toggle -->
      <div class="contractor-select__toggle">
        <mat-slide-toggle [checked]="isManualMode()" (change)="toggleManualMode($event.checked)">
          Wprowadź dane ręcznie
        </mat-slide-toggle>
      </div>

      @if (!isManualMode()) {
        <!-- Autocomplete -->
        <mat-form-field appearance="outline" class="contractor-select__field">
          <mat-label>Wybierz kontrahenta</mat-label>
          <input
            matInput
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            [matAutocomplete]="auto"
            placeholder="Szukaj po nazwie lub NIP..."
          />
          <mat-icon matSuffix>search</mat-icon>

          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="displayFn"
            (optionSelected)="onOptionSelected($event.option.value)"
          >
            @if (loading()) {
              <mat-option disabled>
                <mat-spinner diameter="20"></mat-spinner>
                <span class="contractor-select__loading-text">Wyszukiwanie...</span>
              </mat-option>
            } @else if (contractors().length === 0 && searchQuery()) {
              <mat-option disabled> Nie znaleziono kontrahentów </mat-option>
            } @else {
              @for (contractor of contractors(); track contractor.id) {
                <mat-option [value]="contractor">
                  <div class="contractor-select__option">
                    <span class="contractor-select__option-name">{{ contractor.name }}</span>
                    @if (contractor.nip) {
                      <span class="contractor-select__option-nip">NIP: {{ contractor.nip }}</span>
                    }
                  </div>
                </mat-option>
              }
            }

            <!-- Add New Option -->
            <mat-option
              class="contractor-select__add-option"
              (click)="openAddContractorDialog($event)"
            >
              <mat-icon>add</mat-icon>
              <span>Dodaj nowego kontrahenta</span>
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>

        <!-- Selected Contractor Info -->
        @if (selectedContractor()) {
          <div class="contractor-select__selected">
            <div class="contractor-select__selected-info">
              <strong>{{ selectedContractor()!.name }}</strong>
              @if (selectedContractor()!.address) {
                <p>{{ selectedContractor()!.address }}</p>
              }
              @if (selectedContractor()!.nip) {
                <p>NIP: {{ selectedContractor()!.nip }}</p>
              }
            </div>
            <button
              mat-icon-button
              type="button"
              (click)="clearSelection()"
              matTooltip="Usuń wybór"
              aria-label="Usuń wybór kontrahenta"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .contractor-select {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .contractor-select__toggle {
        margin-bottom: 8px;
      }

      .contractor-select__field {
        width: 100%;
        background-color: #fff;
      }

      .contractor-select__loading-text {
        margin-left: 12px;
      }

      .contractor-select__option {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      ::ng-deep .mat-mdc-autocomplete-panel {
        background-color: #fff !important;
      }

      ::ng-deep mat-option.contractor-select__add-option,
      ::ng-deep mat-option.contractor-select__add-option:hover {
        background: #fff !important;
      }

      .contractor-select__option-name {
        font-weight: 500;
      }

      .contractor-select__option-nip {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }

      .contractor-select__add-option {
        border-top: 1px solid var(--mat-sys-outline-variant);
        margin-top: 8px;
        color: var(--mat-sys-primary);

        mat-icon {
          margin-right: 8px;
        }
      }

      .contractor-select__selected {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;
        background: var(--mat-sys-surface-container);
        border-radius: 8px;
        border-left: 4px solid var(--mat-sys-primary);
      }

      .contractor-select__selected-info {
        strong {
          font-size: 16px;
        }

        p {
          margin: 4px 0 0;
          font-size: 14px;
          color: var(--mat-sys-on-surface-variant);
        }
      }
    `,
  ],
})
export class ContractorSelectComponent implements OnInit {
  private readonly contractorService = inject(ContractorService);
  private readonly contractorsStore = inject(ContractorsStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /** Pre-selected contractor ID (for edit mode) */
  readonly selectedContractorId = input<string | null>(null);

  /** Emits when contractor is selected */
  readonly contractorSelected = output<SelectedContractor | null>();

  /** Emits when manual mode changes */
  readonly manualModeChange = output<boolean>();

  // State
  readonly searchQuery = signal('');
  readonly contractors = signal<ContractorResponse[]>([]);
  readonly selectedContractor = signal<ContractorResponse | null>(null);
  readonly loading = signal(false);
  readonly isManualMode = signal(false);

  // Search subject for debouncing
  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    // Set up search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 2) {
            this.contractors.set([]);
            return of(null);
          }

          this.loading.set(true);
          return this.contractorService.list({ search: query, limit: 10 });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.loading.set(false);
        if (response) {
          this.contractors.set(response.data);
        }
      });

    // Load selected contractor if ID provided
    const selectedId = this.selectedContractorId();
    if (selectedId) {
      this.loadSelectedContractor(selectedId);
    }
  }

  /**
   * Load contractor by ID.
   */
  private async loadSelectedContractor(id: string): Promise<void> {
    try {
      const contractor = await this.contractorService.get(id).toPromise();
      if (contractor) {
        this.selectedContractor.set(contractor);
        this.searchQuery.set(contractor.name);
      }
    } catch (error) {
      // Contractor not found, switch to manual mode
      this.isManualMode.set(true);
      this.manualModeChange.emit(true);
    }
  }

  /**
   * Handle search input change.
   */
  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  /**
   * Handle option selection.
   */
  onOptionSelected(contractor: ContractorResponse): void {
    if (!contractor) return;
    this.selectedContractor.set(contractor);
    this.searchQuery.set(contractor.name);
    this.contractorSelected.emit({
      id: contractor.id,
      name: contractor.name,
      address: contractor.address ?? undefined,
      nip: contractor.nip ?? undefined,
    });
  }

  /**
   * Clear selection.
   */
  clearSelection(): void {
    this.selectedContractor.set(null);
    this.searchQuery.set('');
    this.contractors.set([]);
    this.contractorSelected.emit(null);
  }

  /**
   * Toggle manual entry mode.
   */
  toggleManualMode(isManual: boolean): void {
    this.isManualMode.set(isManual);
    this.manualModeChange.emit(isManual);

    if (isManual) {
      this.clearSelection();
    }
  }

  /**
   * Display function for autocomplete.
   */
  displayFn(contractor: ContractorResponse | string): string {
    if (typeof contractor === 'string') return contractor;
    return contractor?.name || '';
  }

  /**
   * Open dialog to add new contractor.
   */
  openAddContractorDialog(event: Event): void {
    event.stopPropagation();

    // TODO: Implement ContractorFormDialogComponent
    // For now, switch to manual mode
    this.toggleManualMode(true);
  }
}
