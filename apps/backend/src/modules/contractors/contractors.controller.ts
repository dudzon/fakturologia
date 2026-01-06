import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { ContractorsService } from './contractors.service';
import { JwtAuthGuard, CurrentUser } from '../../common';
import {
  ContractorListQueryDto,
  ContractorSortField,
  SortOrder,
  CreateContractorDto,
  UpdateContractorDto,
  ContractorResponseDto,
  ContractorListResponseDto,
} from './dto';
import { MessageResponseDto } from '../users/dto';

/**
 * ContractorsController - Controller handling contractor endpoints
 *
 * In NestJS architecture, a controller:
 * 1. Receives HTTP requests
 * 2. Validates input data (automatically via ValidationPipe)
 * 3. Delegates logic to the service
 * 4. Returns HTTP response
 *
 * "Thin controller" principle:
 * - Controller does NOT contain business logic
 * - All logic is in ContractorsService
 *
 * Endpoints:
 * - GET    /contractors      - contractor list with pagination
 * - GET    /contractors/:id  - single contractor
 * - POST   /contractors      - create contractor
 * - PUT    /contractors/:id  - update contractor
 * - DELETE /contractors/:id  - soft delete contractor
 */
@ApiTags('Contractors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  /**
   * GET /api/v1/contractors
   *
   * Gets a list of contractors with pagination, search, and sorting.
   *
   * @param user - User object from JWT
   * @param query - Query parameters (page, limit, search, sortBy, sortOrder)
   * @returns ContractorListResponseDto - list of contractors with pagination metadata
   */
  @Get()
  @ApiOperation({
    summary: 'Get contractor list',
    description:
      'Returns a paginated list of contractors with search and sorting capabilities',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or NIP',
    example: 'ABC',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ContractorSortField,
    description: 'Sort field (default: createdAt)',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: SortOrder,
    description: 'Sort order (default: desc)',
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Contractor list',
    type: ContractorListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: ContractorListQueryDto,
  ): Promise<ContractorListResponseDto> {
    return this.contractorsService.findAll(user.id, query);
  }

  /**
   * GET /api/v1/contractors/:id
   *
   * Gets a single contractor by ID.
   *
   * @param user - User object from JWT
   * @param id - Contractor UUID
   * @returns ContractorResponseDto - contractor data
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get contractor by ID',
    description: 'Returns detailed data of a single contractor',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique contractor identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contractor data',
    type: ContractorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Contractor not found',
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractorResponseDto> {
    return this.contractorsService.findOne(user.id, id);
  }

  /**
   * POST /api/v1/contractors
   *
   * Creates a new contractor.
   *
   * @param user - User object from JWT
   * @param dto - New contractor data
   * @returns ContractorResponseDto - created contractor
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new contractor',
    description: 'Creates a new contractor for the logged-in user',
  })
  @ApiResponse({
    status: 201,
    description: 'Contractor created successfully',
    type: ContractorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'Contractor with this NIP already exists',
  })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateContractorDto,
  ): Promise<ContractorResponseDto> {
    return this.contractorsService.create(user.id, dto);
  }

  /**
   * PUT /api/v1/contractors/:id
   *
   * Updates an existing contractor.
   * All fields are optional - only selected fields can be updated.
   *
   * @param user - User object from JWT
   * @param id - Contractor UUID
   * @param dto - Data to update
   * @returns ContractorResponseDto - updated contractor
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update contractor',
    description: 'Updates data of an existing contractor',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique contractor identifier (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contractor updated successfully',
    type: ContractorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Contractor not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Contractor with this NIP already exists',
  })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractorDto,
  ): Promise<ContractorResponseDto> {
    return this.contractorsService.update(user.id, id, dto);
  }

  /**
   * DELETE /api/v1/contractors/:id
   *
   * Deletes a contractor (soft delete).
   * The contractor is marked as deleted but not physically removed from the database.
   *
   * @param user - User object from JWT
   * @param id - Contractor UUID
   * @returns MessageResponseDto - confirmation message
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete contractor',
    description:
      'Deletes a contractor (soft delete - data preserved in database)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique contractor identifier (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contractor deleted successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Contractor not found',
  })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MessageResponseDto> {
    await this.contractorsService.remove(user.id, id);
    return { message: 'Contractor successfully deleted' };
  }
}
