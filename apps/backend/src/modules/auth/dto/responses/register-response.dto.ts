import { ApiProperty } from '@nestjs/swagger';

/**
 * RegisterResponseDto - Response after successful registration
 *
 * Contains confirmation message and newly created user ID.
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success message with verification instructions',
    example:
      'Registration successful. Please check your email to verify your account.',
  })
  message: string;

  @ApiProperty({
    description: 'ID of the newly created user',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;
}
