import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Allowed sort fields for the contractors list
 */
export enum ContractorSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Sort order
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * ContractorListQueryDto - DTO for contractor list query parameters
 *
 * Supports:
 * - Pagination (page, limit)
 * - Search (search) by name or NIP
 * - Sorting (sortBy, sortOrder)
 *
 * All fields are optional with default values.
 */
export class ContractorListQueryDto {
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
    description: 'Search by contractor name or NIP',
    example: 'ABC',
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ContractorSortField,
    default: ContractorSortField.CREATED_AT,
    example: 'createdAt',
  })
  @IsOptional()
  @IsEnum(ContractorSortField, {
    message: 'Sort field must be one of: name, createdAt, updatedAt',
  })
  sortBy?: ContractorSortField = ContractorSortField.CREATED_AT;

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
