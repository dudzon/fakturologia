import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * @ContainsPlaceholder() - Walidator sprawdzający obecność placeholdera w stringu
 *
 * Ten walidator jest używany do walidacji formatu numeracji faktur.
 * Format musi zawierać placeholder {NNN} który będzie zastąpiony
 * kolejnym numerem faktury.
 *
 * Przykładowe prawidłowe formaty:
 * - "FV/{YYYY}/{NNN}" → np. "FV/2025/001"
 * - "FV/{YYYY}/{MM}/{NNN}" → np. "FV/2025/01/001"
 * - "{NNN}/{YYYY}" → np. "001/2025"
 *
 * Użycie w DTO:
 * @ContainsPlaceholder('{NNN}', { message: 'Format musi zawierać {NNN}' })
 * invoiceNumberFormat: string;
 *
 * @param placeholder - wymagany placeholder (np. '{NNN}')
 * @param validationOptions - opcje walidacji class-validator
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
      // constraints - dodatkowe parametry przekazane do walidatora
      // Tutaj przekazujemy wymagany placeholder
      constraints: [placeholder],
      options: validationOptions,
      validator: {
        /**
         * Funkcja walidująca
         *
         * @param value - wartość do walidacji
         * @param args - argumenty walidacji, zawierają constraints
         * @returns true jeśli wartość zawiera wymagany placeholder
         */
        validate(value: unknown, args: ValidationArguments): boolean {
          // Pobierz wymagany placeholder z constraints
          const [requiredPlaceholder] = args.constraints as [string];

          // Sprawdź czy wartość jest stringiem i zawiera placeholder
          return (
            typeof value === 'string' && value.includes(requiredPlaceholder)
          );
        },

        /**
         * Domyślny komunikat błędu
         */
        defaultMessage(args: ValidationArguments): string {
          const [requiredPlaceholder] = args.constraints as [string];
          return `${args.property} must contain the ${requiredPlaceholder} placeholder`;
        },
      },
    });
  };
}
