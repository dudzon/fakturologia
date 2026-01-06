/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * InvoicesService - Service handling invoice business logic
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
  InvoiceNotFoundException,
  InvoiceNumberExistsException,
  InvalidDatesException,
  IncompleteProfileException,
  InvalidStatusTransitionException,
} from '../../common/exceptions/invoice.exceptions';
import {
  InvoiceListQueryDto,
  InvoiceSortField,
  SortOrder,
  InvoiceStatus,
} from './dto/invoice-list-query.dto';
import {
  CreateInvoiceDto,
  InvoiceItemRequestDto,
} from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { DuplicateInvoiceDto } from './dto/duplicate-invoice.dto';
import {
  InvoiceListResponseDto,
  InvoiceListItemDto,
  InvoiceResponseDto,
  InvoiceItemResponseDto,
  SellerInfoDto,
  BuyerInfoDto,
  NextInvoiceNumberResponseDto,
  UpdateInvoiceStatusResponseDto,
  PaginationMeta,
} from './dto/invoice-response.dto';

/**
 * Interface representing a record from the invoices table
 */
interface InvoiceRow {
  id: string;
  user_id: string;
  contractor_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  payment_method: string;
  currency: string;
  notes: string | null;
  seller_company_name: string;
  seller_address: string;
  seller_nip: string;
  seller_bank_account: string | null;
  seller_logo_url: string | null;
  buyer_name: string;
  buyer_address: string | null;
  buyer_nip: string | null;
  total_net: string;
  total_vat: string;
  total_gross: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Interface representing a record from the invoice_items table
 */
interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  position: number;
  name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  vat_rate: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface representing a user profile
 */
interface UserProfileRow {
  id: string;
  company_name: string | null;
  address: string | null;
  nip: string | null;
  bank_account: string | null;
  logo_url: string | null;
  invoice_number_format: string | null;
  invoice_number_counter: number | null;
}

/**
 * Mapping of sort fields from DTO to database columns
 */
const SORT_FIELD_MAP: Record<InvoiceSortField, string> = {
  [InvoiceSortField.INVOICE_NUMBER]: 'invoice_number',
  [InvoiceSortField.ISSUE_DATE]: 'issue_date',
  [InvoiceSortField.DUE_DATE]: 'due_date',
  [InvoiceSortField.TOTAL_GROSS]: 'total_gross',
  [InvoiceSortField.CREATED_AT]: 'created_at',
};

/**
 * VAT rates as numeric values for calculations
 */
const VAT_RATES: Record<string, number> = {
  '23': 0.23,
  '8': 0.08,
  '5': 0.05,
  '0': 0,
  zw: 0,
};

/**
 * InvoicesService - Service handling invoice business logic
 *
 * Services in NestJS contain all business logic.
 * Controllers should be "thin" - only handle HTTP
 * and delegate work to services.
 *
 * This service communicates with Supabase:
 * - invoices table - invoice data
 * - invoice_items table - invoice items
 * - user_profiles table - seller data (for snapshot)
 */
@Injectable()
export class InvoicesService {
  private supabase: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Gets a list of invoices with pagination, filtering and sorting
   */
  async findAll(
    userId: string,
    query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
    this.logger.debug(`Getting invoices for user: ${userId}`, { query });

    const {
      page = 1,
      limit = 20,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = InvoiceSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = query;

    const offset = (page - 1) * limit;
    const dbSortField = SORT_FIELD_MAP[sortBy];
    const ascending = sortOrder === SortOrder.ASC;

    // Build base query
    let queryBuilder = this.supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Filter by status
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // Search by invoice number or buyer name
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder = queryBuilder.or(
        `invoice_number.ilike.${searchTerm},buyer_name.ilike.${searchTerm}`,
      );
    }

    // Filter by issue date
    if (dateFrom) {
      queryBuilder = queryBuilder.gte('issue_date', dateFrom);
    }
    if (dateTo) {
      queryBuilder = queryBuilder.lte('issue_date', dateTo);
    }

    // Sorting and pagination
    const { data, error, count } = await queryBuilder
      .order(dbSortField, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Failed to fetch invoices: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch invoices');
    }

    const invoices = (data as InvoiceRow[]) || [];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Map data to DTO
    const invoiceDtos = invoices.map((row) =>
      this.mapToInvoiceListItemDto(row),
    );

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return new InvoiceListResponseDto({
      data: invoiceDtos,
      pagination,
    });
  }

  /**
   * Gets a single invoice by ID with all details
   */
  async findOne(
    userId: string,
    invoiceId: string,
  ): Promise<InvoiceResponseDto> {
    this.logger.debug(`Getting invoice ${invoiceId} for user: ${userId}`);

    // Get invoice
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      this.logger.warn(`Invoice not found: ${invoiceId}`);
      throw new InvoiceNotFoundException(invoiceId);
    }

    // Get invoice items
    const { data: items, error: itemsError } = await this.supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('position', { ascending: true });

    if (itemsError) {
      this.logger.error(`Failed to fetch invoice items: ${itemsError.message}`);
      throw new InternalServerErrorException('Failed to fetch invoice items');
    }

    return this.mapToInvoiceResponseDto(
      invoice as InvoiceRow,
      (items as InvoiceItemRow[]) || [],
    );
  }

  /**
   * Generates the next invoice number based on format and counter
   */
  async getNextNumber(userId: string): Promise<NextInvoiceNumberResponseDto> {
    this.logger.debug(`Getting next invoice number for user: ${userId}`);

    const profile = await this.getUserProfile(userId);

    const format = profile.invoice_number_format || 'FV/{YYYY}/{NNN}';
    const counter = (profile.invoice_number_counter || 0) + 1;

    const nextNumber = this.generateInvoiceNumber(format, counter);

    return new NextInvoiceNumberResponseDto({
      nextNumber,
      format,
      counter,
    });
  }

  /**
   * Creates a new invoice
   */
  async create(
    userId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    this.logger.debug(`Creating invoice for user: ${userId}`, {
      invoiceNumber: dto.invoiceNumber,
    });

    // Validate dates
    this.validateDates(dto.issueDate, dto.dueDate);

    // Check invoice number uniqueness
    await this.checkInvoiceNumberUniqueness(userId, dto.invoiceNumber);

    // Get user profile (seller snapshot)
    const profile = await this.getUserProfile(userId);

    // Validate profile for statuses other than draft
    const status = dto.status || InvoiceStatus.DRAFT;
    if (status !== InvoiceStatus.DRAFT) {
      this.validateProfileForIssuing(profile);
    }

    // Calculate amounts
    const totals = this.calculateTotals(dto.items);

    // Prepare invoice data
    const invoiceData = {
      user_id: userId,
      contractor_id: dto.contractorId || null,
      invoice_number: dto.invoiceNumber,
      issue_date: dto.issueDate,
      due_date: dto.dueDate,
      status: status,
      payment_method: dto.paymentMethod || 'transfer',
      currency: 'PLN',
      notes: dto.notes || null,
      // Seller snapshot
      seller_company_name: profile.company_name || '',
      seller_address: profile.address || '',
      seller_nip: profile.nip || '',
      seller_bank_account: profile.bank_account,
      seller_logo_url: profile.logo_url,
      // Buyer data
      buyer_name: dto.buyer.name,
      buyer_address: dto.buyer.address || null,
      buyer_nip: dto.buyer.nip || null,
      // Amounts
      total_net: totals.totalNet,
      total_vat: totals.totalVat,
      total_gross: totals.totalGross,
    };

    // Insert invoice
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError || !invoice) {
      this.logger.error(`Failed to create invoice: ${invoiceError?.message}`);
      throw new InternalServerErrorException('Failed to create invoice');
    }

    // Insert invoice items
    const itemsData = dto.items.map((item) => ({
      invoice_id: invoice.id,
      position: item.position,
      name: item.name,
      unit: item.unit || 'szt.',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
    }));

    const { data: items, error: itemsError } = await this.supabase
      .from('invoice_items')
      .insert(itemsData)
      .select();

    if (itemsError) {
      this.logger.error(
        `Failed to create invoice items: ${itemsError.message}`,
      );
      // Rollback - delete invoice
      await this.supabase.from('invoices').delete().eq('id', invoice.id);
      throw new InternalServerErrorException('Failed to create invoice items');
    }

    // Update invoice number counter
    await this.incrementInvoiceCounter(userId);

    return this.mapToInvoiceResponseDto(
      invoice as InvoiceRow,
      (items as InvoiceItemRow[]) || [],
    );
  }

  /**
   * Updates an existing invoice
   */
  async update(
    userId: string,
    invoiceId: string,
    dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    this.logger.debug(`Updating invoice ${invoiceId} for user: ${userId}`);

    // Check if invoice exists
    const existingInvoice = await this.findOne(userId, invoiceId);

    // Validate dates (if changed)
    const issueDate = dto.issueDate || existingInvoice.issueDate;
    const dueDate = dto.dueDate || existingInvoice.dueDate;
    this.validateDates(issueDate, dueDate);

    // Check number uniqueness (if changed)
    if (
      dto.invoiceNumber &&
      dto.invoiceNumber !== existingInvoice.invoiceNumber
    ) {
      await this.checkInvoiceNumberUniqueness(
        userId,
        dto.invoiceNumber,
        invoiceId,
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.invoiceNumber !== undefined) {
      updateData.invoice_number = dto.invoiceNumber;
    }
    if (dto.issueDate !== undefined) {
      updateData.issue_date = dto.issueDate;
    }
    if (dto.dueDate !== undefined) {
      updateData.due_date = dto.dueDate;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }
    if (dto.paymentMethod !== undefined) {
      updateData.payment_method = dto.paymentMethod;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    // Update buyer data (if provided)
    if (dto.buyer) {
      if (dto.buyer.name !== undefined) {
        updateData.buyer_name = dto.buyer.name;
      }
      if (dto.buyer.address !== undefined) {
        updateData.buyer_address = dto.buyer.address;
      }
      if (dto.buyer.nip !== undefined) {
        updateData.buyer_nip = dto.buyer.nip;
      }
    }

    // Update invoice items (if provided)
    if (dto.items) {
      const totals = this.calculateTotals(dto.items);
      updateData.total_net = totals.totalNet;
      updateData.total_vat = totals.totalVat;
      updateData.total_gross = totals.totalGross;

      // Delete old items and insert new ones
      await this.supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      const itemsData = dto.items.map((item) => ({
        invoice_id: invoiceId,
        position: item.position,
        name: item.name,
        unit: item.unit || 'szt.',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        vat_rate: item.vatRate,
      }));

      const { error: itemsError } = await this.supabase
        .from('invoice_items')
        .insert(itemsData);

      if (itemsError) {
        this.logger.error(
          `Failed to update invoice items: ${itemsError.message}`,
        );
        throw new InternalServerErrorException(
          'Failed to update invoice items',
        );
      }
    }

    // Update invoice
    const { error: updateError } = await this.supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('user_id', userId);

    if (updateError) {
      this.logger.error(`Failed to update invoice: ${updateError.message}`);
      throw new InternalServerErrorException('Failed to update invoice');
    }

    return this.findOne(userId, invoiceId);
  }

  /**
   * Updates invoice status
   */
  async updateStatus(
    userId: string,
    invoiceId: string,
    dto: UpdateInvoiceStatusDto,
  ): Promise<UpdateInvoiceStatusResponseDto> {
    this.logger.debug(
      `Updating status of invoice ${invoiceId} to ${dto.status}`,
    );

    // Get invoice
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !invoice) {
      throw new InvoiceNotFoundException(invoiceId);
    }

    const currentStatus = invoice.status as InvoiceStatus;
    const newStatus = dto.status;

    // Validate status transition
    this.validateStatusTransition(currentStatus, newStatus);

    // For change to unpaid/paid check profile completeness
    if (newStatus !== InvoiceStatus.DRAFT) {
      const profile = await this.getUserProfile(userId);
      this.validateProfileForIssuing(profile);
    }

    // Update status
    const { error: updateError } = await this.supabase
      .from('invoices')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('user_id', userId);

    if (updateError) {
      this.logger.error(
        `Failed to update invoice status: ${updateError.message}`,
      );
      throw new InternalServerErrorException('Failed to update invoice status');
    }

    return new UpdateInvoiceStatusResponseDto({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Duplicates an existing invoice
   */
  async duplicate(
    userId: string,
    invoiceId: string,
    dto: DuplicateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    this.logger.debug(`Duplicating invoice ${invoiceId} for user: ${userId}`);

    // Get original invoice
    const original = await this.findOne(userId, invoiceId);

    // Determine number for duplicate
    let newInvoiceNumber: string;
    if (dto.invoiceNumber) {
      await this.checkInvoiceNumberUniqueness(userId, dto.invoiceNumber);
      newInvoiceNumber = dto.invoiceNumber;
    } else {
      const nextNumber = await this.getNextNumber(userId);
      newInvoiceNumber = nextNumber.nextNumber;
    }

    // Prepare data for new invoice
    const today = new Date().toISOString().split('T')[0];
    const createDto: CreateInvoiceDto = {
      invoiceNumber: newInvoiceNumber,
      issueDate: today,
      dueDate: today, // Default to same date
      status: InvoiceStatus.DRAFT,
      paymentMethod: original.paymentMethod as any,
      notes: original.notes || undefined,
      contractorId: original.contractorId || undefined,
      buyer: {
        name: original.buyer.name,
        address: original.buyer.address || undefined,
        nip: original.buyer.nip || undefined,
      },
      items: original.items.map((item, index) => ({
        position: index + 1,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate as any,
      })),
    };

    return this.create(userId, createDto);
  }

  /**
   * Soft deletes an invoice
   */
  async remove(userId: string, invoiceId: string): Promise<void> {
    this.logger.debug(`Soft deleting invoice ${invoiceId} for user: ${userId}`);

    // Check if invoice exists
    await this.findOne(userId, invoiceId);

    const { error } = await this.supabase
      .from('invoices')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to delete invoice: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete invoice');
    }

    this.logger.log(`Invoice ${invoiceId} soft deleted successfully`);
  }

  // ==================== Helper methods ====================

  /**
   * Gets user profile
   */
  private async getUserProfile(userId: string): Promise<UserProfileRow> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      this.logger.error(`Failed to fetch user profile: ${error?.message}`);
      throw new InternalServerErrorException('Failed to fetch user profile');
    }

    return data as UserProfileRow;
  }

  /**
   * Validates invoice dates
   */
  private validateDates(issueDate: string, dueDate: string): void {
    const issue = new Date(issueDate);
    const due = new Date(dueDate);

    if (due < issue) {
      throw new InvalidDatesException();
    }
  }

  /**
   * Checks invoice number uniqueness
   */
  private async checkInvoiceNumberUniqueness(
    userId: string,
    invoiceNumber: string,
    excludeInvoiceId?: string,
  ): Promise<void> {
    let query = this.supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('invoice_number', invoiceNumber)
      .is('deleted_at', null);

    if (excludeInvoiceId) {
      query = query.neq('id', excludeInvoiceId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Failed to check invoice number: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to validate invoice number',
      );
    }

    if (data && data.length > 0) {
      throw new InvoiceNumberExistsException(invoiceNumber);
    }
  }

  /**
   * Validates profile completeness for issuing an invoice
   */
  private validateProfileForIssuing(profile: UserProfileRow): void {
    if (!profile.company_name || !profile.address || !profile.nip) {
      throw new IncompleteProfileException();
    }
  }

  /**
   * Validates status transition
   */
  private validateStatusTransition(
    currentStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
  ): void {
    // Allowed transitions:
    // draft -> unpaid, paid
    // unpaid -> paid, draft
    // paid -> unpaid
    const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.UNPAID, InvoiceStatus.PAID],
      [InvoiceStatus.UNPAID]: [InvoiceStatus.PAID, InvoiceStatus.DRAFT],
      [InvoiceStatus.PAID]: [InvoiceStatus.UNPAID],
    };

    if (currentStatus === newStatus) {
      return; // No change
    }

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidStatusTransitionException(currentStatus, newStatus);
    }
  }

  /**
   * Calculates totals for invoice items
   */
  private calculateTotals(items: InvoiceItemRequestDto[]): {
    totalNet: string;
    totalVat: string;
    totalGross: string;
  } {
    let totalNet = 0;
    let totalVat = 0;

    for (const item of items) {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const vatRate = VAT_RATES[item.vatRate] || 0;

      const netAmount = quantity * unitPrice;
      const vatAmount = netAmount * vatRate;

      totalNet += netAmount;
      totalVat += vatAmount;
    }

    const totalGross = totalNet + totalVat;

    return {
      totalNet: totalNet.toFixed(2),
      totalVat: totalVat.toFixed(2),
      totalGross: totalGross.toFixed(2),
    };
  }

  /**
   * Generates invoice number based on format
   */
  private generateInvoiceNumber(format: string, counter: number): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    // Format counter with appropriate number of zeros
    const counterMatch = format.match(/\{N+\}/);
    let paddedCounter = counter.toString();
    if (counterMatch) {
      const nCount = counterMatch[0].length - 2; // Subtract { and }
      paddedCounter = counter.toString().padStart(nCount, '0');
    }

    return format
      .replace('{YYYY}', year)
      .replace('{YY}', year.slice(-2))
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace(/\{N+\}/, paddedCounter);
  }

  /**
   * Increments invoice number counter
   */
  private async incrementInvoiceCounter(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_invoice_counter', {
      p_user_id: userId,
    });

    // If RPC doesn't exist, use standard update
    if (error) {
      const profile = await this.getUserProfile(userId);
      await this.supabase
        .from('user_profiles')
        .update({
          invoice_number_counter: (profile.invoice_number_counter || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }

  /**
   * Calculates amounts for a single item
   */
  private calculateItemAmounts(item: InvoiceItemRow): {
    netAmount: string;
    vatAmount: string;
    grossAmount: string;
  } {
    const quantity = parseFloat(item.quantity);
    const unitPrice = parseFloat(item.unit_price);
    const vatRate = VAT_RATES[item.vat_rate] || 0;

    const netAmount = quantity * unitPrice;
    const vatAmount = netAmount * vatRate;
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount: netAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      grossAmount: grossAmount.toFixed(2),
    };
  }

  // ==================== DTO Mapping ====================

  /**
   * Maps invoice record to list DTO
   */
  private mapToInvoiceListItemDto(row: InvoiceRow): InvoiceListItemDto {
    return new InvoiceListItemDto({
      id: row.id,
      invoiceNumber: row.invoice_number,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      status: row.status as InvoiceStatus,
      buyerName: row.buyer_name,
      buyerNip: row.buyer_nip,
      totalNet: row.total_net,
      totalVat: row.total_vat,
      totalGross: row.total_gross,
      currency: row.currency as any,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Maps invoice record with items to full DTO
   */
  private mapToInvoiceResponseDto(
    row: InvoiceRow,
    items: InvoiceItemRow[],
  ): InvoiceResponseDto {
    const seller = new SellerInfoDto({
      companyName: row.seller_company_name,
      address: row.seller_address,
      nip: row.seller_nip,
      bankAccount: row.seller_bank_account,
      logoUrl: row.seller_logo_url,
    });

    const buyer = new BuyerInfoDto({
      name: row.buyer_name,
      address: row.buyer_address,
      nip: row.buyer_nip,
    });

    const itemDtos = items.map((item) => {
      const amounts = this.calculateItemAmounts(item);
      return new InvoiceItemResponseDto({
        id: item.id,
        position: item.position,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate as any,
        netAmount: amounts.netAmount,
        vatAmount: amounts.vatAmount,
        grossAmount: amounts.grossAmount,
      });
    });

    return new InvoiceResponseDto({
      id: row.id,
      invoiceNumber: row.invoice_number,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      status: row.status as InvoiceStatus,
      paymentMethod: row.payment_method as any,
      currency: row.currency as any,
      notes: row.notes,
      seller,
      buyer,
      items: itemDtos,
      totalNet: row.total_net,
      totalVat: row.total_vat,
      totalGross: row.total_gross,
      contractorId: row.contractor_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
