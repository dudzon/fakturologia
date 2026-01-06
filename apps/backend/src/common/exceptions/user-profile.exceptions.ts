import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Domain exceptions for the User Profile module
 *
 * In NestJS, HTTP exceptions automatically return the appropriate status code.
 * We create custom exception classes for better code readability
 * and consistent error codes in the API.
 *
 * Error response structure:
 * {
 *   "statusCode": 400,
 *   "code": "INVALID_NIP",
 *   "message": "Invalid NIP format or checksum",
 *   "timestamp": "2025-01-02T10:00:00.000Z",
 *   "path": "/api/v1/users/profile"
 * }
 */

/**
 * ProfileNotFoundException - User profile not found
 *
 * HTTP 404 Not Found
 * Thrown when profile does not exist in user_profiles table
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
 * InvalidNipException - Invalid NIP format or checksum
 *
 * HTTP 400 Bad Request
 * Thrown by the IsPolishNIP validator
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
 * InvalidIbanException - Invalid IBAN format
 *
 * HTTP 400 Bad Request
 * Thrown by the IsValidIBAN validator
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
 * InvalidNumberFormatException - Format does not contain {NNN}
 *
 * HTTP 400 Bad Request
 * Thrown by the ContainsPlaceholder validator
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
 * LogoNotFoundException - Logo does not exist
 *
 * HTTP 404 Not Found
 * Thrown when trying to delete a logo that does not exist
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
 * InvalidFileTypeException - Invalid file type
 *
 * HTTP 400 Bad Request
 * Thrown when file is not PNG or JPG
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
 * FileTooLargeException - File is too large
 *
 * HTTP 400 Bad Request
 * Thrown when file exceeds 2MB
 */
export class FileTooLargeException extends BadRequestException {
  constructor() {
    super({
      code: 'FILE_TOO_LARGE',
      message: 'File size must not exceed 2MB',
    });
  }
}
