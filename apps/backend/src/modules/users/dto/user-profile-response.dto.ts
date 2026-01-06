import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * UserProfileResponseDto - Response DTO for user profile
 *
 * DTO (Data Transfer Object) is an object used for data transfer
 * between application layers. In this case it defines the structure
 * of API response for GET /users/profile endpoint.
 *
 * Key elements:
 * - @ApiProperty/@ApiPropertyOptional - Swagger documentation
 * - @Expose - class-transformer uses this for serialization
 *
 * Field name mapping (database → API):
 * - company_name → companyName (snake_case → camelCase)
 * - bank_account → bankAccount
 * - logo_url → logoUrl
 * - invoice_number_format → invoiceNumberFormat
 * - invoice_number_counter → invoiceNumberCounter
 * - created_at → createdAt
 * - updated_at → updatedAt
 */
export class UserProfileResponseDto {
  @ApiProperty({
    description: 'Unique user identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'jan.kowalski@example.com',
  })
  @Expose()
  email: string;

  @ApiPropertyOptional({
    description: 'Seller company name',
    example: 'Company ABC Ltd.',
  })
  @Expose()
  companyName: string | null;

  @ApiPropertyOptional({
    description: 'Full company address (street, postal code, city)',
    example: '123 Example St, 00-001 Warsaw',
  })
  @Expose()
  address: string | null;

  @ApiPropertyOptional({
    description: 'Company tax ID (NIP - 10 digits)',
    example: '1234567890',
  })
  @Expose()
  nip: string | null;

  @ApiPropertyOptional({
    description: 'Bank account number in IBAN format',
    example: 'PL61109010140000071219812874',
  })
  @Expose()
  bankAccount: string | null;

  @ApiPropertyOptional({
    description: 'URL to company logo in Supabase Storage',
    example:
      'https://xyz.supabase.co/storage/v1/object/public/logos/user-id/logo.png',
  })
  @Expose()
  logoUrl: string | null;

  @ApiProperty({
    description:
      'Invoice number format. Available placeholders: {YYYY} - year, {MM} - month, {NNN} - number',
    example: 'FV/{YYYY}/{MM}/{NNN}',
    default: 'FV/{YYYY}/{NNN}',
  })
  @Expose()
  invoiceNumberFormat: string;

  @ApiProperty({
    description:
      'Current invoice number counter (next invoice will get this number + 1)',
    example: 5,
    default: 0,
  })
  @Expose()
  invoiceNumberCounter: number;

  @ApiProperty({
    description: 'Profile creation date',
    example: '2025-01-01T10:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Profile last update date',
    example: '2025-01-15T14:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
