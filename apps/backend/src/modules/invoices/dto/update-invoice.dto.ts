import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from './invoice-list-query.dto';
import {
  BuyerInfoRequestDto,
  InvoiceItemRequestDto,
  PaymentMethod,
} from './create-invoice.dto';

/**
 * UpdateInvoiceDto - DTO for updating an invoice
 *
 * All fields are optional.
 * Invoice items (items) - if provided, items without ID are created,
 * existing items not present in the list are deleted.
 */
export class UpdateInvoiceDto {
  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'FV/2025/001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Invoice number must be a string' })
  @MaxLength(50, { message: 'Invoice number cannot exceed 50 characters' })
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Issue date (format: YYYY-MM-DD)',
    example: '2025-01-03',
  })
  @IsOptional()
  @IsString({ message: 'Issue date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Issue date must be in YYYY-MM-DD format',
  })
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Due date (format: YYYY-MM-DD)',
    example: '2025-01-17',
  })
  @IsOptional()
  @IsString({ message: 'Due date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Due date must be in YYYY-MM-DD format',
  })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: 'draft',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus, {
    message: 'Status must be one of: draft, unpaid, paid',
  })
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
    example: 'transfer',
  })
  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: 'Payment method must be one of: transfer, cash, card',
  })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Notes/comments for the invoice',
    example: 'Please pay on time',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Buyer information',
    type: BuyerInfoRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BuyerInfoRequestDto)
  buyer?: BuyerInfoRequestDto;

  @ApiPropertyOptional({
    description:
      'Invoice items (if provided, minimum 1). Items without ID are created, existing items not present in the list are deleted.',
    type: [InvoiceItemRequestDto],
    minItems: 1,
  })
  @IsOptional()
  @IsArray({ message: 'Invoice items must be an array' })
  @ArrayMinSize(1, {
    message: 'If provided, invoice must have at least one item',
  })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemRequestDto)
  items?: InvoiceItemRequestDto[];
}
