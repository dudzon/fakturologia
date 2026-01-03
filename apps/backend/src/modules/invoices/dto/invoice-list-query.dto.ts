import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Allowed invoice statuses
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  UNPAID = 'unpaid',
  PAID = 'paid',
}

/**
 * Allowed sort fields for invoice list
 */
export enum InvoiceSortField {
  INVOICE_NUMBER = 'invoiceNumber',
  ISSUE_DATE = 'issueDate',
  DUE_DATE = 'dueDate',
  TOTAL_GROSS = 'totalGross',
  CREATED_AT = 'createdAt',
}

/**
 * Sort order
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * InvoiceListQueryDto - DTO for invoice list query parameters
 *
 * Supports:
 * - Pagination (page, limit)
 * - Filtering by status (status)
 * - Search (search) by invoice number or buyer name
 * - Date filtering (dateFrom, dateTo)
 * - Sorting (sortBy, sortOrder)
 *
 * All fields are optional with default values.
 */
export class InvoiceListQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page number must be an integer' })
  @Min(1, { message: 'Page number must be greater than or equal to 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by invoice status',
    enum: InvoiceStatus,
    example: 'unpaid',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus, {
    message: 'Status must be one of: draft, unpaid, paid',
  })
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Search by invoice number or buyer name',
    example: 'FV/2025',
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date of issue (format: YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsString({ message: 'Start date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Start date must be in YYYY-MM-DD format',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date of issue (format: YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsString({ message: 'End date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in YYYY-MM-DD format',
  })
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: InvoiceSortField,
    default: InvoiceSortField.CREATED_AT,
    example: 'createdAt',
  })
  @IsOptional()
  @IsEnum(InvoiceSortField, {
    message:
      'Sort field must be one of: invoiceNumber, issueDate, dueDate, totalGross, createdAt',
  })
  sortBy?: InvoiceSortField = InvoiceSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'Sort order must be asc or desc',
  })
  sortOrder?: SortOrder = SortOrder.DESC;
}
