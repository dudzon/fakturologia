import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  Length,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPolishNIP } from '../../../common';
import { InvoiceStatus } from './invoice-list-query.dto';

/**
 * Allowed VAT rates
 */
export enum VatRate {
  VAT_23 = '23',
  VAT_8 = '8',
  VAT_5 = '5',
  VAT_0 = '0',
  VAT_ZW = 'zw',
}

/**
 * Allowed payment methods
 */
export enum PaymentMethod {
  TRANSFER = 'transfer',
  CASH = 'cash',
  CARD = 'card',
}

/**
 * BuyerInfoRequestDto - Buyer information for creating/updating invoice
 */
export class BuyerInfoRequestDto {
  @ApiProperty({
    description: 'Buyer name',
    example: 'Client ABC Ltd.',
    maxLength: 255,
  })
  @IsString({ message: 'Buyer name must be a string' })
  @IsNotEmpty({ message: 'Buyer name is required' })
  @MaxLength(255, { message: 'Buyer name cannot exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Buyer address',
    example: '5 Client Street, 00-002 Krakow',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Buyer address must be a string' })
  @MaxLength(500, { message: 'Buyer address cannot exceed 500 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Buyer NIP (10 digits)',
    example: '9876543210',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'NIP must be a string' })
  @Length(10, 10, { message: 'NIP must have exactly 10 digits' })
  @Matches(/^\d{10}$/, { message: 'NIP must contain only 10 digits' })
  @IsPolishNIP({ message: 'Invalid buyer NIP number' })
  nip?: string;
}

/**
 * InvoiceItemRequestDto - Invoice item for creating/updating
 */
export class InvoiceItemRequestDto {
  @ApiPropertyOptional({
    description: 'Existing item ID (for update)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Item ID must be a valid UUID' })
  id?: string;

  @ApiProperty({
    description: 'Position on invoice (order)',
    example: 1,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Position must be a number' })
  @IsPositive({ message: 'Position must be greater than 0' })
  position: number;

  @ApiProperty({
    description: 'Service/product name',
    example: 'Programming service',
    maxLength: 255,
  })
  @IsString({ message: 'Item name must be a string' })
  @IsNotEmpty({ message: 'Item name is required' })
  @MaxLength(255, { message: 'Item name cannot exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Unit of measure',
    example: 'pcs.',
    default: 'pcs.',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Unit must be a string' })
  @MaxLength(20, { message: 'Unit cannot exceed 20 characters' })
  unit?: string;

  @ApiProperty({
    description: 'Quantity (as string for precision)',
    example: '10.00',
  })
  @IsString({ message: 'Quantity must be a string (for precision)' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Quantity must be a number with maximum 2 decimal places',
  })
  quantity: string;

  @ApiProperty({
    description: 'Unit price net (as string for precision)',
    example: '100.00',
  })
  @IsString({ message: 'Unit price must be a string (for precision)' })
  @IsNotEmpty({ message: 'Unit price is required' })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Unit price must be a number with maximum 2 decimal places',
  })
  unitPrice: string;

  @ApiProperty({
    description: 'VAT rate',
    enum: VatRate,
    example: '23',
  })
  @IsEnum(VatRate, {
    message: 'VAT rate must be one of: 23, 8, 5, 0, zw',
  })
  vatRate: VatRate;
}

/**
 * CreateInvoiceDto - DTO for creating a new invoice
 */
export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Invoice number',
    example: 'FV/2025/001',
    maxLength: 50,
  })
  @IsString({ message: 'Invoice number must be a string' })
  @IsNotEmpty({ message: 'Invoice number is required' })
  @MaxLength(50, { message: 'Invoice number cannot exceed 50 characters' })
  invoiceNumber: string;

  @ApiProperty({
    description: 'Issue date (format: YYYY-MM-DD)',
    example: '2025-01-03',
  })
  @IsString({ message: 'Issue date must be a string' })
  @IsNotEmpty({ message: 'Issue date is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Issue date must be in YYYY-MM-DD format',
  })
  issueDate: string;

  @ApiProperty({
    description: 'Due date (format: YYYY-MM-DD)',
    example: '2025-01-17',
  })
  @IsString({ message: 'Due date must be a string' })
  @IsNotEmpty({ message: 'Due date is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Due date must be in YYYY-MM-DD format',
  })
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Invoice status (default: draft)',
    enum: InvoiceStatus,
    default: 'draft',
    example: 'draft',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus, {
    message: 'Status must be one of: draft, unpaid, paid',
  })
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Payment method (default: transfer)',
    enum: PaymentMethod,
    default: 'transfer',
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
    description: 'Associated contractor ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Contractor ID must be a valid UUID' })
  contractorId?: string;

  @ApiProperty({
    description: 'Buyer information',
    type: BuyerInfoRequestDto,
  })
  @ValidateNested()
  @Type(() => BuyerInfoRequestDto)
  buyer: BuyerInfoRequestDto;

  @ApiProperty({
    description: 'Invoice items (minimum 1)',
    type: [InvoiceItemRequestDto],
    minItems: 1,
  })
  @IsArray({ message: 'Invoice items must be an array' })
  @ArrayMinSize(1, { message: 'Invoice must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemRequestDto)
  items: InvoiceItemRequestDto[];
}
