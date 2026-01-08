import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { InvoiceService } from '../../services/invoice.service';
import { InvoicesStore } from '../../stores/invoices.store';
import { InvoiceStatusBadgeComponent } from './components/invoice-status-badge.component';
import { InvoicePrintPreviewComponent } from './components/invoice-print-preview.component';
import {
  InvoiceStatusDialogComponent,
  InvoiceStatusDialogData,
} from './components/invoice-status-dialog.component';
import type { InvoiceResponse, InvoiceStatus } from '../../../types';

/**
 * InvoiceDetailComponent - Read-only view of invoice details.
 *
 * Features:
 * - Full invoice preview in print-like format
 * - Action toolbar: Edit, Duplicate, Generate PDF, Change Status
 * - Status-dependent action visibility
 * - Integration with PDF generation service
 */
@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatDividerModule,
    InvoiceStatusBadgeComponent,
    InvoicePrintPreviewComponent,
  ],
  template: `
    <div class="invoice-detail">
      @if (loading()) {
        <div class="invoice-detail__loading">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Ładowanie faktury...</p>
        </div>
      } @else if (error()) {
        <div class="invoice-detail__error">
          <mat-icon color="warn">error_outline</mat-icon>
          <h2>Nie można załadować faktury</h2>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" routerLink="/invoices">Powrót do listy</button>
        </div>
      } @else if (invoice()) {
        <!-- Header Toolbar -->
        <div class="invoice-detail__header">
          <div class="invoice-detail__header-left">
            <button
              mat-icon-button
              routerLink="/invoices"
              matTooltip="Powrót do listy"
              aria-label="Powrót do listy faktur"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="invoice-detail__title">Faktura {{ invoice()!.invoiceNumber }}</h1>
            <app-invoice-status-badge [status]="invoice()!.status" />
          </div>

          <div class="invoice-detail__actions">
            @if (canEdit()) {
              <a mat-stroked-button [routerLink]="['/invoices', invoice()!.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edytuj
              </a>
            }

            <button mat-stroked-button (click)="duplicateInvoice()" [disabled]="duplicating()">
              @if (duplicating()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>content_copy</mat-icon>
              }
              Duplikuj
            </button>

            @if (canGeneratePdf()) {
              <button mat-stroked-button (click)="generatePdf()" [disabled]="generatingPdf()">
                @if (generatingPdf()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>picture_as_pdf</mat-icon>
                }
                Generuj PDF
              </button>
            }

            <button mat-raised-button color="primary" (click)="openStatusDialog()">
              <mat-icon>published_with_changes</mat-icon>
              Zmień status
            </button>
          </div>
        </div>

        <!-- Draft Warning -->
        @if (invoice()!.status === 'draft') {
          <div class="invoice-detail__draft-warning">
            <mat-icon>info</mat-icon>
            <span>
              To jest szkic faktury. Przed wystawieniem upewnij się, że wszystkie dane są kompletne.
              Faktury w statusie szkic nie mogą być pobrane jako PDF.
            </span>
          </div>
        }

        <!-- Print Preview -->
        <div class="invoice-detail__preview">
          <app-invoice-print-preview [invoice]="invoice()!" />
        </div>

        <!-- Footer Actions (Mobile) -->
        <div class="invoice-detail__footer-actions">
          <button mat-button routerLink="/invoices">
            <mat-icon>arrow_back</mat-icon>
            Powrót do listy
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .invoice-detail {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .invoice-detail__loading,
      .invoice-detail__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        gap: 16px;
        min-height: 400px;
      }

      .invoice-detail__error mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
      }

      .invoice-detail__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 24px;
      }

      .invoice-detail__header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .invoice-detail__title {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }

      .invoice-detail__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        button,
        a {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        mat-spinner {
          margin-right: 8px;
        }
      }

      .invoice-detail__draft-warning {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        margin-bottom: 24px;
        border-radius: 8px;
        background-color: #fff3e0;
        color: #e65100;

        mat-icon {
          flex-shrink: 0;
        }
      }

      .invoice-detail__preview {
        background: var(--mat-sys-surface);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .invoice-detail__footer-actions {
        display: none;
        margin-top: 24px;
        justify-content: center;
      }

      @media (max-width: 959px) {
        .invoice-detail {
          padding: 16px;
        }

        .invoice-detail__header {
          flex-direction: column;
          align-items: flex-start;
        }

        .invoice-detail__header-left {
          width: 100%;
        }

        .invoice-detail__title {
          font-size: 18px;
          flex: 1;
        }

        .invoice-detail__actions {
          width: 100%;

          button,
          a {
            flex: 1;
            justify-content: center;
          }
        }
      }

      @media (max-width: 599px) {
        .invoice-detail__actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .invoice-detail__footer-actions {
          display: flex;
        }
      }
    `,
  ],
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoiceService = inject(InvoiceService);
  private readonly invoicesStore = inject(InvoicesStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State
  readonly invoice = signal<InvoiceResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly duplicating = signal(false);
  readonly generatingPdf = signal(false);

  // Computed
  readonly canEdit = computed(() => this.invoice()?.status === 'draft');
  readonly canGeneratePdf = computed(() => this.invoice()?.status !== 'draft');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(id);
    } else {
      this.error.set('Nieprawidłowy identyfikator faktury');
      this.loading.set(false);
    }
  }

  /**
   * Load invoice data from API.
   */
  private async loadInvoice(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const invoice = await this.invoiceService.get(id).toPromise();
      if (invoice) {
        this.invoice.set(invoice);
      } else {
        this.error.set('Faktura nie została znaleziona');
      }
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Wystąpił błąd podczas ładowania faktury',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Open status change dialog.
   */
  openStatusDialog(): void {
    const inv = this.invoice();
    if (!inv) return;

    const dialogData: InvoiceStatusDialogData = {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      currentStatus: inv.status,
    };

    const dialogRef = this.dialog.open(InvoiceStatusDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (newStatus: InvoiceStatus | undefined) => {
      if (newStatus && newStatus !== inv.status) {
        try {
          const result = await this.invoiceService
            .updateStatus(inv.id, { status: newStatus })
            .toPromise();

          if (result) {
            this.invoice.update((current) => (current ? { ...current, status: newStatus } : null));
            this.invoicesStore.updateInvoiceStatus(inv.id, newStatus);
            this.snackBar.open('Status faktury został zmieniony', 'Zamknij', {
              duration: 3000,
            });
          }
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
   * Duplicate the invoice.
   */
  async duplicateInvoice(): Promise<void> {
    const inv = this.invoice();
    if (!inv) return;

    this.duplicating.set(true);

    try {
      const duplicated = await this.invoiceService.duplicate(inv.id).toPromise();
      if (duplicated) {
        this.snackBar.open('Faktura została zduplikowana', 'Zamknij', {
          duration: 3000,
        });
        this.invoicesStore.invalidateCache();
        this.router.navigate(['/invoices', duplicated.id, 'edit']);
      }
    } catch (error) {
      this.snackBar.open('Błąd podczas duplikowania faktury', 'Zamknij', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    } finally {
      this.duplicating.set(false);
    }
  }

  /**
   * Generate PDF for the invoice.
   */
  async generatePdf(): Promise<void> {
    const inv = this.invoice();
    if (!inv) return;

    if (inv.status === 'draft') {
      this.snackBar.open(
        'Nie można wygenerować PDF dla szkicu faktury. Najpierw wystaw fakturę.',
        'Zamknij',
        { duration: 5000 },
      );
      return;
    }

    this.generatingPdf.set(true);

    try {
      // TODO: Implement PDF generation with pdfmake in Web Worker
      // For now, show a placeholder message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.snackBar.open('Generowanie PDF zostanie zaimplementowane wkrótce', 'Zamknij', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open('Błąd podczas generowania PDF', 'Zamknij', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    } finally {
      this.generatingPdf.set(false);
    }
  }
}
