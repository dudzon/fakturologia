import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ContractorService } from '../../services/contractor.service';
import { ContractorsStore } from '../../stores/contractors.store';
import { nipValidator, normalizeNip } from '../../shared/validators/nip.validator';
import type { CanDeactivateComponent } from '../../core/guards/can-deactivate.guard';
import type {
  ContractorResponse,
  CreateContractorCommand,
  UpdateContractorCommand
} from '../../../types';

/**
 * ContractorFormComponent - Form for creating and editing contractors.
 *
 * Features:
 * - Create mode (/contractors/new)
 * - Edit mode (/contractors/:id/edit)
 * - NIP validation with Polish checksum
 * - NIP normalization on blur
 * - Unsaved changes warning
 */
@Component({
  selector: 'app-contractor-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="contractor-form">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            @if (isEditMode()) {
              Edytuj kontrahenta
            } @else {
              Nowy kontrahent
            }
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="contractor-form__loading">
              <mat-spinner diameter="48"></mat-spinner>
            </div>
          } @else {
            <form [formGroup]="contractorForm" (ngSubmit)="onSubmit()">
              <!-- Name field -->
              <mat-form-field appearance="outline" class="contractor-form__field">
                <mat-label>Nazwa kontrahenta</mat-label>
                <input
                  matInput
                  formControlName="name"
                  placeholder="np. Firma ABC Sp. z o.o."
                  maxlength="255"
                />
                <mat-hint align="end">{{ contractorForm.get('name')?.value?.length || 0 }}/255</mat-hint>
                @if (contractorForm.get('name')?.hasError('required') && contractorForm.get('name')?.touched) {
                  <mat-error>Nazwa kontrahenta jest wymagana</mat-error>
                }
                @if (contractorForm.get('name')?.hasError('maxlength')) {
                  <mat-error>Nazwa może mieć maksymalnie 255 znaków</mat-error>
                }
              </mat-form-field>

              <!-- Address field -->
              <mat-form-field appearance="outline" class="contractor-form__field">
                <mat-label>Adres</mat-label>
                <textarea
                  matInput
                  formControlName="address"
                  placeholder="np. ul. Przykładowa 123&#10;00-001 Warszawa"
                  rows="3"
                  maxlength="500"
                ></textarea>
                <mat-hint align="end">{{ contractorForm.get('address')?.value?.length || 0 }}/500</mat-hint>
                @if (contractorForm.get('address')?.hasError('maxlength')) {
                  <mat-error>Adres może mieć maksymalnie 500 znaków</mat-error>
                }
              </mat-form-field>

              <!-- NIP field -->
              <mat-form-field appearance="outline" class="contractor-form__field">
                <mat-label>NIP</mat-label>
                <input
                  matInput
                  formControlName="nip"
                  placeholder="np. 1234567890"
                  maxlength="13"
                  (blur)="onNipBlur()"
                />
                <mat-hint>10 cyfr, opcjonalnie z myślnikami</mat-hint>
                @if (contractorForm.get('nip')?.hasError('nip') && contractorForm.get('nip')?.touched) {
                  <mat-error>{{ contractorForm.get('nip')?.getError('nip')?.message }}</mat-error>
                }
              </mat-form-field>

              <!-- API error (e.g., NIP_EXISTS) -->
              @if (apiError()) {
                <div class="contractor-form__api-error">
                  <mat-icon>error</mat-icon>
                  <span>{{ apiError() }}</span>
                </div>
              }
            </form>
          }
        </mat-card-content>

        <mat-card-actions align="end">
          <a mat-button routerLink="/contractors" [disabled]="isSaving()">
            Anuluj
          </a>
          <button
            mat-raised-button
            color="primary"
            [disabled]="contractorForm.invalid || isSaving() || isLoading()"
            (click)="onSubmit()"
          >
            @if (isSaving()) {
              <mat-spinner diameter="20" class="contractor-form__btn-spinner"></mat-spinner>
            }
            {{ isEditMode() ? 'Zapisz zmiany' : 'Dodaj kontrahenta' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .contractor-form {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .contractor-form__field {
      width: 100%;
      margin-bottom: 16px;
    }

    .contractor-form__loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .contractor-form__api-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      border-radius: 8px;
    }

    .contractor-form__api-error mat-icon {
      flex-shrink: 0;
    }

    .contractor-form__btn-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    mat-card-actions {
      padding: 16px !important;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .contractor-form {
        padding: 16px;
      }
    }
  `]
})
export class ContractorFormComponent implements OnInit, CanDeactivateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractorService = inject(ContractorService);
  private readonly contractorsStore = inject(ContractorsStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  readonly isEditMode = signal(false);
  readonly contractorId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly apiError = signal<string | null>(null);

  // Form
  readonly contractorForm: FormGroup;

  // Track pristine state for canDeactivate
  private formSaved = false;

  constructor() {
    this.contractorForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      address: ['', [Validators.maxLength(500)]],
      nip: ['', [nipValidator()]]
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.contractorId.set(id);
      this.loadContractor(id);
    }
  }

  /**
   * Load contractor data for edit mode.
   */
  private loadContractor(id: string): void {
    this.isLoading.set(true);

    this.contractorService.get(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (contractor) => {
        this.contractorForm.patchValue({
          name: contractor.name,
          address: contractor.address || '',
          nip: contractor.nip || ''
        });
        this.contractorForm.markAsPristine();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Nie udało się załadować danych kontrahenta', 'OK', {
          duration: 5000
        });
        this.router.navigate(['/contractors']);
      }
    });
  }

  /**
   * Normalize NIP on blur (remove dashes and spaces).
   */
  onNipBlur(): void {
    const nipControl = this.contractorForm.get('nip');
    if (nipControl?.value) {
      nipControl.setValue(normalizeNip(nipControl.value));
    }
  }

  /**
   * Submit the form.
   */
  onSubmit(): void {
    if (this.contractorForm.invalid || this.isSaving()) {
      this.contractorForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.apiError.set(null);

    const formValue = this.contractorForm.value;

    if (this.isEditMode()) {
      this.updateContractor(formValue);
    } else {
      this.createContractor(formValue);
    }
  }

  /**
   * Create a new contractor.
   */
  private createContractor(formValue: { name: string; address: string; nip: string }): void {
    const command: CreateContractorCommand = {
      name: formValue.name.trim(),
      address: formValue.address?.trim() || undefined,
      nip: formValue.nip?.trim() || undefined
    };

    this.contractorService.create(command).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (contractor) => {
        this.formSaved = true;
        this.contractorsStore.invalidateCache();
        this.snackBar.open('Kontrahent został dodany', 'OK', {
          duration: 3000
        });
        this.router.navigate(['/contractors']);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.handleApiError(error);
      }
    });
  }

  /**
   * Update an existing contractor.
   */
  private updateContractor(formValue: { name: string; address: string; nip: string }): void {
    const id = this.contractorId();
    if (!id) return;

    const command: UpdateContractorCommand = {
      name: formValue.name.trim(),
      address: formValue.address?.trim() || undefined,
      nip: formValue.nip?.trim() || undefined
    };

    this.contractorService.update(id, command).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (contractor) => {
        this.formSaved = true;
        this.contractorsStore.invalidateCache();
        this.snackBar.open('Zmiany zostały zapisane', 'OK', {
          duration: 3000
        });
        this.router.navigate(['/contractors']);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.handleApiError(error);
      }
    });
  }

  /**
   * Handle API errors and display appropriate messages.
   */
  private handleApiError(error: any): void {
    const errorCode = error?.error?.code;
    const errorMessage = error?.error?.message;

    switch (errorCode) {
      case 'NIP_EXISTS':
        this.apiError.set('Kontrahent z tym NIP już istnieje');
        break;
      case 'INVALID_NIP':
        this.apiError.set('Nieprawidłowy format NIP');
        break;
      case 'NAME_REQUIRED':
        this.apiError.set('Nazwa kontrahenta jest wymagana');
        break;
      case 'CONTRACTOR_NOT_FOUND':
        this.apiError.set('Kontrahent nie został znaleziony');
        this.router.navigate(['/contractors']);
        break;
      default:
        this.apiError.set(errorMessage || 'Wystąpił nieoczekiwany błąd');
    }
  }

  /**
   * CanDeactivateComponent implementation.
   * Returns true if form is pristine or has been saved.
   */
  canDeactivate(): boolean {
    return this.contractorForm.pristine || this.formSaved;
  }
}
