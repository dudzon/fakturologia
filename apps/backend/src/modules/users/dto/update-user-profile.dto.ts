import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { IsPolishNIP, IsValidIBAN, ContainsPlaceholder } from '../../../common';

/**
 * UpdateUserProfileDto - DTO for updating user profile
 *
 * All fields are optional (@IsOptional), because the user
 * can update only selected fields.
 *
 * Validation:
 * - nip: exactly 10 digits + NIP checksum validation
 * - bankAccount: max 32 characters + IBAN format validation (mod 97)
 * - invoiceNumberFormat: must contain {NNN} placeholder
 *
 * Usage example:
 * PUT /api/v1/users/profile
 * {
 *   "companyName": "New Company Ltd.",
 *   "nip": "1234567890"
 * }
 */
export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Seller company name',
    example: 'ABC Company Ltd.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Full company address (street, postal code, city)',
    example: '456 New St, 00-002 Warsaw',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @ApiPropertyOptional({
    description:
      'Company tax ID (NIP) - exactly 10 digits, validated with checksum algorithm',
    example: '1234567890',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'NIP must be a string' })
  @Length(10, 10, { message: 'NIP must be exactly 10 digits' })
  @Matches(/^\d{10}$/, { message: 'NIP must contain only 10 digits' })
  @IsPolishNIP({ message: 'Invalid NIP checksum' })
  nip?: string;

  @ApiPropertyOptional({
    description: 'Bank account number in IBAN format (max 32 characters)',
    example: 'PL61109010140000071219812874',
    maxLength: 32,
  })
  @IsOptional()
  @IsString({ message: 'Bank account must be a string' })
  @Length(1, 32, {
    message: 'Bank account must be between 1 and 32 characters',
  })
  @IsValidIBAN({ message: 'Invalid IBAN format' })
  bankAccount?: string;

  @ApiPropertyOptional({
    description:
      'Invoice number format. Must contain {NNN}. Available: {YYYY}, {MM}, {DD}, {NNN}',
    example: 'FV/{YYYY}/{MM}/{NNN}',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Invoice number format must be a string' })
  @Length(1, 100, {
    message: 'Invoice number format must be between 1 and 100 characters',
  })
  @ContainsPlaceholder('{NNN}', {
    message: 'Invoice number format must contain {NNN} placeholder',
  })
  invoiceNumberFormat?: string;
}
