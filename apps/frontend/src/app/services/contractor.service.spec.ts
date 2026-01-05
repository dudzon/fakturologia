import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorService } from './contractor.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { ContractorListResponse, ContractorResponse } from '../../types';

describe('ContractorService', () => {
  let service: ContractorService;
  let httpClientMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockContractor: ContractorResponse = {
    id: '123',
    name: 'Test Company',
    address: 'Test Address',
    nip: '1234567890',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  };

  const mockListResponse: ContractorListResponse = {
    data: [mockContractor],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    }
  };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ContractorService,
        { provide: HttpClient, useValue: httpClientMock }
      ]
    });

    service = TestBed.inject(ContractorService);
  });

  describe('list', () => {
    it('should fetch contractors list', () => {
      httpClientMock.get.mockReturnValue(of(mockListResponse));

      service.list().subscribe({
        next: (result) => {
          expect(result).toEqual(mockListResponse);
          expect(httpClientMock.get).toHaveBeenCalledTimes(1);
        }
      });
    });

    it('should pass query parameters', () => {
      httpClientMock.get.mockReturnValue(of(mockListResponse));

      service.list({ page: 2, limit: 10, search: 'test' }).subscribe({
        next: () => {
          const callArgs = httpClientMock.get.mock.calls[0];
          const params = callArgs[1]?.params as HttpParams;
          expect(params.get('page')).toBe('2');
          expect(params.get('limit')).toBe('10');
          expect(params.get('search')).toBe('test');
        }
      });
    });
  });

  describe('get', () => {
    it('should fetch a single contractor', () => {
      httpClientMock.get.mockReturnValue(of(mockContractor));

      service.get('123').subscribe({
        next: (result) => {
          expect(result).toEqual(mockContractor);
          expect(httpClientMock.get).toHaveBeenCalledWith(
            expect.stringContaining('/123')
          );
        }
      });
    });
  });

  describe('create', () => {
    it('should create a new contractor', () => {
      httpClientMock.post.mockReturnValue(of(mockContractor));

      const newContractor = { name: 'New Company', nip: '1234567890' };

      service.create(newContractor).subscribe({
        next: (result) => {
          expect(result).toEqual(mockContractor);
          expect(httpClientMock.post).toHaveBeenCalledWith(
            expect.any(String),
            newContractor
          );
        }
      });
    });
  });

  describe('update', () => {
    it('should update an existing contractor', () => {
      httpClientMock.put.mockReturnValue(of(mockContractor));

      const updateData = { name: 'Updated Company' };

      service.update('123', updateData).subscribe({
        next: (result) => {
          expect(result).toEqual(mockContractor);
          expect(httpClientMock.put).toHaveBeenCalledWith(
            expect.stringContaining('/123'),
            updateData
          );
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete a contractor', () => {
      const mockResponse = { message: 'Contractor deleted' };
      httpClientMock.delete.mockReturnValue(of(mockResponse));

      service.delete('123').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpClientMock.delete).toHaveBeenCalledWith(
            expect.stringContaining('/123')
          );
        }
      });
    });
  });
});
