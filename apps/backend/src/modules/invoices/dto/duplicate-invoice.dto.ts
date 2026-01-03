import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * DuplicateInvoiceDto - DTO for duplicating an invoice
 *
 * If invoiceNumber is not provided, the next available number will be used.
 */
export class DuplicateInvoiceDto {
  @ApiPropertyOptional({
    description:
      'Number for duplicated invoice (optional, if missing - next available will be used)',
    example: 'FV/2025/002',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Invoice number must be a string' })
  @MaxLength(50, { message: 'Invoice number cannot exceed 50 characters' })
  invoiceNumber?: string;
}
