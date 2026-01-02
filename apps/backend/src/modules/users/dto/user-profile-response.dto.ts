import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * UserProfileResponseDto - DTO odpowiedzi dla profilu użytkownika
 *
 * DTO (Data Transfer Object) to obiekt używany do transferu danych
 * między warstwami aplikacji. W tym przypadku definiuje strukturę
 * odpowiedzi API dla endpointu GET /users/profile.
 *
 * Kluczowe elementy:
 * - @ApiProperty/@ApiPropertyOptional - dokumentacja Swagger
 * - @Expose - class-transformer używa tego do serializacji
 *
 * Mapowanie nazw pól (baza danych → API):
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
    description: 'Unikalny identyfikator użytkownika (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Adres email użytkownika',
    example: 'jan.kowalski@example.com',
  })
  @Expose()
  email: string;

  @ApiPropertyOptional({
    description: 'Nazwa firmy sprzedawcy',
    example: 'Firma ABC Sp. z o.o.',
  })
  @Expose()
  companyName: string | null;

  @ApiPropertyOptional({
    description: 'Pełny adres firmy (ulica, kod pocztowy, miasto)',
    example: 'ul. Przykładowa 123, 00-001 Warszawa',
  })
  @Expose()
  address: string | null;

  @ApiPropertyOptional({
    description: 'NIP firmy (10 cyfr)',
    example: '1234567890',
  })
  @Expose()
  nip: string | null;

  @ApiPropertyOptional({
    description: 'Numer konta bankowego w formacie IBAN',
    example: 'PL61109010140000071219812874',
  })
  @Expose()
  bankAccount: string | null;

  @ApiPropertyOptional({
    description: 'URL do logo firmy w Supabase Storage',
    example:
      'https://xyz.supabase.co/storage/v1/object/public/logos/user-id/logo.png',
  })
  @Expose()
  logoUrl: string | null;

  @ApiProperty({
    description:
      'Format numeracji faktur. Dostępne placeholdery: {YYYY} - rok, {MM} - miesiąc, {NNN} - numer',
    example: 'FV/{YYYY}/{MM}/{NNN}',
    default: 'FV/{YYYY}/{NNN}',
  })
  @Expose()
  invoiceNumberFormat: string;

  @ApiProperty({
    description:
      'Aktualny licznik numeracji faktur (następna faktura otrzyma ten numer + 1)',
    example: 5,
    default: 0,
  })
  @Expose()
  invoiceNumberCounter: number;

  @ApiProperty({
    description: 'Data utworzenia profilu',
    example: '2025-01-01T10:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Data ostatniej aktualizacji profilu',
    example: '2025-01-15T14:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
