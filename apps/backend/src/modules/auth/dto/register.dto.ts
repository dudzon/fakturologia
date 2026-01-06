import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * RegisterDto - DTO for user registration
 *
 * Validation:
 * - email: Valid email format, transformed to lowercase and trimmed
 * - password: Minimum 8 characters
 *
 * Usage:
 * POST /api/v1/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User password - minimum 8 characters',
    example: 'securePassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
