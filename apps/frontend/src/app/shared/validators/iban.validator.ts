import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * IBAN (International Bank Account Number) validator.
 * Validates the format and checksum according to ISO 13616.
 */
export function ibanValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Empty value is valid (use Validators.required for required fields)
    if (!value) {
      return null;
    }

    // Remove any whitespace
    const iban = value.replace(/\s/g, '').toUpperCase();

    // Basic format check: 2 letters + 2 digits + up to 30 alphanumeric chars
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(iban)) {
      return { iban: { message: 'Nieprawidłowy format IBAN' } };
    }

    // Length check (max 34 characters)
    if (iban.length > 34) {
      return { iban: { message: 'IBAN jest zbyt długi (maksymalnie 34 znaki)' } };
    }

    // Polish IBAN should be 28 characters (PL + 26 digits)
    if (iban.startsWith('PL') && iban.length !== 28) {
      return { iban: { message: 'Polski IBAN powinien mieć 28 znaków' } };
    }

    // IBAN checksum validation (MOD 97-10)
    // Move first 4 characters to the end
    const rearranged = iban.slice(4) + iban.slice(0, 4);

    // Convert letters to numbers (A=10, B=11, ..., Z=35)
    let numericIban = '';
    for (const char of rearranged) {
      if (/[A-Z]/.test(char)) {
        numericIban += (char.charCodeAt(0) - 55).toString();
      } else {
        numericIban += char;
      }
    }

    // Calculate MOD 97 using string-based division (to handle large numbers)
    let remainder = 0;
    for (const digit of numericIban) {
      remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
    }

    if (remainder !== 1) {
      return { iban: { message: 'Nieprawidłowa suma kontrolna IBAN' } };
    }

    return null;
  };
}

/**
 * Formats IBAN with spaces every 4 characters for better readability.
 */
export function formatIban(iban: string): string {
  if (!iban) return '';
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Normalizes IBAN by removing whitespace and converting to uppercase.
 */
export function normalizeIban(iban: string): string {
  return iban ? iban.replace(/\s/g, '').toUpperCase() : '';
}
