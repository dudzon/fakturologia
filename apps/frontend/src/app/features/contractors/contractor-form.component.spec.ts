import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractorFormComponent } from './contractor-form.component';
import { ContractorService } from '../../services/contractor.service';
import { ContractorsStore } from '../../stores/contractors.store';
import type { ContractorResponse } from '../../../types';

describe('ContractorFormComponent', () => {
  let component: ContractorFormComponent;
  let fixture: ComponentFixture<ContractorFormComponent>;
  let contractorServiceMock: {
    get: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let contractorsStoreMock: Partial<ContractorsStore>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockContractor: ContractorResponse = {
    id: '123',
    name: 'Test Company',
    address: 'Test Address',
    nip: '1234567890',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  };

  const createComponent = async (routeParams: { id?: string } = {}) => {
    contractorServiceMock = {
      get: vi.fn().mockReturnValue(of(mockContractor)),
      create: vi.fn().mockReturnValue(of(mockContractor)),
      update: vi.fn().mockReturnValue(of(mockContractor))
    };

    contractorsStoreMock = {
      invalidateCache: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ContractorFormComponent,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: ContractorService, useValue: contractorServiceMock },
        { provide: ContractorsStore, useValue: contractorsStoreMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => routeParams[key as keyof typeof routeParams] || null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Create mode', () => {
    beforeEach(async () => {
      await createComponent();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode', () => {
      expect(component.isEditMode()).toBe(false);
    });

    it('should have empty form', () => {
      expect(component.contractorForm.get('name')?.value).toBe('');
      expect(component.contractorForm.get('address')?.value).toBe('');
      expect(component.contractorForm.get('nip')?.value).toBe('');
    });

    it('should validate required name', () => {
      component.contractorForm.get('name')?.markAsTouched();
      expect(component.contractorForm.get('name')?.hasError('required')).toBe(true);
    });

    it('should validate NIP format', () => {
      const nipControl = component.contractorForm.get('nip');
      nipControl?.setValue('invalid');
      nipControl?.markAsTouched();
      expect(nipControl?.hasError('nip')).toBe(true);
    });

    it('should accept valid NIP', () => {
      const nipControl = component.contractorForm.get('nip');
      nipControl?.setValue('5260250274'); // Valid Polish NIP
      expect(nipControl?.hasError('nip')).toBe(false);
    });

    it('should normalize NIP on blur', () => {
      const nipControl = component.contractorForm.get('nip');
      nipControl?.setValue('526-025-02-74');
      component.onNipBlur();
      expect(nipControl?.value).toBe('5260250274');
    });

    it('should create contractor on submit', fakeAsync(() => {
      component.contractorForm.patchValue({
        name: 'New Company',
        address: 'New Address',
        nip: '5260250274'
      });

      component.onSubmit();
      tick();

      expect(contractorServiceMock.create).toHaveBeenCalledWith({
        name: 'New Company',
        address: 'New Address',
        nip: '5260250274'
      });
      expect(contractorsStoreMock.invalidateCache).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/contractors']);
    }));

    it('should handle NIP_EXISTS error', fakeAsync(() => {
      contractorServiceMock.create.mockReturnValue(
        throwError(() => ({ error: { code: 'NIP_EXISTS' } }))
      );

      component.contractorForm.patchValue({
        name: 'New Company',
        nip: '5260250274'
      });

      component.onSubmit();
      tick();

      expect(component.apiError()).toBe('Kontrahent z tym NIP już istnieje');
    }));
  });

  describe('Edit mode', () => {
    beforeEach(async () => {
      await createComponent({ id: '123' });
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode()).toBe(true);
    });

    it('should load contractor data', () => {
      expect(contractorServiceMock.get).toHaveBeenCalledWith('123');
    });

    it('should populate form with contractor data', fakeAsync(() => {
      tick();
      expect(component.contractorForm.get('name')?.value).toBe('Test Company');
      expect(component.contractorForm.get('address')?.value).toBe('Test Address');
      expect(component.contractorForm.get('nip')?.value).toBe('1234567890');
    }));

    it('should update contractor on submit', fakeAsync(() => {
      tick(); // Wait for data to load

      component.contractorForm.patchValue({
        name: 'Updated Company'
      });

      component.onSubmit();
      tick();

      expect(contractorServiceMock.update).toHaveBeenCalledWith('123', {
        name: 'Updated Company',
        address: 'Test Address',
        nip: '1234567890'
      });
    }));
  });

  describe('canDeactivate', () => {
    beforeEach(async () => {
      await createComponent();
    });

    it('should allow deactivation when form is pristine', () => {
      expect(component.canDeactivate()).toBe(true);
    });

    it('should prevent deactivation when form is dirty', () => {
      component.contractorForm.get('name')?.setValue('Changed');
      component.contractorForm.markAsDirty();
      expect(component.canDeactivate()).toBe(false);
    });

    it('should allow deactivation after successful save', fakeAsync(() => {
      component.contractorForm.patchValue({ name: 'Test' });
      component.contractorForm.markAsDirty();

      component.onSubmit();
      tick();

      expect(component.canDeactivate()).toBe(true);
    }));
  });
});
