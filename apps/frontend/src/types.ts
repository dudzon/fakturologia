/**
 * DTO and Command Model Types for Fakturologia MVP
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used for API communication, derived from the database schema and API plan.
 */

import type { Database } from '@fakturologia/shared';

// =============================================================================
// Database Type Aliases
// =============================================================================

/** Database table row types */
type DbUserProfile = Database['public']['Tables']['user_profiles']['Row'];
type DbContractor = Database['public']['Tables']['contractors']['Row'];
type DbInvoice = Database['public']['Tables']['invoices']['Row'];
type DbInvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

/** Database enum types */
type DbInvoiceStatus = Database['public']['Enums']['invoice_status'];

// =============================================================================
// Common Types
// =============================================================================

/** Invoice status enum aligned with database */
export type InvoiceStatus = DbInvoiceStatus;

/** VAT rate values allowed in the system */
export type VatRate = '23' | '8' | '5' | '0' | 'zw';

/** Payment method options */
export type PaymentMethod = 'transfer' | 'cash' | 'card';

/** Currency code (ISO 4217) */
export type Currency = 'PLN' | 'EUR' | 'USD';

/** Pagination information for list responses */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Basic user info returned with auth responses */
export interface UserInfo {
  id: string;
  email: string;
}

/** Field-level validation error */
export interface FieldError {
  field: string;
  message: string;
}

/** Standard API error response format */
export interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
}

/** Generic message response */
export interface MessageResponse {
  message: string;
}

// =============================================================================
// Authentication DTOs
// =============================================================================

/** POST /api/v1/auth/register - Request */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** POST /api/v1/auth/register - Response */
export interface RegisterResponse {
  message: string;
  userId: string;
}

/** POST /api/v1/auth/login - Request */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/v1/auth/login - Response */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

/** POST /api/v1/auth/logout - Response */
export type LogoutResponse = MessageResponse;

/** POST /api/v1/auth/refresh - Request */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** POST /api/v1/auth/refresh - Response */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** POST /api/v1/auth/forgot-password - Request */
export interface ForgotPasswordRequest {
  email: string;
}

/** POST /api/v1/auth/forgot-password - Response */
export type ForgotPasswordResponse = MessageResponse;

/** POST /api/v1/auth/reset-password - Request */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/** POST /api/v1/auth/reset-password - Response */
export type ResetPasswordResponse = MessageResponse;

// =============================================================================
// User Profile DTOs
// =============================================================================

/**
 * GET /api/v1/users/profile - Response
 *
 * User profile with company data, derived from user_profiles table.
 * Extends database fields with email from auth.users.
 */
export interface UserProfileResponse {
  id: DbUserProfile['id'];
  email: string; // From auth.users, not in user_profiles table
  companyName: DbUserProfile['company_name'];
  address: DbUserProfile['address'];
  nip: DbUserProfile['nip'];
  bankAccount: DbUserProfile['bank_account'];
  logoUrl: DbUserProfile['logo_url'];
  invoiceNumberFormat: DbUserProfile['invoice_number_format'];
  invoiceNumberCounter: DbUserProfile['invoice_number_counter'];
  createdAt: DbUserProfile['created_at'];
  updatedAt: DbUserProfile['updated_at'];
}

/**
 * PUT /api/v1/users/profile - Request
 *
 * Command model for updating user profile.
 * All fields are optional for partial updates.
 */
export interface UpdateUserProfileCommand {
  companyName?: string;
  address?: string;
  nip?: string;
  bankAccount?: string;
  invoiceNumberFormat?: string;
}

/** POST /api/v1/users/profile/logo - Response */
export interface UploadLogoResponse {
  logoUrl: string;
}

/** DELETE /api/v1/users/profile/logo - Response */
export type DeleteLogoResponse = MessageResponse;

// =============================================================================
// Contractor DTOs
// =============================================================================

/**
 * Contractor response DTO
 *
 * Maps database contractor row to API response format.
 * Used for single contractor and list item responses.
 */
export interface ContractorResponse {
  id: DbContractor['id'];
  name: DbContractor['name'];
  address: DbContractor['address'];
  nip: DbContractor['nip'];
  createdAt: DbContractor['created_at'];
  updatedAt: DbContractor['updated_at'];
}

/** GET /api/v1/contractors - Response */
export interface ContractorListResponse {
  data: ContractorResponse[];
  pagination: PaginationInfo;
}

/** GET /api/v1/contractors - Query parameters */
export interface ContractorListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * POST /api/v1/contractors - Request
 *
 * Command model for creating a new contractor.
 */
export interface CreateContractorCommand {
  name: string;
  address?: string;
  nip?: string;
}

/**
 * PUT /api/v1/contractors/:id - Request
 *
 * Command model for updating an existing contractor.
 * All fields are optional for partial updates.
 */
export interface UpdateContractorCommand {
  name?: string;
  address?: string;
  nip?: string;
}

/** DELETE /api/v1/contractors/:id - Response */
export type DeleteContractorResponse = MessageResponse;

// =============================================================================
// Invoice DTOs - Nested Types
// =============================================================================

/**
 * Seller information snapshot on invoice.
 *
 * Copied from user_profiles at invoice creation time
 * to preserve historical data integrity.
 */
export interface SellerInfo {
  companyName: DbInvoice['seller_company_name'];
  address: DbInvoice['seller_address'];
  nip: DbInvoice['seller_nip'];
  bankAccount: DbInvoice['seller_bank_account'];
  logoUrl: DbInvoice['seller_logo_url'];
}

/**
 * Buyer information snapshot on invoice.
 *
 * Copied from contractor or entered manually at invoice creation
 * to preserve historical data integrity.
 */
export interface BuyerInfo {
  name: DbInvoice['buyer_name'];
  address: DbInvoice['buyer_address'];
  nip: DbInvoice['buyer_nip'];
}

/**
 * Invoice item response DTO.
 *
 * Includes calculated amounts (net, VAT, gross) computed server-side.
 */
export interface InvoiceItemResponse {
  id: DbInvoiceItem['id'];
  position: DbInvoiceItem['position'];
  name: DbInvoiceItem['name'];
  unit: DbInvoiceItem['unit'];
  /** Quantity as string for precision (e.g., "10.00") */
  quantity: string;
  /** Unit price as string for precision (e.g., "100.00") */
  unitPrice: string;
  vatRate: VatRate;
  /** Calculated: quantity × unitPrice */
  netAmount: string;
  /** Calculated: netAmount × vatRate (0 for 'zw') */
  vatAmount: string;
  /** Calculated: netAmount + vatAmount */
  grossAmount: string;
}

/**
 * Invoice item request DTO for creating/updating invoices.
 *
 * Amounts are calculated server-side, so only input values are required.
 */
export interface InvoiceItemRequest {
  /** Optional ID for existing items during update */
  id?: string;
  position: number;
  name: string;
  unit?: string;
  /** Quantity as string for precision */
  quantity: string;
  /** Unit price as string for precision */
  unitPrice: string;
  vatRate: VatRate;
}

/**
 * Buyer information for invoice creation/update.
 *
 * Can be populated from contractor or entered manually.
 */
export interface BuyerInfoRequest {
  name: string;
  address?: string;
  nip?: string;
}

// =============================================================================
// Invoice DTOs - List and Detail
// =============================================================================

/**
 * Invoice list item DTO.
 *
 * Condensed view for list display without full details.
 */
export interface InvoiceListItem {
  id: DbInvoice['id'];
  invoiceNumber: DbInvoice['invoice_number'];
  issueDate: DbInvoice['issue_date'];
  dueDate: DbInvoice['due_date'];
  status: InvoiceStatus;
  buyerName: DbInvoice['buyer_name'];
  buyerNip: DbInvoice['buyer_nip'];
  /** Total net amount as string for precision */
  totalNet: string;
  /** Total VAT amount as string for precision */
  totalVat: string;
  /** Total gross amount as string for precision */
  totalGross: string;
  currency: Currency;
  createdAt: DbInvoice['created_at'];
  updatedAt: DbInvoice['updated_at'];
}

/** GET /api/v1/invoices - Response */
export interface InvoiceListResponse {
  data: InvoiceListItem[];
  pagination: PaginationInfo;
}

/** GET /api/v1/invoices - Query parameters */
export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  search?: string;
  dateFrom?: string; // ISO date format YYYY-MM-DD
  dateTo?: string; // ISO date format YYYY-MM-DD
  sortBy?: 'invoiceNumber' | 'issueDate' | 'dueDate' | 'totalGross' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * GET /api/v1/invoices/:id - Response
 *
 * Full invoice details including seller, buyer, and items.
 */
export interface InvoiceResponse {
  id: DbInvoice['id'];
  invoiceNumber: DbInvoice['invoice_number'];
  issueDate: DbInvoice['issue_date'];
  dueDate: DbInvoice['due_date'];
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  currency: Currency;
  notes: DbInvoice['notes'];
  seller: SellerInfo;
  buyer: BuyerInfo;
  items: InvoiceItemResponse[];
  /** Total net amount as string for precision */
  totalNet: string;
  /** Total VAT amount as string for precision */
  totalVat: string;
  /** Total gross amount as string for precision */
  totalGross: string;
  contractorId: DbInvoice['contractor_id'];
  createdAt: DbInvoice['created_at'];
  updatedAt: DbInvoice['updated_at'];
}

/** GET /api/v1/invoices/next-number - Response */
export interface NextInvoiceNumberResponse {
  nextNumber: string;
  format: string;
  counter: number;
}

// =============================================================================
// Invoice Command Models
// =============================================================================

/**
 * POST /api/v1/invoices - Request
 *
 * Command model for creating a new invoice.
 * Seller data is automatically snapshotted from user profile.
 */
export interface CreateInvoiceCommand {
  invoiceNumber: string;
  issueDate: string; // ISO date format YYYY-MM-DD
  dueDate: string; // ISO date format YYYY-MM-DD
  status?: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  /** Optional link to contractor record */
  contractorId?: string;
  buyer: BuyerInfoRequest;
  items: InvoiceItemRequest[];
}

/**
 * PUT /api/v1/invoices/:id - Request
 *
 * Command model for updating an existing invoice.
 * Items without ID are created; existing items not in list are deleted.
 */
export interface UpdateInvoiceCommand {
  invoiceNumber?: string;
  issueDate?: string; // ISO date format YYYY-MM-DD
  dueDate?: string; // ISO date format YYYY-MM-DD
  status?: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  buyer?: BuyerInfoRequest;
  items?: InvoiceItemRequest[];
}

/**
 * PATCH /api/v1/invoices/:id/status - Request
 *
 * Command model for updating only the invoice status.
 */
export interface UpdateInvoiceStatusCommand {
  status: InvoiceStatus;
}

/** PATCH /api/v1/invoices/:id/status - Response */
export interface UpdateInvoiceStatusResponse {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  updatedAt: string;
}

/**
 * POST /api/v1/invoices/:id/duplicate - Request
 *
 * Command model for duplicating an invoice.
 * If invoiceNumber not provided, next available number is used.
 */
export interface DuplicateInvoiceCommand {
  invoiceNumber?: string;
}

/** DELETE /api/v1/invoices/:id - Response */
export type DeleteInvoiceResponse = MessageResponse;

// =============================================================================
// API Error Codes
// =============================================================================

/**
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_REFRESH_TOKEN'
  | 'INVALID_TOKEN'
  | 'UNAUTHORIZED';

/**
 * Profile error codes
 */
export type ProfileErrorCode =
  | 'PROFILE_NOT_FOUND'
  | 'INVALID_NIP'
  | 'INVALID_IBAN'
  | 'INVALID_NUMBER_FORMAT'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'LOGO_NOT_FOUND';

/**
 * Contractor error codes
 */
export type ContractorErrorCode =
  | 'CONTRACTOR_NOT_FOUND'
  | 'INVALID_NIP'
  | 'NAME_REQUIRED'
  | 'NIP_EXISTS';

/**
 * Invoice error codes
 */
export type InvoiceErrorCode =
  | 'INVOICE_NOT_FOUND'
  | 'INVOICE_NUMBER_REQUIRED'
  | 'INVALID_DATES'
  | 'ITEMS_REQUIRED'
  | 'INVALID_VAT_RATE'
  | 'INVALID_BUYER_NIP'
  | 'INCOMPLETE_PROFILE'
  | 'INVOICE_NUMBER_EXISTS'
  | 'INVALID_STATUS'
  | 'INCOMPLETE_INVOICE';

/**
 * All API error codes union type
 */
export type ApiErrorCode =
  | AuthErrorCode
  | ProfileErrorCode
  | ContractorErrorCode
  | InvoiceErrorCode;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if a value is a valid InvoiceStatus
 */
export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return value === 'draft' || value === 'unpaid' || value === 'paid';
}

/**
 * Type guard to check if a value is a valid VatRate
 */
export function isVatRate(value: unknown): value is VatRate {
  return value === '23' || value === '8' || value === '5' || value === '0' || value === 'zw';
}

/**
 * Type guard to check if response is an error response
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'statusCode' in response &&
    'code' in response &&
    'message' in response
  );
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Utility type for API responses that can be either success or error
 */
export type ApiResponse<T> = T | ErrorResponse;

/**
 * Utility type for paginated responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Utility type to extract non-nullable fields from a type
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Utility type for creating form state from command models
 * (makes all fields optional and allows undefined)
 */
export type FormState<T> = {
  [K in keyof T]?: T[K] | undefined;
};
