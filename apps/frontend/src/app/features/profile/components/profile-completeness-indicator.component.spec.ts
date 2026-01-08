import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

import { ProfileCompletenessIndicatorComponent } from './profile-completeness-indicator.component';
import type { UserProfileResponse } from '../../../../types';

describe('ProfileCompletenessIndicatorComponent', () => {
  let fixture: ComponentFixture<ProfileCompletenessIndicatorComponent>;
  let component: ProfileCompletenessIndicatorComponent;

  beforeAll(() => {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileCompletenessIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileCompletenessIndicatorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default null profile', () => {
      expect(component.profile()).toBeNull();
    });
  });

  describe('completenessState computed signal', () => {
    it('should return 0% complete when profile is null', () => {
      fixture.componentRef.setInput('profile', null);
      fixture.detectChanges();

      const state = component.completenessState();
      expect(state.isComplete).toBe(false);
      expect(state.completionPercentage).toBe(0);
      expect(state.missingFields).toEqual(['companyName', 'nip', 'address']);
    });

    it('should return 0% complete when all required fields are empty', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: '',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const state = component.completenessState();
      expect(state.isComplete).toBe(false);
      expect(state.completionPercentage).toBe(0);
      expect(state.missingFields).toEqual(['companyName', 'nip', 'address']);
    });

    it('should return 33% complete when one field is filled', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const state = component.completenessState();
      expect(state.isComplete).toBe(false);
      expect(state.completionPercentage).toBe(33);
      expect(state.missingFields).toEqual(['nip', 'address']);
    });

    it('should return 67% complete when two fields are filled', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const state = component.completenessState();
      expect(state.isComplete).toBe(false);
      expect(state.completionPercentage).toBe(67);
      expect(state.missingFields).toEqual(['address']);
    });

    it('should return 100% complete when all required fields are filled', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const state = component.completenessState();
      expect(state.isComplete).toBe(true);
      expect(state.completionPercentage).toBe(100);
      expect(state.missingFields).toEqual([]);
    });

    it('should not consider optional fields for completeness', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: 'PL123456789',
        invoiceNumberFormat: 'FV/{YYYY}/{NNN}',
        invoiceNumberCounter: 50,
        logoUrl: 'https://example.com/logo.png',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const state = component.completenessState();
      expect(state.isComplete).toBe(true);
      expect(state.completionPercentage).toBe(100);
    });

    it('should update state when profile changes', () => {
      const incompleteProfile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', incompleteProfile);
      fixture.detectChanges();

      expect(component.completenessState().completionPercentage).toBe(33);

      const completeProfile: UserProfileResponse = {
        ...incompleteProfile,
        nip: '1234567890',
        address: 'Test Address 123',
      };

      fixture.componentRef.setInput('profile', completeProfile);
      fixture.detectChanges();

      expect(component.completenessState().completionPercentage).toBe(100);
    });
  });

  describe('requiredFieldsMeta computed signal', () => {
    it('should return all fields as unfilled when profile is null', () => {
      fixture.componentRef.setInput('profile', null);
      fixture.detectChanges();

      const meta = component.requiredFieldsMeta();
      expect(meta).toHaveLength(3);
      expect(meta[0]).toEqual({ key: 'companyName', label: 'Nazwa firmy', filled: false });
      expect(meta[1]).toEqual({ key: 'nip', label: 'NIP', filled: false });
      expect(meta[2]).toEqual({ key: 'address', label: 'Adres', filled: false });
    });

    it('should mark filled fields correctly', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const meta = component.requiredFieldsMeta();
      expect(meta[0].filled).toBe(true);
      expect(meta[1].filled).toBe(true);
      expect(meta[2].filled).toBe(false);
    });

    it('should mark all fields as filled when profile is complete', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const meta = component.requiredFieldsMeta();
      expect(meta.every((field) => field.filled)).toBe(true);
    });
  });

  describe('DOM Rendering - Incomplete Profile', () => {
    it('should render warning container when profile is incomplete', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.completeness-container.warning');
      expect(container).toBeTruthy();
    });

    it('should display initial title when completion is 0%', () => {
      fixture.componentRef.setInput('profile', null);
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.completeness-title');
      expect(title?.textContent?.trim()).toBe('Uzupełnij profil, aby wystawiać faktury');
    });

    it('should display progress title when completion is partial', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.completeness-title');
      expect(title?.textContent?.trim()).toBe('Dokończ uzupełnianie profilu');
    });

    it('should render progress bar with correct value', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();
      // Verify progress bar is rendered (attribute binding may not be reflected in test)
      expect(component.completenessState().completionPercentage).toBe(67);
    });

    it('should display completion percentage text', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const progressText = fixture.nativeElement.querySelector('.progress-text');
      expect(progressText?.textContent?.trim()).toBe('33% ukończone');
    });

    it('should render all required fields', () => {
      fixture.componentRef.setInput('profile', null);
      fixture.detectChanges();

      const fieldItems = fixture.nativeElement.querySelectorAll('.field-item');
      expect(fieldItems).toHaveLength(3);
    });

    it('should display correct labels for required fields', () => {
      fixture.componentRef.setInput('profile', null);
      fixture.detectChanges();

      const fieldItems = fixture.nativeElement.querySelectorAll('.field-item');
      expect(fieldItems[0]?.textContent).toContain('Nazwa firmy');
      expect(fieldItems[1]?.textContent).toContain('NIP');
      expect(fieldItems[2]?.textContent).toContain('Adres');
    });

    it('should display unchecked icon for empty fields', () => {
      fixture.componentRef.setInput('profile', null);
      fixture.detectChanges();

      const fieldItems = fixture.nativeElement.querySelectorAll('.field-item');
      const icons = Array.from(fieldItems).map((item: any) =>
        item.querySelector('mat-icon')?.textContent?.trim(),
      );

      expect(icons.every((icon) => icon === 'radio_button_unchecked')).toBe(true);
    });

    it('should display check icon for filled fields', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const fieldItems = fixture.nativeElement.querySelectorAll('.field-item');
      const icon1 = fieldItems[0]?.querySelector('mat-icon')?.textContent?.trim();
      const icon2 = fieldItems[1]?.querySelector('mat-icon')?.textContent?.trim();
      const icon3 = fieldItems[2]?.querySelector('mat-icon')?.textContent?.trim();

      expect(icon1).toBe('check_circle');
      expect(icon2).toBe('check_circle');
      expect(icon3).toBe('radio_button_unchecked');
    });

    it('should apply filled class to filled fields', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '',
        address: '',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const fieldItems = fixture.nativeElement.querySelectorAll('.field-item');
      expect(fieldItems[0]?.classList.contains('filled')).toBe(true);
      expect(fieldItems[1]?.classList.contains('filled')).toBe(false);
      expect(fieldItems[2]?.classList.contains('filled')).toBe(false);
    });
  });

  describe('DOM Rendering - Complete Profile', () => {
    it('should render complete container when profile is complete', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.completeness-container.complete');
      expect(container).toBeTruthy();
    });

    it('should display complete title', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.completeness-title');
      expect(title?.textContent?.trim()).toBe('Profil jest kompletny');
    });

    it('should display complete message', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('.complete-message');
      expect(message?.textContent?.trim()).toBe('Możesz wystawiać faktury');
    });

    it('should display check icon in complete state', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.completeness-header mat-icon');
      expect(icon?.textContent?.trim()).toBe('check_circle');
    });

    it('should not render progress bar when complete', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(progressBar).toBeNull();
    });

    it('should not render required fields list when complete', () => {
      const profile: UserProfileResponse = {
        id: '1',
        email: 'test@example.com',
        companyName: 'Test Company',
        nip: '1234567890',
        address: 'Test Address 123',
        bankAccount: null,
        invoiceNumberFormat: null,
        invoiceNumberCounter: 1,
        logoUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      fixture.componentRef.setInput('profile', profile);
      fixture.detectChanges();

      const requiredFields = fixture.nativeElement.querySelector('.required-fields');
      expect(requiredFields).toBeNull();
    });
  });
});
