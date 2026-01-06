import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * LoginDto - DTO for user login
 *
 * Validation:
 * - email: Valid email format, transformed to lowercase and trimmed
 * - password: Non-empty string
 *
 * Usage:
 * POST /api/v1/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
