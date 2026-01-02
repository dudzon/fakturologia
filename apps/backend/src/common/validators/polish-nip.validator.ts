import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * @IsPolishNIP() - Walidator polskiego numeru NIP
 *
 * NIP (Numer Identyfikacji Podatkowej) to 10-cyfrowy numer
 * z sumą kontrolną obliczaną według algorytmu wagowego.
 *
 * Algorytm walidacji:
 * 1. NIP musi składać się dokładnie z 10 cyfr
 * 2. Każda z pierwszych 9 cyfr jest mnożona przez odpowiednią wagę
 * 3. Suma iloczynów mod 11 musi być równa 10. cyfrze (cyfra kontrolna)
 *
 * Wagi: [6, 5, 7, 2, 3, 4, 5, 6, 7]
 *
 * Przykład: NIP 1234567890
 * - Suma: 1*6 + 2*5 + 3*7 + 4*2 + 5*3 + 6*4 + 7*5 + 8*6 + 9*7 = 184
 * - 184 mod 11 = 8 (musi być równe ostatniej cyfrze - tutaj 0, więc błędny NIP)
 *
 * Użycie w DTO:
 * @IsPolishNIP({ message: 'Nieprawidłowy NIP' })
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
         * Główna funkcja walidująca
         *
         * @param value - wartość do walidacji
         * @returns true jeśli NIP jest prawidłowy, false w przeciwnym razie
         */
        validate(value: unknown): boolean {
          // Sprawdź czy wartość jest stringiem i ma 10 cyfr
          if (typeof value !== 'string' || !/^\d{10}$/.test(value)) {
            return false;
          }

          // Wagi używane w algorytmie NIP
          const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

          // Konwertuj string na tablicę cyfr
          const digits = value.split('').map(Number);

          // Oblicz sumę kontrolną
          // reduce() sumuje iloczyny cyfr i wag
          const checksum = weights.reduce(
            (sum, weight, index) => sum + weight * digits[index],
            0,
          );

          // Ostatnia cyfra musi być równa sumie kontrolnej mod 11
          // Jeśli mod 11 = 10, NIP jest nieprawidłowy (nie istnieje cyfra 10)
          const remainder = checksum % 11;

          // Jeśli reszta = 10, NIP jest nieprawidłowy
          if (remainder === 10) {
            return false;
          }

          return remainder === digits[9];
        },

        /**
         * Domyślny komunikat błędu
         */
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid Polish NIP number`;
        },
      },
    });
  };
}
