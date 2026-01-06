import { ApiProperty } from '@nestjs/swagger';

/**
 * MessageResponseDto - Generic message response
 *
 * Used for logout, forgot-password, and reset-password endpoints.
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;
}
