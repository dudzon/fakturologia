import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorsStore } from './contractors.store';
import { ContractorService } from '../services/contractor.service';
import type { ContractorListResponse, ContractorResponse } from '../../types';

describe('ContractorsStore', () => {
  let store: ContractorsStore;
  let contractorServiceMock: {
    list: ReturnType<typeof vi.fn>;
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
    contractorServiceMock = {
      list: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ContractorsStore,
        { provide: ContractorService, useValue: contractorServiceMock }
      ]
    });

    store = TestBed.inject(ContractorsStore);
  });

  describe('initial state', () => {
    it('should have empty contractors array', () => {
      expect(store.contractors()).toEqual([]);
    });

    it('should have loading as false', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have error as null', () => {
      expect(store.error()).toBe(null);
    });

    it('should have isEmpty as true when not loading', () => {
      expect(store.isEmpty()).toBe(true);
    });
  });

  describe('loadContractors', () => {
    it('should load contractors and update state', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      await store.loadContractors();

      expect(store.contractors()).toEqual([mockContractor]);
      expect(store.pagination()?.total).toBe(1);
      expect(store.loading()).toBe(false);
      expect(store.isEmpty()).toBe(false);
    });

    it('should set error on failure', async () => {
      contractorServiceMock.list.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      await store.loadContractors();

      expect(store.error()).toBe('Network error');
      expect(store.loading()).toBe(false);
    });

    it('should use cache when valid', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      // First load
      await store.loadContractors();
      expect(contractorServiceMock.list).toHaveBeenCalledTimes(1);

      // Second load should use cache
      await store.loadContractors();
      expect(contractorServiceMock.list).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      // First load
      await store.loadContractors();
      expect(contractorServiceMock.list).toHaveBeenCalledTimes(1);

      // Force refresh
      await store.loadContractors(undefined, true);
      expect(contractorServiceMock.list).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateQuery', () => {
    it('should update query and reload', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      await store.updateQuery({ search: 'test' });

      expect(store.query().search).toBe('test');
      expect(contractorServiceMock.list).toHaveBeenCalled();
    });

    it('should reset page to 1 when search changes', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      await store.updateQuery({ page: 3 });
      await store.updateQuery({ search: 'test' });

      expect(store.query().page).toBe(1);
    });
  });

  describe('deleteContractor', () => {
    it('should optimistically remove contractor', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));
      contractorServiceMock.delete.mockReturnValue(of({ message: 'Deleted' }));

      await store.loadContractors();
      expect(store.contractors().length).toBe(1);

      const result = await store.deleteContractor('123');

      expect(result).toBe(true);
      expect(store.contractors().length).toBe(0);
    });

    it('should rollback on delete failure', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));
      contractorServiceMock.delete.mockReturnValue(
        throwError(() => new Error('Delete failed'))
      );

      await store.loadContractors();
      const result = await store.deleteContractor('123');

      expect(result).toBe(false);
      expect(store.contractors().length).toBe(1);
      expect(store.error()).toBe('Delete failed');
    });
  });

  describe('utility methods', () => {
    it('should invalidate cache', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      await store.loadContractors();
      expect(store.isCacheValid()).toBe(true);

      store.invalidateCache();
      expect(store.isCacheValid()).toBe(false);
    });

    it('should clear error', async () => {
      contractorServiceMock.list.mockReturnValue(
        throwError(() => new Error('Test error'))
      );

      await store.loadContractors();
      expect(store.error()).toBeTruthy();

      store.clearError();
      expect(store.error()).toBe(null);
    });

    it('should reset to initial state', async () => {
      contractorServiceMock.list.mockReturnValue(of(mockListResponse));

      await store.loadContractors();
      store.reset();

      expect(store.contractors()).toEqual([]);
      expect(store.pagination()).toBe(null);
      expect(store.loading()).toBe(false);
    });
  });
});
