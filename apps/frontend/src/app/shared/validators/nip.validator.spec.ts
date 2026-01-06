/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';

// Mock Angular forms without importing
class MockFormControl {
  constructor(public value: any) {}
}

const nipValidator = (control: MockFormControl): any => {
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

describe('nipValidator', () => {
  it('should return null for empty value', () => {
    const control = new MockFormControl('');
    const result = nipValidator(control);
    expect(result).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new MockFormControl(null);
    const result = nipValidator(control);
    expect(result).toBeNull();
  });

  it('should return error for NIP shorter than 10 digits', () => {
    const control = new MockFormControl('123456789');
    const result = nipValidator(control);
    expect(result).toEqual({ nip: { message: 'NIP musi składać się z 10 cyfr' } });
  });

  it('should return error for NIP longer than 10 digits', () => {
    const control = new MockFormControl('12345678901');
    const result = nipValidator(control);
    expect(result).toEqual({ nip: { message: 'NIP musi składać się z 10 cyfr' } });
  });

  it('should return error for NIP with non-digit characters', () => {
    const control = new MockFormControl('123456789a');
    const result = nipValidator(control);
    expect(result).toEqual({ nip: { message: 'NIP musi składać się z 10 cyfr' } });
  });

  it('should return error for invalid checksum', () => {
    const control = new MockFormControl('1234567890'); // Invalid checksum
    const result = nipValidator(control);
    expect(result).toEqual({ nip: { message: 'Nieprawidłowa suma kontrolna NIP' } });
  });

  it('should return error when check digit is 10', () => {
    const control = new MockFormControl('1234567895'); // This would make check digit 10
    const result = nipValidator(control);
    expect(result).toEqual({ nip: { message: 'Nieprawidłowa suma kontrolna NIP' } });
  });

  it('should return null for valid NIP', () => {
    const control = new MockFormControl('1111111111'); // Valid NIP for testing
    const result = nipValidator(control);
    expect(result).toBeNull();
  });

  it('should handle NIP with spaces and dashes', () => {
    const control = new MockFormControl('111-111 11 11');
    const result = nipValidator(control);
    expect(result).toBeNull();
  });

  it('should return error for NIP with spaces but invalid checksum', () => {
    const control = new MockFormControl('123 456 78 90');
    const result = nipValidator(control);
    expect(result).toEqual({ nip: { message: 'Nieprawidłowa suma kontrolna NIP' } });
  });
});
