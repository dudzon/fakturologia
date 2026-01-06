import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';
import { IsPolishNIP } from '../../../common';

/**
 * CreateContractorDto - DTO for creating a new contractor
 *
 * Required fields:
 * - name: Contractor name (company or full name)
 *
 * Optional fields:
 * - address: Contractor address
 * - nip: NIP number (validated by IsPolishNIP)
 */
export class CreateContractorDto {
  @ApiProperty({
    description: 'Contractor name (company or full name)',
    example: 'ABC Company Ltd.',
    maxLength: 255,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Contractor name is required' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Contractor address',
    example: '123 Example St, 00-001 Warsaw',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Contractor NIP number (10 digits)',
    example: '1234567890',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'NIP must be a string' })
  @Length(10, 10, { message: 'NIP must be exactly 10 digits' })
  @Matches(/^\d{10}$/, { message: 'NIP must contain only 10 digits' })
  @IsPolishNIP({ message: 'Invalid NIP number' })
  nip?: string;
}
