import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * UploadLogoResponseDto - DTO odpowiedzi po uploadzie logo
 *
 * Zwracane po pomyślnym uploadzie logo firmy.
 * Zawiera URL do nowo uploadowanego pliku.
 */
export class UploadLogoResponseDto {
  @ApiProperty({
    description: 'URL do uploadowanego logo w Supabase Storage',
    example:
      'https://xyz.supabase.co/storage/v1/object/public/logos/user-id/logo.1704067200000.png',
  })
  @Expose()
  logoUrl: string;
}
