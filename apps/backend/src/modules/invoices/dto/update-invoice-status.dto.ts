import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatus } from './invoice-list-query.dto';

/**
 * UpdateInvoiceStatusDto - DTO for changing invoice status
 */
export class UpdateInvoiceStatusDto {
  @ApiProperty({
    description: 'New invoice status',
    enum: InvoiceStatus,
    example: 'paid',
  })
  @IsEnum(InvoiceStatus, {
    message: 'Status must be one of: draft, unpaid, paid',
  })
  status: InvoiceStatus;
}
