import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * MessageResponseDto - DTO for simple responses with message
 *
 * Used for operations that return only a success message,
 * e.g., logo deletion (DELETE /profile/logo).
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  @Expose()
  message: string;
}
