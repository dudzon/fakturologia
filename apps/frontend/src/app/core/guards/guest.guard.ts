import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Guard for public/guest pages (login, register, forgot-password, reset-password).
 * Redirects authenticated users to /invoices.
 */
export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const { data } = await authService.getSession();

  if (data.session) {
    // User is already authenticated, redirect to invoices
    return router.createUrlTree(['/invoices']);
  }

  // User is not authenticated, allow access to guest pages
  return true;
};
