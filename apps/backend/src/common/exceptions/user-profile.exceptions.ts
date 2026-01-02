import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Wyjątki domenowe dla modułu User Profile
 *
 * W NestJS wyjątki HTTP automatycznie zwracają odpowiedni status code.
 * Tworzymy własne klasy wyjątków dla lepszej czytelności kodu
 * i spójnych kodów błędów w API.
 *
 * Struktura odpowiedzi błędu:
 * {
 *   "statusCode": 400,
 *   "code": "INVALID_NIP",
 *   "message": "Invalid NIP format or checksum",
 *   "timestamp": "2025-01-02T10:00:00.000Z",
 *   "path": "/api/v1/users/profile"
 * }
 */

/**
 * ProfileNotFoundException - Profil użytkownika nie został znaleziony
 *
 * HTTP 404 Not Found
 * Rzucany gdy profil nie istnieje w tabeli user_profiles
 */
export class ProfileNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: 'PROFILE_NOT_FOUND',
      message: 'User profile not found',
    });
  }
}

/**
 * InvalidNipException - Nieprawidłowy format lub suma kontrolna NIP
 *
 * HTTP 400 Bad Request
 * Rzucany przez walidator IsPolishNIP
 */
export class InvalidNipException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_NIP',
      message: 'Invalid NIP format or checksum',
    });
  }
}

/**
 * InvalidIbanException - Nieprawidłowy format IBAN
 *
 * HTTP 400 Bad Request
 * Rzucany przez walidator IsValidIBAN
 */
export class InvalidIbanException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_IBAN',
      message: 'Invalid bank account format',
    });
  }
}

/**
 * InvalidNumberFormatException - Format numeracji nie zawiera {NNN}
 *
 * HTTP 400 Bad Request
 * Rzucany przez walidator ContainsPlaceholder
 */
export class InvalidNumberFormatException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_NUMBER_FORMAT',
      message: 'Invoice number format must contain {NNN} placeholder',
    });
  }
}

/**
 * LogoNotFoundException - Logo nie istnieje
 *
 * HTTP 404 Not Found
 * Rzucany przy próbie usunięcia logo, które nie istnieje
 */
export class LogoNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: 'LOGO_NOT_FOUND',
      message: 'No logo to delete',
    });
  }
}

/**
 * InvalidFileTypeException - Nieprawidłowy typ pliku
 *
 * HTTP 400 Bad Request
 * Rzucany gdy plik nie jest PNG ani JPG
 */
export class InvalidFileTypeException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_FILE_TYPE',
      message: 'Only PNG and JPG files are allowed',
    });
  }
}

/**
 * FileTooLargeException - Plik jest za duży
 *
 * HTTP 400 Bad Request
 * Rzucany gdy plik przekracza 2MB
 */
export class FileTooLargeException extends BadRequestException {
  constructor() {
    super({
      code: 'FILE_TOO_LARGE',
      message: 'File size must not exceed 2MB',
    });
  }
}
