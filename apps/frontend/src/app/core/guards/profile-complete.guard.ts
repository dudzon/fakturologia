import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../services/user.service';

/**
 * Guard that checks if user profile is complete before allowing access.
 *
 * Required fields for invoice creation:
 * - companyName
 * - nip
 * - address
 * - bankAccount
 *
 * If profile is incomplete, redirects to /profile with a message.
 */
export const profileCompleteGuard: CanActivateFn = async () => {
  const userService = inject(UserService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  try {
    const profile = await firstValueFrom(userService.getProfile());

    // Check if all required fields for invoice creation are filled
    const isComplete =
      !!profile.companyName && !!profile.nip && !!profile.address && !!profile.bankAccount;

    if (!isComplete) {
      snackBar.open('Uzupełnij dane firmy przed wystawieniem faktury', 'Zamknij', {
        duration: 5000,
        panelClass: ['snackbar-warning'],
      });
      router.navigate(['/profile']);
      return false;
    }

    return true;
  } catch (error) {
    // If profile doesn't exist or error occurred, redirect to profile
    snackBar.open('Uzupełnij dane firmy przed wystawieniem faktury', 'Zamknij', {
      duration: 5000,
      panelClass: ['snackbar-warning'],
    });
    router.navigate(['/profile']);
    return false;
  }
};
