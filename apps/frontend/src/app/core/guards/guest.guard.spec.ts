import { vi } from 'vitest';
import { Router } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../auth.service';

// Mock the dependencies by importing them first
let mockAuthService: any;
let mockRouter: any;

vi.mock('../auth.service', () => ({
  AuthService: vi.fn(),
}));

vi.mock('@angular/router', () => ({
  Router: vi.fn(),
}));

vi.mock('@angular/core', () => ({
  inject: vi.fn((token: any) => {
    if (token === AuthService || token.name === 'AuthService') {
      return mockAuthService;
    }
    if (token === Router || token.name === 'Router') {
      return mockRouter;
    }
    throw new Error(`Unexpected inject token: ${token}`);
  }),
}));

describe('guestGuard', () => {
  let authServiceMock: { getSession: any };
  let routerMock: { createUrlTree: any };

  beforeEach(() => {
    authServiceMock = {
      getSession: vi.fn(),
    };

    routerMock = {
      createUrlTree: vi.fn(),
    };

    // Assign to module-level variables
    mockAuthService = authServiceMock;
    mockRouter = routerMock;
  });

  it('should allow access when user is not authenticated', async () => {
    authServiceMock.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await guestGuard(null as any, null as any);

    expect(result).toBe(true);
    expect(authServiceMock.getSession).toHaveBeenCalled();
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to invoices when user is authenticated', async () => {
    const mockSession = { user: { id: '1' }, access_token: 'token' };
    authServiceMock.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const mockUrlTree = {};
    routerMock.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await guestGuard(null as any, null as any);

    expect(result).toBe(mockUrlTree);
    expect(authServiceMock.getSession).toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/invoices']);
  });

  it('should handle auth service errors gracefully', async () => {
    authServiceMock.getSession.mockRejectedValue(new Error('Auth error'));

    await expect(guestGuard(null as any, null as any)).rejects.toThrow('Auth error');
  });

  it('should handle null session data', async () => {
    authServiceMock.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await guestGuard(null as any, null as any);

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should handle session data without session property', async () => {
    authServiceMock.getSession.mockResolvedValue({
      data: {},
      error: null,
    });

    const result = await guestGuard(null as any, null as any);

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });
});
