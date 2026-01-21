import {
  invoiceNumberFormatValidator,
  generateInvoiceNumberPreview,
} from './invoice-number-format.validator';

// Create a mock FormControl-like object
const createControl = (value: any) => ({ value }) as any;

describe('invoiceNumberFormatValidator', () => {
  it('should return null for empty value', () => {
    const control = createControl('');
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toBeNull();
  });

  it('should return null for null value', () => {
    const control = createControl(null);
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toBeNull();
  });

  it('should return error when {NNN} placeholder is missing', () => {
    const control = createControl('FV/{YYYY}/{MM}');
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toEqual({
      invoiceNumberFormat: {
        message: 'Format numeru faktury musi zawierać placeholder {NNN}',
      },
    });
  });

  it('should return null for valid format with {NNN}', () => {
    const control = createControl('FV/{YYYY}/{MM}/{NNN}');
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toBeNull();
  });

  it('should return error for unknown placeholder', () => {
    const control = createControl('FV/{YYYY}/{INVALID}/{NNN}');
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toEqual({
      invoiceNumberFormat: {
        message: 'Nieznany placeholder: {INVALID}. Dozwolone: {NNN}, {YYYY}, {YY}, {MM}, {DD}',
      },
    });
  });

  it('should accept all valid placeholders', () => {
    const control = createControl('FV/{YYYY}/{YY}/{MM}/{DD}/{NNN}');
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toBeNull();
  });

  it('should handle multiple unknown placeholders', () => {
    const control = createControl('FV/{UNKNOWN1}/{UNKNOWN2}/{NNN}');
    const result = invoiceNumberFormatValidator()(control);
    expect(result).toEqual({
      invoiceNumberFormat: {
        message: 'Nieznany placeholder: {UNKNOWN1}. Dozwolone: {NNN}, {YYYY}, {YY}, {MM}, {DD}',
      },
    });
  });
});

describe('generateInvoiceNumberPreview', () => {
  it('should generate preview with default counter', () => {
    const format = 'FV/{YYYY}/{MM}/{NNN}';
    const result = generateInvoiceNumberPreview(format);
    expect(result).toBe('FV/2026/01/001');
  });

  it('should generate preview with custom counter', () => {
    const format = 'FV/{YYYY}/{MM}/{NNN}';
    const result = generateInvoiceNumberPreview(format, 42);
    expect(result).toBe('FV/2026/01/042');
  });

  it('should handle all placeholders', () => {
    const format = 'INV/{YYYY}/{YY}/{MM}/{DD}/{NNN}';
    const result = generateInvoiceNumberPreview(format, 123);

    const now = new Date();
    const year = now.getFullYear();
    const shortYear = String(year).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    expect(result).toBe(`INV/${year}/${shortYear}/${month}/${day}/123`);
  });

  it('should pad counter with zeros', () => {
    const format = 'FV/{NNN}';
    const result = generateInvoiceNumberPreview(format, 5);
    expect(result).toBe('FV/005');
  });

  it('should handle format without placeholders', () => {
    const format = 'CONSTANT';
    const result = generateInvoiceNumberPreview(format);
    expect(result).toBe('CONSTANT');
  });
});
