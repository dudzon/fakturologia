import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorListComponent } from './contractor-list.component';
import { ContractorsStore } from '../../stores/contractors.store';
import type { ContractorResponse, PaginationInfo } from '../../../types';

describe('ContractorListComponent', () => {
  let component: ContractorListComponent;
  let fixture: ComponentFixture<ContractorListComponent>;
  let mockStore: Partial<ContractorsStore>;

  const mockContractors: ContractorResponse[] = [
    {
      id: '1',
      name: 'Company A',
      address: 'Address A',
      nip: '1234567890',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Company B',
      address: 'Address B',
      nip: '0987654321',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z'
    }
  ];

  const mockPagination: PaginationInfo = {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1
  };

  beforeEach(async () => {
    mockStore = {
      contractors: signal(mockContractors),
      pagination: signal(mockPagination),
      loading: signal(false),
      error: signal(null),
      isEmpty: signal(false),
      totalCount: signal(2),
      currentPage: signal(1),
      pageSize: signal(20),
      loadContractors: vi.fn().mockResolvedValue(undefined),
      updateQuery: vi.fn().mockResolvedValue(undefined),
      deleteContractor: vi.fn().mockResolvedValue(true),
      clearError: vi.fn(),
      invalidateCache: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ContractorListComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        MatSnackBarModule,
        MatDialogModule
      ],
      providers: [
        { provide: ContractorsStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contractors on init', () => {
    expect(mockStore.loadContractors).toHaveBeenCalled();
  });

  it('should display contractors in table', () => {
    const tableRows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(tableRows.length).toBe(2);
  });

  it('should display contractor names', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Company A');
    expect(compiled.textContent).toContain('Company B');
  });

  describe('search functionality', () => {
    it('should update search query on input', fakeAsync(() => {
      component.onSearchChange('test search');
      tick(300); // debounce time

      expect(mockStore.updateQuery).toHaveBeenCalledWith({
        search: 'test search'
      });
    }));

    it('should debounce search input', fakeAsync(() => {
      component.onSearchChange('t');
      component.onSearchChange('te');
      component.onSearchChange('tes');
      component.onSearchChange('test');
      tick(300);

      // Should only call once after debounce
      expect(mockStore.updateQuery).toHaveBeenCalledTimes(1);
      expect(mockStore.updateQuery).toHaveBeenCalledWith({ search: 'test' });
    }));

    it('should clear search', fakeAsync(() => {
      component.onSearchChange('test');
      tick(300);

      component.clearSearch();
      tick(300);

      expect(component.searchQuery()).toBe('');
      expect(mockStore.updateQuery).toHaveBeenCalledWith({ search: undefined });
    }));
  });

  describe('sorting', () => {
    it('should update sort on column click', () => {
      component.onSortChange({ active: 'name', direction: 'asc' });

      expect(mockStore.updateQuery).toHaveBeenCalledWith({
        sortBy: 'name',
        sortOrder: 'asc'
      });
    });

    it('should reset to default sort when cleared', () => {
      component.onSortChange({ active: '', direction: '' });

      expect(component.sortBy()).toBe('createdAt');
      expect(component.sortDirection()).toBe('desc');
    });
  });

  describe('pagination', () => {
    it('should update page on paginator change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 20, length: 100 });

      expect(mockStore.updateQuery).toHaveBeenCalledWith({
        page: 2, // pageIndex is 0-based, API is 1-based
        limit: 20
      });
    });

    it('should update page size', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 50, length: 100 });

      expect(mockStore.updateQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 50
      });
    });
  });

  describe('NIP formatting', () => {
    it('should format valid NIP', () => {
      expect(component.formatNip('1234567890')).toBe('123-456-78-90');
    });

    it('should return dash for null NIP', () => {
      expect(component.formatNip(null)).toBe('—');
    });

    it('should return dash for undefined NIP', () => {
      expect(component.formatNip(undefined)).toBe('—');
    });

    it('should return original value for invalid length', () => {
      expect(component.formatNip('12345')).toBe('12345');
    });
  });

  describe('reload', () => {
    it('should clear error and force refresh', () => {
      component.reload();

      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockStore.loadContractors).toHaveBeenCalledWith(undefined, true);
    });
  });
});
