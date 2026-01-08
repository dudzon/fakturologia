import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

/**
 * Auth Interceptor - automatically adds JWT token to HTTP requests
 *
 * This interceptor:
 * 1. Checks if user has an active session
 * 2. If yes, adds "Authorization: Bearer <token>" header to all HTTP requests
 * 3. Handles 401 errors by logging out user and redirecting to login
 *
 * Usage:
 * Automatically applied to all HttpClient requests via app.config.ts
 *
 * The interceptor works with:
 * - AuthService (provides session with access_token)
 * - Backend JwtAuthGuard (verifies the token)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const session = authService.currentSession();

  // If user has a session with access token, add it to the request
  if (session?.access_token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        // Sign out user and redirect to login
        authService.signOut().then(() => {
          router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: 'true' },
          });
        });
      }

      // Re-throw error for component-level handling
      return throwError(() => error);
    }),
  );
};
