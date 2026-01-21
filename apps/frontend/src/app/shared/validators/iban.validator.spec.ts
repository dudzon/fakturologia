import { ibanValidator } from './iban.validator';

// Create a mock FormControl-like object
const createControl = (value: any) => ({ value }) as any;

describe('ibanValidator', () => {
  it('should return null for empty value', () => {
    const control = createControl('');
    const result = ibanValidator()(control);
    expect(result).toBeNull();
  });

  it('should return null for null value', () => {
    const control = createControl(null);
    const result = ibanValidator()(control);
    expect(result).toBeNull();
  });

  it('should return error for IBAN too short', () => {
    const control = createControl('PL123');
    const result = ibanValidator()(control);
    expect(result).toEqual({ iban: { message: 'Polski IBAN powinien mieć 28 znaków' } });
  });

  it('should return error for IBAN with invalid characters', () => {
    const control = createControl('PL12 3456 7890 1234 5678 9012 34@');
    const result = ibanValidator()(control);
    expect(result).toEqual({ iban: { message: 'Nieprawidłowy format IBAN' } });
  });

  it('should return error for IBAN too long', () => {
    const control = createControl('PL' + '1'.repeat(33));
    const result = ibanValidator()(control);
    expect(result).toEqual({ iban: { message: 'Nieprawidłowy format IBAN' } });
  });

  it('should return error for Polish IBAN with wrong length', () => {
    const control = createControl('PL123456789012345678901234'); // 26 characters (PL + 24 digits)
    const result = ibanValidator()(control);
    expect(result).toEqual({ iban: { message: 'Polski IBAN powinien mieć 28 znaków' } });
  });

  it('should return error for invalid checksum', () => {
    const control = createControl('PL00123456789012345678901234'); // Invalid checksum
    const result = ibanValidator()(control);
    expect(result).toEqual({ iban: { message: 'Nieprawidłowa suma kontrolna IBAN' } });
  });

  it('should return null for valid Polish IBAN', () => {
    const control = createControl('PL61109010140000071219812874'); // Valid Polish IBAN
    const result = ibanValidator()(control);
    expect(result).toBeNull();
  });

  it('should handle IBAN with spaces', () => {
    const control = createControl('PL 61 1090 1014 0000 0712 1981 2874');
    const result = ibanValidator()(control);
    expect(result).toBeNull();
  });

  it('should handle IBAN with lowercase letters', () => {
    const control = createControl('pl61109010140000071219812874');
    const result = ibanValidator()(control);
    expect(result).toBeNull();
  });

  it('should return null for valid German IBAN', () => {
    const control = createControl('DE89370400440532013000'); // Valid German IBAN
    const result = ibanValidator()(control);
    expect(result).toBeNull();
  });
});
