import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Invoice number format validator.
 * Validates that the format contains the required {NNN} placeholder.
 */
export function invoiceNumberFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Empty value is valid (use Validators.required for required fields)
    if (!value) {
      return null;
    }

    // Must contain {NNN} placeholder for the sequential number
    if (!value.includes('{NNN}')) {
      return {
        invoiceNumberFormat: {
          message: 'Format numeru faktury musi zawierać placeholder {NNN}',
        },
      };
    }

    // Optional: validate that only allowed placeholders are used
    const allowedPlaceholders = ['{NNN}', '{YYYY}', '{YY}', '{MM}', '{DD}'];
    const placeholderPattern = /\{[^}]+\}/g;
    const foundPlaceholders = value.match(placeholderPattern) || [];

    for (const placeholder of foundPlaceholders) {
      if (!allowedPlaceholders.includes(placeholder)) {
        return {
          invoiceNumberFormat: {
            message: `Nieznany placeholder: ${placeholder}. Dozwolone: ${allowedPlaceholders.join(', ')}`,
          },
        };
      }
    }

    return null;
  };
}

/**
 * Generates a preview of the invoice number based on the format.
 * @param format The format string with placeholders
 * @param counter The current invoice counter
 * @returns The formatted invoice number preview
 */
export function generateInvoiceNumberPreview(format: string, counter: number = 1): string {
  if (!format) {
    return '';
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const sequentialNumber = counter.toString().padStart(3, '0');

  return format
    .replace('{YYYY}', year.toString())
    .replace('{YY}', year.toString().slice(-2))
    .replace('{MM}', month)
    .replace('{DD}', day)
    .replace('{NNN}', sequentialNumber);
}
