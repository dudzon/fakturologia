import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { IsPolishNIP, IsValidIBAN, ContainsPlaceholder } from '../../../common';

/**
 * UpdateUserProfileDto - DTO do aktualizacji profilu użytkownika
 *
 * Wszystkie pola są opcjonalne (@IsOptional), ponieważ użytkownik
 * może aktualizować tylko wybrane pola.
 *
 * Walidacja:
 * - nip: dokładnie 10 cyfr + walidacja sumy kontrolnej NIP
 * - bankAccount: max 32 znaki + walidacja formatu IBAN (mod 97)
 * - invoiceNumberFormat: musi zawierać placeholder {NNN}
 *
 * Przykład użycia:
 * PUT /api/v1/users/profile
 * {
 *   "companyName": "Nowa Firma Sp. z o.o.",
 *   "nip": "1234567890"
 * }
 */
export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Nazwa firmy sprzedawcy',
    example: 'Firma ABC Sp. z o.o.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Pełny adres firmy (ulica, kod pocztowy, miasto)',
    example: 'ul. Nowa 456, 00-002 Warszawa',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @ApiPropertyOptional({
    description:
      'NIP firmy - dokładnie 10 cyfr, walidowany algorytmem sumy kontrolnej',
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
    description: 'Numer konta bankowego w formacie IBAN (max 32 znaki)',
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
      'Format numeracji faktur. Musi zawierać {NNN}. Dostępne: {YYYY}, {MM}, {DD}, {NNN}',
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
