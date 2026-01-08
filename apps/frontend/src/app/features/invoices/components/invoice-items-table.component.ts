import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { InvoiceFormStore, InvoiceItemFormModel } from '../../../stores/invoice-form.store';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { VatRate } from '../../../../types';

/**
 * Unit options for invoice items.
 */
const UNIT_OPTIONS = [
  { value: 'szt.', label: 'szt.' },
  { value: 'godz.', label: 'godz.' },
  { value: 'usł.', label: 'usł.' },
  { value: 'kpl.', label: 'kpl.' },
  { value: 'mb', label: 'mb' },
  { value: 'm²', label: 'm²' },
  { value: 'kg', label: 'kg' },
  { value: 'l', label: 'l' },
];

/**
 * VAT rate options.
 */
const VAT_RATE_OPTIONS: { value: VatRate; label: string }[] = [
  { value: '23', label: '23%' },
  { value: '8', label: '8%' },
  { value: '5', label: '5%' },
  { value: '0', label: '0%' },
  { value: 'zw', label: 'zw.' },
];

/**
 * InvoiceItemsTableComponent - Dynamic table for invoice line items.
 *
 * Features:
 * - Add/remove/edit items
 * - Automatic calculation of amounts
 * - Inline editing with validation
 * - Focus management
 */
@Component({
  selector: 'app-invoice-items-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  template: `
    <div class="items-table">
      @if (formStore.hasItems()) {
        <div class="items-table__container">
          <table mat-table [dataSource]="formStore.items()" class="items-table__table">
            <!-- Position Column -->
            <ng-container matColumnDef="position">
              <th mat-header-cell *matHeaderCellDef>Lp.</th>
              <td mat-cell *matCellDef="let item; let i = index">
                {{ i + 1 }}
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nazwa towaru/usługi</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="items-table__field items-table__field--name"
                >
                  <input
                    matInput
                    [ngModel]="item.name"
                    (ngModelChange)="updateItem(i, 'name', $event)"
                    placeholder="Nazwa pozycji"
                    required
                  />
                </mat-form-field>
              </td>
            </ng-container>

            <!-- Quantity Column -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Ilość</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="items-table__field items-table__field--number"
                >
                  <input
                    matInput
                    type="number"
                    [ngModel]="item.quantity"
                    (ngModelChange)="updateItem(i, 'quantity', $event)"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </mat-form-field>
              </td>
            </ng-container>

            <!-- Unit Column -->
            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef>J.m.</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="items-table__field items-table__field--unit"
                >
                  <mat-select [ngModel]="item.unit" (ngModelChange)="updateItem(i, 'unit', $event)">
                    @for (unit of unitOptions; track unit.value) {
                      <mat-option [value]="unit.value">{{ unit.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <!-- Unit Price Column -->
            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>Cena netto</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="items-table__field items-table__field--number"
                >
                  <input
                    matInput
                    type="number"
                    [ngModel]="item.unitPrice"
                    (ngModelChange)="updateItem(i, 'unitPrice', $event)"
                    min="0"
                    step="0.01"
                    required
                  />
                </mat-form-field>
              </td>
            </ng-container>

            <!-- VAT Rate Column -->
            <ng-container matColumnDef="vatRate">
              <th mat-header-cell *matHeaderCellDef>VAT</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="items-table__field items-table__field--vat"
                >
                  <mat-select
                    [ngModel]="item.vatRate"
                    (ngModelChange)="updateItem(i, 'vatRate', $event)"
                  >
                    @for (rate of vatRateOptions; track rate.value) {
                      <mat-option [value]="rate.value">{{ rate.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <!-- Net Amount Column (readonly) -->
            <ng-container matColumnDef="netAmount">
              <th mat-header-cell *matHeaderCellDef class="text-right">Netto</th>
              <td mat-cell *matCellDef="let item" class="text-right">
                {{ formatCurrency(item.netAmount) }}
              </td>
            </ng-container>

            <!-- Gross Amount Column (readonly) -->
            <ng-container matColumnDef="grossAmount">
              <th mat-header-cell *matHeaderCellDef class="text-right">Brutto</th>
              <td mat-cell *matCellDef="let item" class="text-right">
                {{ formatCurrency(item.grossAmount) }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item; let i = index">
                <button
                  mat-icon-button
                  color="warn"
                  (click)="removeItem(i)"
                  matTooltip="Usuń pozycję"
                  aria-label="Usuń pozycję"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>
      }

      <!-- Add Item Button -->
      <div class="items-table__add-row">
        <button mat-stroked-button color="primary" type="button" (click)="addItem()">
          <mat-icon>add</mat-icon>
          Dodaj pozycję
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .items-table__container {
        overflow-x: auto;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
      }

      .items-table__table {
        width: 100%;
        min-width: 900px;

        th,
        td {
          padding: 8px;
          vertical-align: top;
        }

        th {
          font-weight: 500;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--mat-sys-on-surface-variant);
          background: var(--mat-sys-surface-container);
        }

        .text-right {
          text-align: right;
        }
      }

      .items-table__field {
        width: 100%;

        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }
      }

      .items-table__field--name {
        min-width: 200px;
      }

      .items-table__field--number {
        width: 100px;
      }

      .items-table__field--unit {
        width: 80px;
      }

      .items-table__field--vat {
        width: 80px;
      }

      .items-table__add-row {
        margin-top: 16px;
        display: flex;
        justify-content: center;
      }

      @media (max-width: 959px) {
        .items-table__container {
          margin: 0 -16px;
          border-radius: 0;
          border-left: none;
          border-right: none;
        }
      }
    `,
  ],
})
export class InvoiceItemsTableComponent {
  readonly formStore = inject(InvoiceFormStore);
  private readonly dialog = inject(MatDialog);

  readonly unitOptions = UNIT_OPTIONS;
  readonly vatRateOptions = VAT_RATE_OPTIONS;

  readonly displayedColumns = [
    'position',
    'name',
    'quantity',
    'unit',
    'unitPrice',
    'vatRate',
    'netAmount',
    'grossAmount',
    'actions',
  ];

  /**
   * Add new item.
   */
  addItem(): void {
    this.formStore.addItem();
  }

  /**
   * Update item field.
   */
  updateItem(index: number, field: keyof InvoiceItemFormModel, value: string): void {
    this.formStore.updateItem(index, { [field]: value });
  }

  /**
   * Remove item with confirmation for last item.
   */
  removeItem(index: number): void {
    const items = this.formStore.items();

    if (items.length === 1) {
      const dialogData: ConfirmDialogData = {
        title: 'Usuń pozycję',
        message:
          'Czy na pewno chcesz usunąć ostatnią pozycję? Faktura musi zawierać co najmniej jedną pozycję.',
        confirmText: 'Usuń',
        cancelText: 'Anuluj',
        confirmColor: 'warn',
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: dialogData,
        width: '400px',
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.formStore.removeItem(index);
        }
      });
    } else {
      this.formStore.removeItem(index);
    }
  }

  /**
   * Format currency value.
   */
  formatCurrency(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
