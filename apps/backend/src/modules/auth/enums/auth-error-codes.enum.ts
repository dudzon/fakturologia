/**
 * AuthErrorCode - Error codes for authentication module
 *
 * These codes are used in error responses to help frontend
 * identify specific error types and display appropriate messages.
 */
export enum AuthErrorCode {
  /** Invalid email format */
  INVALID_EMAIL = 'INVALID_EMAIL',

  /** Password does not meet requirements (min 8 chars) */
  WEAK_PASSWORD = 'WEAK_PASSWORD',

  /** Email is already registered in the system */
  EMAIL_EXISTS = 'EMAIL_EXISTS',

  /** Wrong email or password combination */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  /** User has not verified their email address */
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  /** Account temporarily locked due to too many failed login attempts */
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',

  /** Provided refresh token is invalid or expired */
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',

  /** Password reset token is invalid or expired */
  INVALID_TOKEN = 'INVALID_TOKEN',
}
