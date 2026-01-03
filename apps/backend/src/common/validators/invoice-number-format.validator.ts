import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * @ContainsPlaceholder() - Validator checking for placeholder presence in string
 *
 * This validator is used to validate invoice number format.
 * The format must contain placeholder {NNN} which will be replaced
 * with the next invoice number.
 *
 * Example valid formats:
 * - "FV/{YYYY}/{NNN}" → e.g., "FV/2025/001"
 * - "FV/{YYYY}/{MM}/{NNN}" → e.g., "FV/2025/01/001"
 * - "{NNN}/{YYYY}" → e.g., "001/2025"
 *
 * Usage in DTO:
 * @ContainsPlaceholder('{NNN}', { message: 'Format must contain {NNN}' })
 * invoiceNumberFormat: string;
 *
 * @param placeholder - required placeholder (e.g., '{NNN}')
 * @param validationOptions - class-validator validation options
 */
export function ContainsPlaceholder(
  placeholder: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'containsPlaceholder',
      target: object.constructor,
      propertyName: propertyName,
      // constraints - additional parameters passed to validator
      // Here we pass the required placeholder
      constraints: [placeholder],
      options: validationOptions,
      validator: {
        /**
         * Validation function
         *
         * @param value - value to validate
         * @param args - validation arguments, contains constraints
         * @returns true if value contains required placeholder
         */
        validate(value: unknown, args: ValidationArguments): boolean {
          // Get required placeholder from constraints
          const [requiredPlaceholder] = args.constraints as [string];

          // Check if value is a string and contains placeholder
          return (
            typeof value === 'string' && value.includes(requiredPlaceholder)
          );
        },

        /**
         * Default error message
         */
        defaultMessage(args: ValidationArguments): string {
          const [requiredPlaceholder] = args.constraints as [string];
          return `${args.property} must contain the ${requiredPlaceholder} placeholder`;
        },
      },
    });
  };
}
