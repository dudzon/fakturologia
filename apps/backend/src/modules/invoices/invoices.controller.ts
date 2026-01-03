/**
 * InvoicesController - Controller handling invoice endpoints
 *
 * In NestJS architecture the controller:
 * 1. Receives HTTP requests
 * 2. Validates input data (automatically via ValidationPipe)
 * 3. Delegates logic to service
 * 4. Returns HTTP response
 *
 * "Thin controller" principle:
 * - Controller does NOT contain business logic
 * - All logic is in InvoicesService
 *
 * Endpoints:
 * - GET    /invoices             - invoice list with pagination and filters
 * - GET    /invoices/next-number - next invoice number
 * - GET    /invoices/:id         - single invoice
 * - POST   /invoices             - create invoice
 * - PUT    /invoices/:id         - update invoice
 * - PATCH  /invoices/:id/status  - change invoice status
 * - POST   /invoices/:id/duplicate - duplicate invoice
 * - DELETE /invoices/:id         - soft delete invoice
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '../../common';
import { InvoicesService } from './invoices.service';
import {
  InvoiceListQueryDto,
  InvoiceStatus,
  InvoiceSortField,
  SortOrder,
} from './dto/invoice-list-query.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { DuplicateInvoiceDto } from './dto/duplicate-invoice.dto';
import {
  InvoiceListResponseDto,
  InvoiceResponseDto,
  NextInvoiceNumberResponseDto,
  UpdateInvoiceStatusResponseDto,
} from './dto/invoice-response.dto';
import { MessageResponseDto } from '../users/dto';

/**
 * User interface from JWT token
 */
interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // ==================== GET /invoices ====================
  /**
   * Gets invoice list with pagination, filtering and sorting
   */
  @Get()
  @ApiOperation({
    summary: 'Get invoice list',
    description:
      'Returns paginated invoice list with filtering by status, date and search capability',
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
    name: 'status',
    required: false,
    enum: InvoiceStatus,
    description: 'Filter by invoice status',
    example: 'unpaid',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by invoice number or buyer name',
    example: 'FV/2025',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start issue date (format: YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End issue date (format: YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: InvoiceSortField,
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
    description: 'Invoice list',
    type: InvoiceListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async findAll(
    @CurrentUser() user: JwtUser,
    @Query() query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
    return this.invoicesService.findAll(user.sub, query);
  }

  // ==================== GET /invoices/next-number ====================
  /**
   * Gets next invoice number
   * NOTE: This endpoint must be BEFORE /:id to not be matched as UUID
   */
  @Get('next-number')
  @ApiOperation({
    summary: 'Get next invoice number',
    description:
      'Generates next invoice number based on user format and counter',
  })
  @ApiResponse({
    status: 200,
    description: 'Next invoice number',
    type: NextInvoiceNumberResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getNextNumber(
    @CurrentUser() user: JwtUser,
  ): Promise<NextInvoiceNumberResponseDto> {
    return this.invoicesService.getNextNumber(user.sub);
  }

  // ==================== GET /invoices/:id ====================
  /**
   * Gets a single invoice by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Returns detailed invoice data with items',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique invoice identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice data',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async findOne(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(user.sub, id);
  }

  // ==================== POST /invoices ====================
  /**
   * Creates a new invoice
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new invoice',
    description:
      'Creates a new invoice. Seller data is automatically fetched from user profile.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @CurrentUser() user: JwtUser,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.create(user.sub, createInvoiceDto);
  }

  // ==================== PUT /invoices/:id ====================
  /**
   * Updates an existing invoice
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update invoice',
    description:
      'Updates invoice data. If items are provided, they replace existing ones.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique invoice identifier (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
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
    description: 'Invoice not found',
  })
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.update(user.sub, id, updateInvoiceDto);
  }

  // ==================== PATCH /invoices/:id/status ====================
  /**
   * Updates invoice status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change invoice status',
    description:
      'Changes invoice status (draft → unpaid → paid). Requires complete profile for statuses other than draft.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique invoice identifier (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice status changed successfully',
    type: UpdateInvoiceStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status or disallowed status change',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
  ): Promise<UpdateInvoiceStatusResponseDto> {
    return this.invoicesService.updateStatus(user.sub, id, updateStatusDto);
  }

  // ==================== POST /invoices/:id/duplicate ====================
  /**
   * Duplicates an existing invoice
   */
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Duplicate invoice',
    description:
      "Creates a copy of invoice with new number and today's date. New invoice status is draft.",
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique identifier of invoice to duplicate (UUID)',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice duplicated successfully',
    type: InvoiceResponseDto,
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
    description: 'Invoice not found',
  })
  async duplicate(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicateDto: DuplicateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.duplicate(user.sub, id, duplicateDto);
  }

  // ==================== DELETE /invoices/:id ====================
  /**
   * Deletes an invoice (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete invoice',
    description: 'Deletes invoice (soft delete - data preserved in database)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Unique invoice identifier (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice deleted successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MessageResponseDto> {
    await this.invoicesService.remove(user.sub, id);
    const response = new MessageResponseDto();
    response.message = 'Invoice deleted successfully';
    return response;
  }
}
