import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ContractorResponse,
  ContractorListResponse,
  ContractorListQuery,
  CreateContractorCommand,
  UpdateContractorCommand,
  DeleteContractorResponse,
} from '../../types';
import { environment } from '../../environments/environment';

/**
 * Service for contractor HTTP operations.
 * Handles all contractor-related API calls including CRUD operations.
 */
@Injectable({ providedIn: 'root' })
export class ContractorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/contractors`;

  /**
   * GET /api/v1/contractors
   * Fetches paginated list of contractors with optional filtering and sorting.
   */
  list(query?: ContractorListQuery): Observable<ContractorListResponse> {
    let params = new HttpParams();

    if (query) {
      if (query.page !== undefined) {
        params = params.set('page', query.page.toString());
      }
      if (query.limit !== undefined) {
        params = params.set('limit', query.limit.toString());
      }
      if (query.search) {
        params = params.set('search', query.search);
      }
      if (query.sortBy) {
        params = params.set('sortBy', query.sortBy);
      }
      if (query.sortOrder) {
        params = params.set('sortOrder', query.sortOrder);
      }
    }

    return this.http.get<ContractorListResponse>(this.apiUrl, { params });
  }

  /**
   * GET /api/v1/contractors/:id
   * Fetches a single contractor by ID.
   */
  get(id: string): Observable<ContractorResponse> {
    return this.http.get<ContractorResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/contractors
   * Creates a new contractor.
   */
  create(data: CreateContractorCommand): Observable<ContractorResponse> {
    return this.http.post<ContractorResponse>(this.apiUrl, data);
  }

  /**
   * PUT /api/v1/contractors/:id
   * Updates an existing contractor.
   */
  update(id: string, data: UpdateContractorCommand): Observable<ContractorResponse> {
    return this.http.put<ContractorResponse>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * DELETE /api/v1/contractors/:id
   * Soft-deletes a contractor.
   */
  delete(id: string): Observable<DeleteContractorResponse> {
    return this.http.delete<DeleteContractorResponse>(`${this.apiUrl}/${id}`);
  }
}
