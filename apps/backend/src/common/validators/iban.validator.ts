import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * @IsValidIBAN() - Walidator międzynarodowego numeru konta bankowego (IBAN)
 *
 * IBAN (International Bank Account Number) to standardowy format
 * numeru konta bankowego używany w Europie i wielu innych krajach.
 *
 * Format IBAN:
 * - 2 litery (kod kraju, np. PL dla Polski)
 * - 2 cyfry (cyfra kontrolna)
 * - Do 30 znaków alfanumerycznych (numer konta)
 *
 * Algorytm walidacji (MOD 97-10):
 * 1. Przenieś pierwsze 4 znaki na koniec
 * 2. Zamień litery na liczby (A=10, B=11, ..., Z=35)
 * 3. Oblicz resztę z dzielenia przez 97
 * 4. Reszta musi wynosić 1
 *
 * Przykład: PL61 1090 1014 0000 0712 1981 2874
 * 1. Przenieś: 10901014000007121981287461 (gdzie PL = 2521)
 * 2. Oblicz: 10901014000007121981287425 21 61 mod 97 = 1 ✓
 *
 * Użycie w DTO:
 * @IsValidIBAN({ message: 'Nieprawidłowy format IBAN' })
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
         * Główna funkcja walidująca IBAN
         *
         * @param value - wartość do walidacji
         * @returns true jeśli IBAN jest prawidłowy
         */
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          // Usuń spacje i przekonwertuj na wielkie litery
          const iban = value.replace(/\s/g, '').toUpperCase();

          // Sprawdź podstawowy format:
          // - 2 litery (kod kraju)
          // - 2 cyfry (cyfra kontrolna)
          // - 1-30 znaków alfanumerycznych
          if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(iban)) {
            return false;
          }

          // Walidacja długości dla popularnych krajów
          const countryLengths: Record<string, number> = {
            PL: 28, // Polska
            DE: 22, // Niemcy
            FR: 27, // Francja
            GB: 22, // Wielka Brytania
            ES: 24, // Hiszpania
            IT: 27, // Włochy
            NL: 18, // Holandia
            BE: 16, // Belgia
            AT: 20, // Austria
            CH: 21, // Szwajcaria
          };

          const countryCode = iban.slice(0, 2);
          const expectedLength = countryLengths[countryCode];

          // Jeśli znamy długość dla danego kraju, sprawdź ją
          if (expectedLength && iban.length !== expectedLength) {
            return false;
          }

          // Algorytm MOD 97-10:

          // 1. Przenieś pierwsze 4 znaki na koniec
          const rearranged = iban.slice(4) + iban.slice(0, 4);

          // 2. Zamień litery na liczby (A=10, B=11, ..., Z=35)
          const numericString = rearranged.replace(/[A-Z]/g, (char) =>
            (char.charCodeAt(0) - 55).toString(),
          );

          // 3. Oblicz mod 97
          // Dla bardzo długich liczb musimy liczyć mod 97 iteracyjnie
          // (JavaScript nie obsługuje dokładnie tak dużych liczb)
          let remainder = numericString;
          while (remainder.length > 2) {
            // Bierzemy maksymalnie 9 cyfr (bezpieczne dla parseInt)
            const block = remainder.slice(0, 9);
            const blockRemainder = parseInt(block, 10) % 97;
            remainder =
              blockRemainder.toString() + remainder.slice(block.length);
          }

          // 4. Końcowa reszta musi wynosić 1
          return parseInt(remainder, 10) % 97 === 1;
        },

        /**
         * Domyślny komunikat błędu
         */
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid IBAN`;
        },
      },
    });
  };
}
