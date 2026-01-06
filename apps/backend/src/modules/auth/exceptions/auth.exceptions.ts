import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthErrorCode } from '../enums/auth-error-codes.enum';

/**
 * Auth Exceptions - Domain-specific exceptions for authentication module
 *
 * These exceptions provide consistent error responses across all auth endpoints.
 * Each exception includes:
 * - HTTP status code (automatically from NestJS exception)
 * - Error code (for frontend identification)
 * - Human-readable message
 *
 * Error response structure:
 * {
 *   "statusCode": 400,
 *   "code": "INVALID_CREDENTIALS",
 *   "message": "Invalid email or password",
 *   "timestamp": "2026-01-02T10:00:00.000Z",
 *   "path": "/api/v1/auth/login"
 * }
 */

/**
 * InvalidCredentialsException - Wrong email or password
 *
 * HTTP 400 Bad Request
 * Thrown when login attempt fails due to wrong credentials
 */
export class InvalidCredentialsException extends BadRequestException {
  constructor() {
    super({
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid email or password',
    });
  }
}

/**
 * EmailExistsException - Email already registered
 *
 * HTTP 409 Conflict
 * Thrown when trying to register with an existing email
 */
export class EmailExistsException extends ConflictException {
  constructor() {
    super({
      code: AuthErrorCode.EMAIL_EXISTS,
      message: 'Email is already registered',
    });
  }
}

/**
 * EmailNotVerifiedException - Email not yet verified
 *
 * HTTP 403 Forbidden
 * Thrown when user tries to login without email verification
 */
export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super({
      code: AuthErrorCode.EMAIL_NOT_VERIFIED,
      message: 'Please verify your email before logging in',
    });
  }
}

/**
 * AccountLockedException - Account temporarily locked
 *
 * HTTP 403 Forbidden
 * Thrown when account is locked due to too many failed login attempts
 */
export class AccountLockedException extends ForbiddenException {
  constructor() {
    super({
      code: AuthErrorCode.ACCOUNT_LOCKED,
      message:
        'Account locked due to too many failed attempts. Try again in 15 minutes',
    });
  }
}

/**
 * InvalidRefreshTokenException - Invalid or expired refresh token
 *
 * HTTP 401 Unauthorized
 * Thrown when refresh token is invalid or has expired
 */
export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super({
      code: AuthErrorCode.INVALID_REFRESH_TOKEN,
      message: 'Invalid or expired refresh token',
    });
  }
}

/**
 * InvalidResetTokenException - Invalid or expired reset token
 *
 * HTTP 400 Bad Request
 * Thrown when password reset token is invalid or has expired
 */
export class InvalidResetTokenException extends BadRequestException {
  constructor() {
    super({
      code: AuthErrorCode.INVALID_TOKEN,
      message: 'Invalid or expired reset token',
    });
  }
}

/**
 * WeakPasswordException - Password does not meet requirements
 *
 * HTTP 400 Bad Request
 * Thrown when password is too weak (less than 8 characters)
 */
export class WeakPasswordException extends BadRequestException {
  constructor() {
    super({
      code: AuthErrorCode.WEAK_PASSWORD,
      message: 'Password must be at least 8 characters',
    });
  }
}
