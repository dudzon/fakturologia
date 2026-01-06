import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * ForgotPasswordDto - DTO for requesting password reset
 *
 * Validation:
 * - email: Valid email format, transformed to lowercase and trimmed
 *
 * Note: The endpoint always returns 200 OK to prevent email enumeration attacks.
 *
 * Usage:
 * POST /api/v1/auth/forgot-password
 * {
 *   "email": "user@example.com"
 * }
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;
}
