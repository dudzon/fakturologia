import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * ResetPasswordDto - DTO for executing password reset
 *
 * Validation:
 * - token: Non-empty string (token from email link)
 * - password: Minimum 8 characters
 *
 * Usage:
 * POST /api/v1/auth/reset-password
 * {
 *   "token": "reset-token-from-email",
 *   "password": "newSecurePassword123"
 * }
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'reset-token-from-email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    description: 'New password - minimum 8 characters',
    example: 'newSecurePassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
