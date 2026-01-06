import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * RefreshTokenDto - DTO for refreshing access token
 *
 * Validation:
 * - refreshToken: Non-empty string
 *
 * Usage:
 * POST /api/v1/auth/refresh
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
 * }
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtained from login',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
