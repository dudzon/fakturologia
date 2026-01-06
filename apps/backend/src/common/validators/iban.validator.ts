import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * @IsValidIBAN() - International Bank Account Number (IBAN) validator
 *
 * IBAN (International Bank Account Number) is a standard format
 * for bank account numbers used in Europe and many other countries.
 *
 * IBAN format:
 * - 2 letters (country code, e.g., PL for Poland)
 * - 2 digits (check digit)
 * - Up to 30 alphanumeric characters (account number)
 *
 * Validation algorithm (MOD 97-10):
 * 1. Move first 4 characters to the end
 * 2. Replace letters with numbers (A=10, B=11, ..., Z=35)
 * 3. Calculate remainder of division by 97
 * 4. Remainder must equal 1
 *
 * Example: PL61 1090 1014 0000 0712 1981 2874
 * 1. Move: 10901014000007121981287461 (where PL = 2521)
 * 2. Calculate: 10901014000007121981287425 21 61 mod 97 = 1 ✓
 *
 * Usage in DTO:
 * @IsValidIBAN({ message: 'Invalid IBAN format' })
 * bankAccount: string;
 */
export function IsValidIBAN(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidIBAN',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        /**
         * Main IBAN validation function
         *
         * @param value - value to validate
         * @returns true if IBAN is valid
         */
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          // Remove spaces and convert to uppercase
          const iban = value.replace(/\s/g, '').toUpperCase();

          // Check basic format:
          // - 2 letters (country code)
          // - 2 digits (check digit)
          // - 1-30 alphanumeric characters
          if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(iban)) {
            return false;
          }

          // Validate length for popular countries
          const countryLengths: Record<string, number> = {
            PL: 28, // Poland
            DE: 22, // Germany
            FR: 27, // France
            GB: 22, // United Kingdom
            ES: 24, // Spain
            IT: 27, // Italy
            NL: 18, // Netherlands
            BE: 16, // Belgium
            AT: 20, // Austria
            CH: 21, // Switzerland
          };

          const countryCode = iban.slice(0, 2);
          const expectedLength = countryLengths[countryCode];

          // If we know the length for the given country, check it
          if (expectedLength && iban.length !== expectedLength) {
            return false;
          }

          // MOD 97-10 algorithm:

          // 1. Move first 4 characters to the end
          const rearranged = iban.slice(4) + iban.slice(0, 4);

          // 2. Replace letters with numbers (A=10, B=11, ..., Z=35)
          const numericString = rearranged.replace(/[A-Z]/g, (char) =>
            (char.charCodeAt(0) - 55).toString(),
          );

          // 3. Calculate mod 97
          // For very long numbers we must calculate mod 97 iteratively
          // (JavaScript doesn't handle such large numbers accurately)
          let remainder = numericString;
          while (remainder.length > 2) {
            // Take maximum 9 digits (safe for parseInt)
            const block = remainder.slice(0, 9);
            const blockRemainder = parseInt(block, 10) % 97;
            remainder =
              blockRemainder.toString() + remainder.slice(block.length);
          }

          // 4. Final remainder must equal 1
          return parseInt(remainder, 10) % 97 === 1;
        },

        /**
         * Default error message
         */
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid IBAN`;
        },
      },
    });
  };
}
