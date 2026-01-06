import { vi } from 'vitest';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { profileCompleteGuard } from './profile-complete.guard';
import { UserService } from '../../services/user.service';
import type { UserProfileResponse } from '../../../types';

// Mock the dependencies
let mockUserService: any;
let mockRouter: any;
let mockSnackBar: any;

vi.mock('../../services/user.service', () => ({
  UserService: vi.fn()
}));

vi.mock('@angular/router', () => ({
  Router: vi.fn()
}));

vi.mock('@angular/material/snack-bar', () => ({
  MatSnackBar: vi.fn()
}));

vi.mock('@angular/core', () => ({
  inject: vi.fn((token: any) => {
    if (token === UserService || token.name === 'UserService') {
      return mockUserService;
    }
    if (token === Router || token.name === 'Router') {
      return mockRouter;
    }
    if (token === MatSnackBar || token.name === 'MatSnackBar') {
      return mockSnackBar;
    }
    throw new Error(`Unexpected inject token: ${token}`);
  }),
  Injectable: vi.fn(),
  signal: vi.fn((val: any) => () => val)
}));

vi.mock('rxjs', async () => {
  const actual = await vi.importActual('rxjs');
  return actual;
});

describe('profileCompleteGuard', () => {
  let userServiceMock: { getProfile: any };
  let routerMock: { navigate: any };
  let snackBarMock: { open: any };

  const completeProfile: UserProfileResponse = {
    id: '1',
    email: 'test@example.com',
    companyName: 'Test Company',
    nip: '1234567890',
    address: 'Test Address 123',
    bankAccount: 'PL12345678901234567890123456',
    logoUrl: null,
    invoiceNumberFormat: 'FV/{YYYY}/{MM}/{NNN}',
    invoiceNumberCounter: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  };

  const incompleteProfile: UserProfileResponse = {
    id: '1',
    email: 'test@example.com',
    companyName: '',
    nip: '',
    address: '',
    bankAccount: '',
    logoUrl: null,
    invoiceNumberFormat: 'FV/{YYYY}/{MM}/{NNN}',
    invoiceNumberCounter: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    userServiceMock = {
      getProfile: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    snackBarMock = {
      open: vi.fn()
    };

    // Assign to module-level variables
    mockUserService = userServiceMock;
    mockRouter = routerMock;
    mockSnackBar = snackBarMock;
  });

  it('should allow access when profile is complete', async () => {
    userServiceMock.getProfile.mockReturnValue(of(completeProfile));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(true);
    expect(userServiceMock.getProfile).toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(snackBarMock.open).not.toHaveBeenCalled();
  });

  it('should deny access and redirect when profile is incomplete', async () => {
    userServiceMock.getProfile.mockReturnValue(of(incompleteProfile));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(userServiceMock.getProfile).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Uzupełnij dane firmy przed wystawieniem faktury',
      'Zamknij',
      {
        duration: 5000,
        panelClass: ['snackbar-warning']
      }
    );
  });

  it('should deny access when companyName is missing', async () => {
    const profile = { ...completeProfile, companyName: '' };
    userServiceMock.getProfile.mockReturnValue(of(profile));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should deny access when nip is missing', async () => {
    const profile = { ...completeProfile, nip: '' };
    userServiceMock.getProfile.mockReturnValue(of(profile));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should deny access when address is missing', async () => {
    const profile = { ...completeProfile, address: '' };
    userServiceMock.getProfile.mockReturnValue(of(profile));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should deny access when bankAccount is missing', async () => {
    const profile = { ...completeProfile, bankAccount: '' };
    userServiceMock.getProfile.mockReturnValue(of(profile));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should handle API errors and redirect to profile', async () => {
    userServiceMock.getProfile.mockReturnValue(throwError(new Error('API Error')));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Uzupełnij dane firmy przed wystawieniem faktury',
      'Zamknij',
      {
        duration: 5000,
        panelClass: ['snackbar-warning']
      }
    );
  });

  it('should handle null profile response', async () => {
    userServiceMock.getProfile.mockReturnValue(of(null as any));

    const result = await profileCompleteGuard(null as any, null as any);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });
});
