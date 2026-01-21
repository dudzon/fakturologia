import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  InvoiceResponse,
  InvoiceListResponse,
  InvoiceListQuery,
  CreateInvoiceCommand,
  UpdateInvoiceCommand,
  UpdateInvoiceStatusCommand,
  UpdateInvoiceStatusResponse,
  DuplicateInvoiceCommand,
  DeleteInvoiceResponse,
  NextInvoiceNumberResponse,
} from '../../types';
import { environment } from '../../environments/environment';

/**
 * Service for invoice HTTP operations.
 * Handles all invoice-related API calls including CRUD operations,
 * status changes, and duplication.
 */
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/invoices`;

  /**
   * GET /api/v1/invoices
   * Fetches paginated list of invoices with optional filtering and sorting.
   */
  list(query?: InvoiceListQuery): Observable<InvoiceListResponse> {
    let params = new HttpParams();

    if (query) {
      if (query.page !== undefined) {
        params = params.set('page', query.page.toString());
      }
      if (query.limit !== undefined) {
        params = params.set('limit', query.limit.toString());
      }
      if (query.status) {
        params = params.set('status', query.status);
      }
      if (query.search) {
        params = params.set('search', query.search);
      }
      if (query.dateFrom) {
        params = params.set('dateFrom', query.dateFrom);
      }
      if (query.dateTo) {
        params = params.set('dateTo', query.dateTo);
      }
      if (query.sortBy) {
        params = params.set('sortBy', query.sortBy);
      }
      if (query.sortOrder) {
        params = params.set('sortOrder', query.sortOrder);
      }
    }

    return this.http.get<InvoiceListResponse>(this.apiUrl, { params });
  }

  /**
   * GET /api/v1/invoices/:id
   * Fetches a single invoice by ID with full details including items.
   */
  get(id: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/invoices
   * Creates a new invoice.
   */
  create(data: CreateInvoiceCommand): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.apiUrl, data);
  }

  /**
   * PUT /api/v1/invoices/:id
   * Updates an existing invoice (only draft invoices can be updated).
   */
  update(id: string, data: UpdateInvoiceCommand): Observable<InvoiceResponse> {
    return this.http.put<InvoiceResponse>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * DELETE /api/v1/invoices/:id
   * Soft-deletes an invoice.
   */
  delete(id: string): Observable<DeleteInvoiceResponse> {
    return this.http.delete<DeleteInvoiceResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * PATCH /api/v1/invoices/:id/status
   * Updates the status of an invoice.
   * Allowed transitions: draft -> unpaid -> paid
   */
  updateStatus(
    id: string,
    data: UpdateInvoiceStatusCommand,
  ): Observable<UpdateInvoiceStatusResponse> {
    return this.http.patch<UpdateInvoiceStatusResponse>(`${this.apiUrl}/${id}/status`, data);
  }

  /**
   * POST /api/v1/invoices/:id/duplicate
   * Duplicates an existing invoice with new dates and number.
   */
  duplicate(id: string, data?: DuplicateInvoiceCommand): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${id}/duplicate`, data || {});
  }

  /**
   * GET /api/v1/invoices/next-number
   * Gets the next available invoice number based on user's format settings.
   */
  getNextNumber(): Observable<NextInvoiceNumberResponse> {
    return this.http.get<NextInvoiceNumberResponse>(`${this.apiUrl}/next-number`);
  }
}
