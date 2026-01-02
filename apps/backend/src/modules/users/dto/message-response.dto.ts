import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * MessageResponseDto - DTO dla prostych odpowiedzi z komunikatem
 *
 * Używane dla operacji, które zwracają tylko komunikat sukcesu,
 * np. usunięcie logo (DELETE /profile/logo).
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Komunikat odpowiedzi',
    example: 'Operation completed successfully',
  })
  @Expose()
  message: string;
}
