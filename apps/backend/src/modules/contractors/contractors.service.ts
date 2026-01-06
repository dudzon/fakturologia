/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * ContractorsService - Service handling contractor business logic
 *
 * NOTE: We disable some ESLint rules for this file,
 * because Supabase client returns `any` types without generated database types.
 */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ContractorNotFoundException,
  ContractorNipExistsException,
} from '../../common/exceptions/contractor.exceptions';
import {
  ContractorListQueryDto,
  ContractorSortField,
  SortOrder,
} from './dto/contractor-list-query.dto';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import {
  ContractorResponseDto,
  ContractorListResponseDto,
  PaginationMeta,
} from './dto';

/**
 * Interface representing a record from the contractors table
 * Field names correspond to database columns (snake_case)
 */
interface ContractorRow {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  nip: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Mapping of sort fields from DTO to database columns
 */
const SORT_FIELD_MAP: Record<ContractorSortField, string> = {
  [ContractorSortField.NAME]: 'name',
  [ContractorSortField.CREATED_AT]: 'created_at',
  [ContractorSortField.UPDATED_AT]: 'updated_at',
};

/**
 * ContractorsService - Service handling contractor business logic
 *
 * Services in NestJS contain all business logic.
 * Controllers should be "thin" - they only handle HTTP
 * and delegate work to services.
 *
 * This service communicates with Supabase:
 * - contractors table - user's contractor data
 *
 * Pattern: We use service role key for full access
 * (bypasses Row Level Security), because authorization
 * is already handled by JwtAuthGuard.
 */
@Injectable()
export class ContractorsService {
  private supabase: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(ContractorsService.name);

  constructor(private readonly configService: ConfigService) {
    // Get Supabase configuration
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Inicjalizacja klienta Supabase z service role key
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Gets a list of contractors with pagination, search, and sorting
   *
   * @param userId - User ID (from JWT token)
   * @param query - query parameters (pagination, search, sorting)
   * @returns ContractorListResponseDto - list of contractors with pagination metadata
   */
  async findAll(
    userId: string,
    query: ContractorListQueryDto,
  ): Promise<ContractorListResponseDto> {
    this.logger.debug(`Getting contractors for user: ${userId}`, { query });

    const {
      page = 1,
      limit = 20,
      search,
      sortBy = ContractorSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Map sort field to database column
    const dbSortField = SORT_FIELD_MAP[sortBy];
    const ascending = sortOrder === SortOrder.ASC;

    // Build base query
    let queryBuilder = this.supabase
      .from('contractors')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Add search (by name or NIP)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchTerm},nip.ilike.${searchTerm}`,
      );
    }

    // Add sorting and pagination
    const { data, error, count } = await queryBuilder
      .order(dbSortField, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Failed to fetch contractors: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch contractors');
    }

    const contractors = (data as ContractorRow[]) || [];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Map data to DTO
    const contractorDtos = contractors.map((row) =>
      this.mapToContractorDto(row),
    );

    // Prepare pagination metadata
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return new ContractorListResponseDto({
      data: contractorDtos,
      pagination,
    });
  }

  /**
   * Gets a single contractor by ID
   *
   * @param userId - User ID (from JWT token)
   * @param contractorId - Contractor ID
   * @returns ContractorResponseDto - contractor data
   * @throws ContractorNotFoundException - when contractor does not exist
   */
  async findOne(
    userId: string,
    contractorId: string,
  ): Promise<ContractorResponseDto> {
    this.logger.debug(`Getting contractor ${contractorId} for user: ${userId}`);

    const { data, error } = await this.supabase
      .from('contractors')
      .select('*')
      .eq('id', contractorId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      this.logger.warn(`Contractor not found: ${contractorId}`);
      throw new ContractorNotFoundException(contractorId);
    }

    return this.mapToContractorDto(data as ContractorRow);
  }

  /**
   * Creates a new contractor
   *
   * @param userId - User ID (from JWT token)
   * @param dto - new contractor data
   * @returns ContractorResponseDto - created contractor
   * @throws ContractorNipExistsException - when NIP already exists
   */
  async create(
    userId: string,
    dto: CreateContractorDto,
  ): Promise<ContractorResponseDto> {
    this.logger.debug(`Creating contractor for user: ${userId}`, {
      name: dto.name,
    });

    // Check NIP uniqueness (if provided)
    if (dto.nip) {
      await this.checkNipUniqueness(userId, dto.nip);
    }

    // Prepare data for insertion
    const insertData = {
      user_id: userId,
      name: dto.name,
      address: dto.address || null,
      nip: dto.nip || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('contractors')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create contractor: ${error.message}`);
      throw new InternalServerErrorException('Failed to create contractor');
    }

    return this.mapToContractorDto(data as ContractorRow);
  }

  /**
   * Updates an existing contractor
   *
   * @param userId - User ID (from JWT token)
   * @param contractorId - Contractor ID
   * @param dto - data to update
   * @returns ContractorResponseDto - updated contractor
   * @throws ContractorNotFoundException - when contractor does not exist
   * @throws ContractorNipExistsException - when NIP already exists for another contractor
   */
  async update(
    userId: string,
    contractorId: string,
    dto: UpdateContractorDto,
  ): Promise<ContractorResponseDto> {
    this.logger.debug(
      `Updating contractor ${contractorId} for user: ${userId}`,
    );

    // Check if contractor exists and belongs to user
    await this.findOne(userId, contractorId);

    // Check NIP uniqueness (if being changed)
    if (dto.nip !== undefined && dto.nip !== null) {
      await this.checkNipUniqueness(userId, dto.nip, contractorId);
    }

    // Prepare data for update (only provided fields)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address;
    }
    if (dto.nip !== undefined) {
      updateData.nip = dto.nip;
    }

    const { data, error } = await this.supabase
      .from('contractors')
      .update(updateData)
      .eq('id', contractorId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update contractor: ${error.message}`);
      throw new InternalServerErrorException('Failed to update contractor');
    }

    return this.mapToContractorDto(data as ContractorRow);
  }

  /**
   * Soft delete a contractor
   *
   * Sets the deleted_at field instead of physically deleting the record.
   * This allows for history preservation and potential restoration.
   *
   * @param userId - User ID (from JWT token)
   * @param contractorId - Contractor ID
   * @throws ContractorNotFoundException - when contractor does not exist
   */
  async remove(userId: string, contractorId: string): Promise<void> {
    this.logger.debug(
      `Soft deleting contractor ${contractorId} for user: ${userId}`,
    );

    // Check if contractor exists and belongs to user
    await this.findOne(userId, contractorId);

    const { error } = await this.supabase
      .from('contractors')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractorId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to delete contractor: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete contractor');
    }

    this.logger.log(`Contractor ${contractorId} soft deleted successfully`);
  }

  /**
   * Checks NIP uniqueness for a user
   *
   * @param userId - User ID
   * @param nip - NIP to check
   * @param excludeContractorId - Contractor ID to exclude (when updating)
   * @throws ContractorNipExistsException - when NIP already exists
   */
  private async checkNipUniqueness(
    userId: string,
    nip: string,
    excludeContractorId?: string,
  ): Promise<void> {
    let query = this.supabase
      .from('contractors')
      .select('id')
      .eq('user_id', userId)
      .eq('nip', nip)
      .is('deleted_at', null);

    // Exclude current contractor when updating
    if (excludeContractorId) {
      query = query.neq('id', excludeContractorId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Failed to check NIP uniqueness: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to validate contractor data',
      );
    }

    if (data && data.length > 0) {
      throw new ContractorNipExistsException(nip);
    }
  }

  /**
   * Maps database record to DTO (snake_case → camelCase)
   *
   * @param row - database record
   * @returns ContractorResponseDto
   */
  private mapToContractorDto(row: ContractorRow): ContractorResponseDto {
    return new ContractorResponseDto({
      id: row.id,
      name: row.name,
      address: row.address,
      nip: row.nip,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
