import { PartialType } from '@nestjs/swagger';
import { CreateContractorDto } from './create-contractor.dto';

/**
 * UpdateContractorDto - DTO for contractor update
 *
 * Inherits all fields from CreateContractorDto,
 * but all are optional (PartialType).
 *
 * Allows partial update - you can update
 * only selected fields without providing all of them.
 */
export class UpdateContractorDto extends PartialType(CreateContractorDto) {}
