import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ContractorResponseDto } from './contractor-response.dto';

/**
 * PaginationMeta - Pagination metadata for lists
 */
export class PaginationMeta {
  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  @Expose()
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  @Expose()
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  @Expose()
  totalPages: number;

  @ApiProperty({
    description: 'Whether next page exists',
    example: true,
  })
  @Expose()
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether previous page exists',
    example: false,
  })
  @Expose()
  hasPreviousPage: boolean;
}

/**
 * ContractorListResponseDto - DTO for contractor list response
 *
 * Contains:
 * - data: array of contractors
 * - pagination: pagination metadata
 */
export class ContractorListResponseDto {
  @ApiProperty({
    description: 'List of contractors',
    type: [ContractorResponseDto],
  })
  @Expose()
  @Type(() => ContractorResponseDto)
  data: ContractorResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMeta,
  })
  @Expose()
  @Type(() => PaginationMeta)
  pagination: PaginationMeta;

  constructor(partial: Partial<ContractorListResponseDto>) {
    Object.assign(this, partial);
  }
}
