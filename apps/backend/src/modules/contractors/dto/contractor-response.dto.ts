import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * ContractorResponseDto - DTO for contractor data response
 *
 * Used for:
 * - GET /contractors/:id - single contractor
 * - POST /contractors - newly created contractor
 * - PUT /contractors/:id - updated contractor
 * - GET /contractors - contractor list items
 */
export class ContractorResponseDto {
  @ApiProperty({
    description: 'Unique contractor identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Contractor name',
    example: 'ABC Company Ltd.',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Contractor address',
    example: '123 Example St, 00-001 Warsaw',
    nullable: true,
  })
  @Expose()
  address: string | null;

  @ApiPropertyOptional({
    description: 'Contractor NIP number',
    example: '1234567890',
    nullable: true,
  })
  @Expose()
  nip: string | null;

  @ApiProperty({
    description: 'Contractor creation date (ISO 8601)',
    example: '2025-01-10T08:00:00Z',
  })
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: 'Contractor last update date (ISO 8601)',
    example: '2025-01-15T12:30:00Z',
  })
  @Expose()
  updatedAt: string;

  constructor(partial: Partial<ContractorResponseDto>) {
    Object.assign(this, partial);
  }
}
