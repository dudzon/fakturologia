import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { InvoiceService } from '../../services/invoice.service';
import { InvoicesStore } from '../../stores/invoices.store';
import { InvoiceFormStore, InvoiceItemFormModel } from '../../stores/invoice-form.store';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';
import { InvoiceItemsTableComponent } from './components/invoice-items-table.component';
import { InvoiceTotalsComponent } from './components/invoice-totals.component';
import { ContractorSelectComponent } from './components/contractor-select.component';
import { CanDeactivateComponent } from '../../core/guards/can-deactivate.guard';
import { nipValidator } from '../../shared/validators/nip.validator';
import type {
  InvoiceResponse,
  CreateInvoiceCommand,
  UpdateInvoiceCommand,
  PaymentMethod,
  Currency,
  BuyerInfoRequest,
} from '../../../types';

/**
 * Payment method options.
 */
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: 'Przelew' },
  { value: 'cash', label: 'Gotówka' },
  { value: 'card', label: 'Karta' },
];

/**
 * Currency options.
 */
const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'PLN', label: 'PLN - Polski złoty' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - Dolar amerykański' },
];

/**
 * InvoiceFormComponent - Create/Edit invoice form.
 *
 * Features:
 * - Reactive form with validation
 * - Dynamic invoice items with FormArray
 * - Automatic totals calculation via InvoiceFormStore
 * - Contractor selection with autocomplete
 * - Save as draft or issue invoice
 * - Unsaved changes guard
 */
@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    LoadingButtonComponent,
    InvoiceItemsTableComponent,
    InvoiceTotalsComponent,
    ContractorSelectComponent,
  ],
  providers: [InvoiceFormStore],
  template: `
    <div class="invoice-form">
      @if (loading()) {
        <div class="invoice-form__loading">
          <mat-spinner diameter="48"></mat-spinner>
          <p>{{ isEditMode() ? 'Ładowanie faktury...' : 'Przygotowywanie formularza...' }}</p>
        </div>
      } @else if (loadError()) {
        <div class="invoice-form__error">
          <mat-icon color="warn">error_outline</mat-icon>
          <h2>Błąd</h2>
          <p>{{ loadError() }}</p>
          <button mat-raised-button color="primary" routerLink="/invoices">Powrót do listy</button>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit('draft')">
          <!-- Header -->
          <div class="invoice-form__header">
            <button
              mat-icon-button
              type="button"
              routerLink="/invoices"
              aria-label="Powrót do listy"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="invoice-form__title">
              {{ isEditMode() ? 'Edycja faktury' : 'Nowa faktura' }}
              @if (isEditMode() && existingInvoice()) {
                <span class="invoice-form__title-number">{{
                  existingInvoice()!.invoiceNumber
                }}</span>
              }
            </h1>
          </div>

          <!-- Invoice Data Section -->
          <mat-card class="invoice-form__section">
            <mat-card-header>
              <mat-card-title class="invoice-form__section-title">Dane faktury</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="invoice-form__row">
                <mat-form-field appearance="outline" class="invoice-form__field">
                  <mat-label>Numer faktury</mat-label>
                  <input
                    matInput
                    formControlName="invoiceNumber"
                    placeholder="np. FV/2026/01/001"
                  />
                  @if (form.get('invoiceNumber')?.hasError('required')) {
                    <mat-error>Numer faktury jest wymagany</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="invoice-form__field">
                  <mat-label>Data wystawienia</mat-label>
                  <input matInput [matDatepicker]="issueDatePicker" formControlName="issueDate" />
                  <mat-datepicker-toggle
                    matIconSuffix
                    [for]="issueDatePicker"
                  ></mat-datepicker-toggle>
                  <mat-datepicker #issueDatePicker></mat-datepicker>
                  @if (form.get('issueDate')?.hasError('required')) {
                    <mat-error>Data wystawienia jest wymagana</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="invoice-form__row">
                <mat-form-field appearance="outline" class="invoice-form__field">
                  <mat-label>Termin płatności</mat-label>
                  <input matInput [matDatepicker]="dueDatePicker" formControlName="dueDate" />
                  <mat-datepicker-toggle
                    matIconSuffix
                    [for]="dueDatePicker"
                  ></mat-datepicker-toggle>
                  <mat-datepicker #dueDatePicker></mat-datepicker>
                  @if (form.get('dueDate')?.hasError('required')) {
                    <mat-error>Termin płatności jest wymagany</mat-error>
                  }
                  @if (form.get('dueDate')?.hasError('min')) {
                    <mat-error
                      >Termin płatności nie może być wcześniejszy niż data wystawienia</mat-error
                    >
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="invoice-form__field">
                  <mat-label>Metoda płatności</mat-label>
                  <mat-select formControlName="paymentMethod">
                    @for (method of paymentMethods; track method.value) {
                      <mat-option [value]="method.value">{{ method.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  class="invoice-form__field invoice-form__field--small"
                >
                  <mat-label>Waluta</mat-label>
                  <mat-select formControlName="currency">
                    @for (curr of currencies; track curr.value) {
                      <mat-option [value]="curr.value">{{ curr.value }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Buyer Section -->
          <mat-card class="invoice-form__section">
            <mat-card-header>
              <mat-card-title class="invoice-form__section-title">Nabywca</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-contractor-select
                [selectedContractorId]="selectedContractorId()"
                (contractorSelected)="onContractorSelected($event)"
                (manualModeChange)="onManualModeChange($event)"
              />

              @if (isManualBuyerMode()) {
                <div class="invoice-form__row" formGroupName="buyer">
                  <mat-form-field
                    appearance="outline"
                    class="invoice-form__field invoice-form__field--wide"
                  >
                    <mat-label>Nazwa nabywcy</mat-label>
                    <input matInput formControlName="name" />
                    @if (form.get('buyer.name')?.hasError('required')) {
                      <mat-error>Nazwa nabywcy jest wymagana</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="invoice-form__row" formGroupName="buyer">
                  <mat-form-field
                    appearance="outline"
                    class="invoice-form__field invoice-form__field--wide"
                  >
                    <mat-label>Adres</mat-label>
                    <textarea matInput formControlName="address" rows="2"></textarea>
                  </mat-form-field>
                </div>

                <div class="invoice-form__row" formGroupName="buyer">
                  <mat-form-field appearance="outline" class="invoice-form__field">
                    <mat-label>NIP</mat-label>
                    <input matInput formControlName="nip" placeholder="np. 1234567890" />
                    @if (form.get('buyer.nip')?.hasError('nip')) {
                      <mat-error>Nieprawidłowy numer NIP</mat-error>
                    }
                  </mat-form-field>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Items Section -->
          <mat-card class="invoice-form__section">
            <mat-card-header>
              <mat-card-title class="invoice-form__section-title">Pozycje faktury</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-invoice-items-table />

              @if (!formStore.hasItems()) {
                <p class="invoice-form__items-hint">Dodaj co najmniej jedną pozycję do faktury.</p>
              }
            </mat-card-content>
          </mat-card>

          <!-- Totals Section -->
          <mat-card class="invoice-form__section">
            <mat-card-header>
              <mat-card-title class="invoice-form__section-title">Podsumowanie</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-invoice-totals
                [items]="formStore.items()"
                [currency]="formCurrency()"
                [totalNet]="formStore.totalNetFormatted()"
                [totalVat]="formStore.totalVatFormatted()"
                [totalGross]="formStore.totalGrossFormatted()"
              />
            </mat-card-content>
          </mat-card>

          <!-- Notes Section -->
          <mat-card class="invoice-form__section">
            <mat-card-header>
              <mat-card-title class="invoice-form__section-title">Uwagi</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field
                appearance="outline"
                class="invoice-form__field invoice-form__field--full"
              >
                <mat-label>Uwagi do faktury</mat-label>
                <textarea
                  matInput
                  formControlName="notes"
                  rows="3"
                  placeholder="Opcjonalne uwagi widoczne na fakturze..."
                ></textarea>
                <mat-hint align="end">{{ form.get('notes')?.value?.length || 0 }}/1000</mat-hint>
                @if (form.get('notes')?.hasError('maxlength')) {
                  <mat-error>Uwagi nie mogą przekraczać 1000 znaków</mat-error>
                }
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <div class="invoice-form__actions">
            <button mat-button type="button" routerLink="/invoices">Anuluj</button>

            <div class="invoice-form__actions-right">
              <app-loading-button
                [loading]="savingDraft()"
                [disabled]="savingIssue()"
                type="submit"
                color="primary"
              >
                <mat-icon>save</mat-icon>
                Zapisz jako szkic
              </app-loading-button>

              <app-loading-button
                [loading]="savingIssue()"
                [disabled]="savingDraft()"
                type="button"
                color="primary"
                (clicked)="onSubmit('unpaid')"
              >
                <mat-icon>send</mat-icon>
                Wystaw fakturę
              </app-loading-button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [
    `
      .invoice-form {
        padding: 24px;
        max-width: 1000px;
        margin: 0 auto;
      }
      .invoice-form__section-title {
        margin-bottom: 15px;
      }

      .invoice-form__loading,
      .invoice-form__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        gap: 16px;
        min-height: 400px;
      }

      .invoice-form__error mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
      }

      .invoice-form__header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }

      .invoice-form__title {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }

      .invoice-form__title-number {
        color: var(--mat-sys-primary);
      }

      .invoice-form__section {
        margin-bottom: 24px;
      }

      .invoice-form__row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .invoice-form__field {
        flex: 1;
        min-width: 200px;
      }

      .invoice-form__field--small {
        flex: 0 0 120px;
        min-width: 120px;
      }

      .invoice-form__field--wide {
        flex: 2;
        min-width: 300px;
      }

      .invoice-form__field--full {
        width: 100%;
      }

      .invoice-form__items-hint {
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
        padding: 24px;
        font-style: italic;
      }

      .invoice-form__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 24px 0;
        position: sticky;
        bottom: 0;
        background: #fff;
        border-top: 1px solid var(--mat-sys-outline-variant);
        margin: 0 -24px;
        padding: 16px 24px;
      }

      .invoice-form__actions-right {
        display: flex;
        gap: 12px;
      }

      @media (max-width: 599px) {
        .invoice-form {
          padding: 16px;
        }

        .invoice-form__title {
          font-size: 18px;
        }

        .invoice-form__row {
          flex-direction: column;
        }

        .invoice-form__field,
        .invoice-form__field--small,
        .invoice-form__field--wide {
          flex: none;
          width: 100%;
          min-width: auto;
        }

        .invoice-form__actions {
          flex-direction: column;
          gap: 12px;
          margin: 0 -16px;
          padding: 16px;
        }

        .invoice-form__actions-right {
          width: 100%;
          flex-direction: column;

          app-loading-button {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class InvoiceFormComponent implements OnInit, OnDestroy, CanDeactivateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoiceService = inject(InvoiceService);
  private readonly invoicesStore = inject(InvoicesStore);
  readonly formStore = inject(InvoiceFormStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Form options
  readonly paymentMethods = PAYMENT_METHODS;
  readonly currencies = CURRENCIES;

  // State
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly savingDraft = signal(false);
  readonly savingIssue = signal(false);
  readonly existingInvoice = signal<InvoiceResponse | null>(null);
  readonly selectedContractorId = signal<string | null>(null);
  readonly isManualBuyerMode = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  // Computed
  readonly isEditMode = computed(() => !!this.route.snapshot.paramMap.get('id'));

  readonly canIssue = computed(() => {
    return this.form.valid && this.formStore.hasItems();
  });

  readonly formCurrency = computed((): Currency => {
    return (this.form.get('currency')?.value as Currency) || 'PLN';
  });

  // Form
  readonly form = this.fb.group({
    invoiceNumber: ['', [Validators.required]],
    issueDate: [new Date(), [Validators.required]],
    dueDate: [this.getDefaultDueDate(), [Validators.required]],
    paymentMethod: ['transfer' as PaymentMethod, [Validators.required]],
    currency: ['PLN' as Currency, [Validators.required]],
    buyer: this.fb.group({
      name: ['', [Validators.required]],
      address: [''],
      nip: ['', [nipValidator()]],
    }),
    notes: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // Add validator for dueDate based on issueDate
    this.form
      .get('issueDate')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validateDueDate();
      });

    this.form
      .get('dueDate')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validateDueDate();
      });

    if (id) {
      this.loadExistingInvoice(id);
    } else {
      this.initializeNewInvoice();
    }
  }

  /**
   * Custom validator for due date.
   */
  private validateDueDate(): void {
    const issueDate = this.form.get('issueDate')?.value;
    const dueDate = this.form.get('dueDate')?.value;

    if (issueDate && dueDate && dueDate < issueDate) {
      this.form.get('dueDate')?.setErrors({ min: true });
    } else if (this.form.get('dueDate')?.hasError('min')) {
      // Remove only the min error
      const errors = { ...this.form.get('dueDate')?.errors };
      delete errors['min'];
      this.form.get('dueDate')?.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  ngOnDestroy(): void {
    this.formStore.reset();
  }

  /**
   * Check if user can leave without confirmation.
   */
  canDeactivate(): boolean {
    return !this.form.dirty && !this.formStore.isDirty();
  }

  /**
   * Initialize form for new invoice.
   */
  private async initializeNewInvoice(): Promise<void> {
    try {
      // Get next invoice number
      const nextNumber = await firstValueFrom(this.invoiceService.getNextNumber());
      if (nextNumber) {
        this.form.patchValue({ invoiceNumber: nextNumber.nextNumber });
      }

      // Add initial empty item
      this.formStore.addItem();

      this.loading.set(false);
    } catch (error) {
      this.loading.set(false);
      // Allow form to load even if next number fails
      this.formStore.addItem();
    }
  }

  /**
   * Load existing invoice for editing.
   */
  private async loadExistingInvoice(id: string): Promise<void> {
    try {
      const invoice = await firstValueFrom(this.invoiceService.get(id));

      if (!invoice) {
        this.loadError.set('Faktura nie została znaleziona');
        return;
      }

      // Only draft invoices can be edited
      if (invoice.status !== 'draft') {
        this.snackBar.open('Tylko faktury w statusie szkic mogą być edytowane', 'Zamknij', {
          duration: 5000,
        });
        this.router.navigate(['/invoices', id]);
        return;
      }

      this.existingInvoice.set(invoice);

      // Populate form
      this.form.patchValue({
        invoiceNumber: invoice.invoiceNumber,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        paymentMethod: invoice.paymentMethod,
        currency: invoice.currency,
        buyer: {
          name: invoice.buyer.name,
          address: invoice.buyer.address || '',
          nip: invoice.buyer.nip || '',
        },
        notes: invoice.notes || '',
      });

      // Set contractor if exists
      if (invoice.contractorId) {
        this.selectedContractorId.set(invoice.contractorId);
      } else {
        this.isManualBuyerMode.set(true);
      }

      // Initialize items
      const items: InvoiceItemFormModel[] = invoice.items.map((item) => ({
        id: item.id,
        position: item.position,
        name: item.name,
        unit: item.unit || 'szt.',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        netAmount: item.netAmount,
        vatAmount: item.vatAmount,
        grossAmount: item.grossAmount,
      }));

      this.formStore.initializeItems(items);
      this.formStore.setCurrency(invoice.currency);

      this.loading.set(false);
    } catch (error) {
      this.loadError.set(
        error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania faktury',
      );
    }
  }

  /**
   * Handle contractor selection.
   */
  onContractorSelected(
    contractor: { id: string; name: string; address?: string; nip?: string } | null,
  ): void {
    if (contractor) {
      this.selectedContractorId.set(contractor.id);
      this.form.patchValue({
        buyer: {
          name: contractor.name,
          address: contractor.address || '',
          nip: contractor.nip || '',
        },
      });
    } else {
      this.selectedContractorId.set(null);
      this.form.patchValue({
        buyer: { name: '', address: '', nip: '' },
      });
    }
  }

  /**
   * Handle manual mode toggle.
   */
  onManualModeChange(isManual: boolean): void {
    this.isManualBuyerMode.set(isManual);
    if (isManual) {
      this.selectedContractorId.set(null);
    }
  }

  /**
   * Submit form.
   */
  async onSubmit(status: 'draft' | 'unpaid'): Promise<void> {
    // Validate form
    if (status === 'unpaid' && !this.canIssue()) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        'Uzupełnij wszystkie wymagane pola przed wystawieniem faktury',
        'Zamknij',
        { duration: 5000 },
      );
      return;
    }

    // Validate items
    if (!this.formStore.hasItems()) {
      this.snackBar.open('Dodaj co najmniej jedną pozycję do faktury', 'Zamknij', {
        duration: 5000,
      });
      return;
    }

    const savingSignal = status === 'draft' ? this.savingDraft : this.savingIssue;
    savingSignal.set(true);

    try {
      const formValue = this.form.getRawValue();

      const buyer: BuyerInfoRequest = {
        name: formValue.buyer.name || '',
        address: formValue.buyer.address || undefined,
        nip: formValue.buyer.nip || undefined,
      };

      const items = this.formStore.getItemsForRequest();

      if (this.isEditMode()) {
        // Update existing invoice
        const command: UpdateInvoiceCommand = {
          invoiceNumber: formValue.invoiceNumber || undefined,
          issueDate: this.formatDate(formValue.issueDate),
          dueDate: this.formatDate(formValue.dueDate),
          paymentMethod: formValue.paymentMethod || undefined,
          buyer,
          items,
          notes: formValue.notes || undefined,
          status,
        };

        const result = await firstValueFrom(
          this.invoiceService.update(this.existingInvoice()!.id, command),
        );

        if (result) {
          this.formStore.markAsPristine();
          this.form.markAsPristine();
          this.invoicesStore.invalidateCache();

          this.snackBar.open(
            status === 'draft' ? 'Faktura została zapisana' : 'Faktura została wystawiona',
            'Zamknij',
            { duration: 3000 },
          );

          this.router.navigate(['/invoices']);
        }
      } else {
        // Create new invoice
        const command: CreateInvoiceCommand = {
          invoiceNumber: formValue.invoiceNumber || '',
          issueDate: this.formatDate(formValue.issueDate),
          dueDate: this.formatDate(formValue.dueDate),
          paymentMethod: formValue.paymentMethod || 'transfer',
          buyer,
          items,
          notes: formValue.notes || undefined,
          status,
          contractorId: this.selectedContractorId() || undefined,
        };

        const result = await firstValueFrom(this.invoiceService.create(command));

        if (result) {
          this.formStore.markAsPristine();
          this.form.markAsPristine();
          this.invoicesStore.invalidateCache();

          this.snackBar.open(
            status === 'draft' ? 'Faktura została utworzona' : 'Faktura została wystawiona',
            'Zamknij',
            { duration: 3000 },
          );

          this.router.navigate(['/invoices']);
        }
      }
    } catch (error) {
      this.snackBar.open(
        error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania faktury',
        'Zamknij',
        { duration: 5000, panelClass: ['snackbar-error'] },
      );
    } finally {
      savingSignal.set(false);
    }
  }

  /**
   * Get default due date (14 days from today).
   */
  private getDefaultDueDate(this: void): Date {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  }

  /**
   * Format date to ISO string (YYYY-MM-DD).
   */
  private formatDate(this: void, date: Date | null): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }
}
