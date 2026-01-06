import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Polish NIP (Tax Identification Number) validator.
 * Validates the format (10 digits) and checksum according to Polish tax regulations.
 */
export function nipValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Empty value is valid (use Validators.required for required fields)
    if (!value) {
      return null;
    }

    // Remove any whitespace and dashes
    const nip = value.replace(/[\s-]/g, '');

    // Must be exactly 10 digits
    if (!/^\d{10}$/.test(nip)) {
      return { nip: { message: 'NIP musi składać się z 10 cyfr' } };
    }

    // Polish NIP checksum validation
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(nip[i], 10) * weights[i];
    }

    const checkDigit = sum % 11;

    // Check digit cannot be 10 (invalid NIP)
    if (checkDigit === 10) {
      return { nip: { message: 'Nieprawidłowa suma kontrolna NIP' } };
    }

    if (checkDigit !== parseInt(nip[9], 10)) {
      return { nip: { message: 'Nieprawidłowa suma kontrolna NIP' } };
    }

    return null;
  };
}

/**
 * Normalizes NIP by removing whitespace and dashes.
 * Useful for storing clean NIP values in the database.
 */
export function normalizeNip(nip: string): string {
  return nip ? nip.replace(/[\s-]/g, '') : '';
}
