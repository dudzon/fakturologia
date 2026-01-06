import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InvoiceStatus } from './invoice-list-query.dto';
import { VatRate, PaymentMethod } from './create-invoice.dto';

/**
 * Allowed currencies
 */
export type Currency = 'PLN' | 'EUR' | 'USD';

/**
 * PaginationMeta - Pagination metadata
 */
export class PaginationMeta {
  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 20 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 100 })
  @Expose()
  total: number;

  @ApiProperty({ example: 5 })
  @Expose()
  totalPages: number;

  @ApiProperty({ example: true })
  @Expose()
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  @Expose()
  hasPreviousPage: boolean;
}

/**
 * SellerInfoDto - Seller information (snapshot from user profile)
 */
export class SellerInfoDto {
  @ApiProperty({
    description: 'Seller company name',
    example: 'My Company Ltd.',
  })
  @Expose()
  companyName: string;

  @ApiProperty({
    description: 'Seller address',
    example: '1 Main Street, 00-001 Warsaw',
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: 'Seller NIP (tax ID)',
    example: '1234567890',
  })
  @Expose()
  nip: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: 'PL12345678901234567890123456',
    nullable: true,
  })
  @Expose()
  bankAccount: string | null;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://storage.example.com/logos/uuid.png',
    nullable: true,
  })
  @Expose()
  logoUrl: string | null;

  constructor(partial: Partial<SellerInfoDto>) {
    Object.assign(this, partial);
  }
}

/**
 * BuyerInfoDto - Buyer information (snapshot from contractor or manual entry)
 */
export class BuyerInfoDto {
  @ApiProperty({
    description: 'Buyer name',
    example: 'Client ABC Ltd.',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Buyer address',
    example: '5 Client Street, 00-002 Krakow',
    nullable: true,
  })
  @Expose()
  address: string | null;

  @ApiPropertyOptional({
    description: 'Buyer NIP (tax ID)',
    example: '9876543210',
    nullable: true,
  })
  @Expose()
  nip: string | null;

  constructor(partial: Partial<BuyerInfoDto>) {
    Object.assign(this, partial);
  }
}

/**
 * InvoiceItemResponseDto - Invoice item in response
 */
export class InvoiceItemResponseDto {
  @ApiProperty({
    description: 'Unique item identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Position on invoice (order)',
    example: 1,
  })
  @Expose()
  position: number;

  @ApiProperty({
    description: 'Service/product name',
    example: 'Programming service',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Unit of measure',
    example: 'pcs.',
  })
  @Expose()
  unit: string;

  @ApiProperty({
    description: 'Quantity (as string for precision)',
    example: '10.00',
  })
  @Expose()
  quantity: string;

  @ApiProperty({
    description: 'Unit price net (as string for precision)',
    example: '100.00',
  })
  @Expose()
  unitPrice: string;

  @ApiProperty({
    description: 'VAT rate',
    example: '23',
    enum: ['23', '8', '5', '0', 'zw'],
  })
  @Expose()
  vatRate: VatRate;

  @ApiProperty({
    description: 'Net amount (calculated: quantity × unitPrice)',
    example: '1000.00',
  })
  @Expose()
  netAmount: string;

  @ApiProperty({
    description: 'VAT amount (calculated: netAmount × vatRate)',
    example: '230.00',
  })
  @Expose()
  vatAmount: string;

  @ApiProperty({
    description: 'Gross amount (calculated: netAmount + vatAmount)',
    example: '1230.00',
  })
  @Expose()
  grossAmount: string;

  constructor(partial: Partial<InvoiceItemResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * InvoiceListItemDto - Invoice list item (abbreviated version)
 */
export class InvoiceListItemDto {
  @ApiProperty({
    description: 'Unique invoice identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'FV/2025/001',
  })
  @Expose()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Issue date (format: YYYY-MM-DD)',
    example: '2025-01-03',
  })
  @Expose()
  issueDate: string;

  @ApiProperty({
    description: 'Due date (format: YYYY-MM-DD)',
    example: '2025-01-17',
  })
  @Expose()
  dueDate: string;

  @ApiProperty({
    description: 'Invoice status',
    enum: ['draft', 'unpaid', 'paid'],
    example: 'unpaid',
  })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Buyer name',
    example: 'Client ABC Ltd.',
  })
  @Expose()
  buyerName: string;

  @ApiPropertyOptional({
    description: 'Buyer NIP (tax ID)',
    example: '9876543210',
    nullable: true,
  })
  @Expose()
  buyerNip: string | null;

  @ApiProperty({
    description: 'Total net amount',
    example: '1000.00',
  })
  @Expose()
  totalNet: string;

  @ApiProperty({
    description: 'Total VAT amount',
    example: '230.00',
  })
  @Expose()
  totalVat: string;

  @ApiProperty({
    description: 'Total gross amount',
    example: '1230.00',
  })
  @Expose()
  totalGross: string;

  @ApiProperty({
    description: 'Currency',
    example: 'PLN',
  })
  @Expose()
  currency: Currency;

  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2025-01-03T10:00:00Z',
  })
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2025-01-03T12:30:00Z',
  })
  @Expose()
  updatedAt: string;

  constructor(partial: Partial<InvoiceListItemDto>) {
    Object.assign(this, partial);
  }
}

/**
 * InvoiceListResponseDto - Invoice list response with pagination
 */
export class InvoiceListResponseDto {
  @ApiProperty({
    description: 'List of invoices',
    type: [InvoiceListItemDto],
  })
  @Type(() => InvoiceListItemDto)
  @Expose()
  data: InvoiceListItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMeta,
  })
  @Type(() => PaginationMeta)
  @Expose()
  pagination: PaginationMeta;

  constructor(partial: Partial<InvoiceListResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * InvoiceResponseDto - Full invoice details
 */
export class InvoiceResponseDto {
  @ApiProperty({
    description: 'Unique invoice identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'FV/2025/001',
  })
  @Expose()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Issue date (format: YYYY-MM-DD)',
    example: '2025-01-03',
  })
  @Expose()
  issueDate: string;

  @ApiProperty({
    description: 'Due date (format: YYYY-MM-DD)',
    example: '2025-01-17',
  })
  @Expose()
  dueDate: string;

  @ApiProperty({
    description: 'Invoice status',
    enum: ['draft', 'unpaid', 'paid'],
    example: 'unpaid',
  })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Payment method',
    enum: ['transfer', 'cash', 'card'],
    example: 'transfer',
  })
  @Expose()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Currency',
    example: 'PLN',
  })
  @Expose()
  currency: Currency;

  @ApiPropertyOptional({
    description: 'Notes/comments for the invoice',
    example: 'Please pay on time',
    nullable: true,
  })
  @Expose()
  notes: string | null;

  @ApiProperty({
    description: 'Seller information (snapshot)',
    type: SellerInfoDto,
  })
  @Type(() => SellerInfoDto)
  @Expose()
  seller: SellerInfoDto;

  @ApiProperty({
    description: 'Buyer information (snapshot)',
    type: BuyerInfoDto,
  })
  @Type(() => BuyerInfoDto)
  @Expose()
  buyer: BuyerInfoDto;

  @ApiProperty({
    description: 'Invoice items',
    type: [InvoiceItemResponseDto],
  })
  @Type(() => InvoiceItemResponseDto)
  @Expose()
  items: InvoiceItemResponseDto[];

  @ApiProperty({
    description: 'Total net amount',
    example: '1000.00',
  })
  @Expose()
  totalNet: string;

  @ApiProperty({
    description: 'Total VAT amount',
    example: '230.00',
  })
  @Expose()
  totalVat: string;

  @ApiProperty({
    description: 'Total gross amount',
    example: '1230.00',
  })
  @Expose()
  totalGross: string;

  @ApiPropertyOptional({
    description: 'Associated contractor ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  @Expose()
  contractorId: string | null;

  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2025-01-03T10:00:00Z',
  })
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2025-01-03T12:30:00Z',
  })
  @Expose()
  updatedAt: string;

  constructor(partial: Partial<InvoiceResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * NextInvoiceNumberResponseDto - Response with next invoice number
 */
export class NextInvoiceNumberResponseDto {
  @ApiProperty({
    description: 'Generated next invoice number',
    example: 'FV/2025/001',
  })
  @Expose()
  nextNumber: string;

  @ApiProperty({
    description: 'Invoice number format',
    example: 'FV/{YYYY}/{NNN}',
  })
  @Expose()
  format: string;

  @ApiProperty({
    description: 'Counter value',
    example: 1,
  })
  @Expose()
  counter: number;

  constructor(partial: Partial<NextInvoiceNumberResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * UpdateInvoiceStatusResponseDto - Response after invoice status change
 */
export class UpdateInvoiceStatusResponseDto {
  @ApiProperty({
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'FV/2025/001',
  })
  @Expose()
  invoiceNumber: string;

  @ApiProperty({
    description: 'New invoice status',
    enum: ['draft', 'unpaid', 'paid'],
    example: 'paid',
  })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Update date (ISO 8601)',
    example: '2025-01-03T12:30:00Z',
  })
  @Expose()
  updatedAt: string;

  constructor(partial: Partial<UpdateInvoiceStatusResponseDto>) {
    Object.assign(this, partial);
  }
}
