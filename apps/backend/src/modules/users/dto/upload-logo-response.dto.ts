import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * UploadLogoResponseDto - Response DTO after logo upload
 *
 * Returned after successful company logo upload.
 * Contains URL to the newly uploaded file.
 */
export class UploadLogoResponseDto {
  @ApiProperty({
    description: 'URL to uploaded logo in Supabase Storage',
    example:
      'https://xyz.supabase.co/storage/v1/object/public/logos/user-id/logo.1704067200000.png',
  })
  @Expose()
  logoUrl: string;
}
