import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * @IsPolishNIP() - Polish NIP number validator
 *
 * NIP (Tax Identification Number) is a 10-digit number
 * with a checksum calculated using a weight algorithm.
 *
 * Validation algorithm:
 * 1. NIP must consist of exactly 10 digits
 * 2. Each of the first 9 digits is multiplied by the appropriate weight
 * 3. Sum of products mod 11 must equal the 10th digit (check digit)
 *
 * Weights: [6, 5, 7, 2, 3, 4, 5, 6, 7]
 *
 * Example: NIP 1234567890
 * - Sum: 1*6 + 2*5 + 3*7 + 4*2 + 5*3 + 6*4 + 7*5 + 8*6 + 9*7 = 184
 * - 184 mod 11 = 8 (must equal last digit - here 0, so invalid NIP)
 *
 * Usage in DTO:
 * @IsPolishNIP({ message: 'Invalid NIP' })
 * nip: string;
 */
export function IsPolishNIP(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPolishNIP',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        /**
         * Main validation function
         *
         * @param value - value to validate
         * @returns true if NIP is valid, false otherwise
         */
        validate(value: unknown): boolean {
          // Check if value is a string and has 10 digits
          if (typeof value !== 'string' || !/^\d{10}$/.test(value)) {
            return false;
          }

          // Weights used in NIP algorithm
          const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

          // Convert string to array of digits
          const digits = value.split('').map(Number);

          // Calculate checksum
          // reduce() sums products of digits and weights
          const checksum = weights.reduce(
            (sum, weight, index) => sum + weight * digits[index],
            0,
          );

          // Last digit must equal checksum mod 11
          // If mod 11 = 10, NIP is invalid (digit 10 doesn't exist)
          const remainder = checksum % 11;

          // If remainder = 10, NIP is invalid
          if (remainder === 10) {
            return false;
          }

          return remainder === digits[9];
        },

        /**
         * Default error message
         */
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid Polish NIP number`;
        },
      },
    });
  };
}
