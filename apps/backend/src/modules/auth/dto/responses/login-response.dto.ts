import { ApiProperty } from '@nestjs/swagger';

/**
 * UserBasicDto - Basic user information returned after login
 */
export class UserBasicDto {
  @ApiProperty({
    description: 'User unique identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;
}

/**
 * LoginResponseDto - Response after successful login
 *
 * Contains JWT tokens for authentication and basic user info.
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authorization',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Basic user information',
    type: UserBasicDto,
  })
  user: UserBasicDto;
}
