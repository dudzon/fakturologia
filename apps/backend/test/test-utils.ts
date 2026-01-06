/**
 * Test Utilities for NestJS Backend
 * Common testing utilities, mock factories, and helpers
 */
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      admin: {
        getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: jest.fn().mockResolvedValue({ data: Buffer.from('test'), error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test.com/image.png' } }),
      }),
    },
  };
}

/**
 * Creates a mock ExecutionContext for testing guards and interceptors
 */
export function createMockExecutionContext(
  request: Partial<Request> = {},
  user: any = null
): ExecutionContext {
  const mockRequest = {
    headers: {},
    user,
    ...request,
  };

  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

/**
 * Creates a mock CallHandler for testing interceptors
 */
export function createMockCallHandler(returnValue: any = {}): CallHandler {
  return {
    handle: jest.fn().mockReturnValue(of(returnValue)),
  };
}

/**
 * Creates a base testing module with common imports
 */
export function createTestingModuleBuilder(): TestingModuleBuilder {
  return Test.createTestingModule({
    providers: [],
  });
}

/**
 * Factory for creating test user data
 */
export const testUserFactory = {
  create: (overrides: Partial<TestUser> = {}): TestUser => ({
    id: 'test-user-id-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

/**
 * Factory for creating test user profile data
 */
export const testUserProfileFactory = {
  create: (overrides: Partial<TestUserProfile> = {}): TestUserProfile => ({
    id: 'test-user-id',
    company_name: 'Test Company',
    company_address: 'Test Address 123, 00-001 Warsaw',
    nip: '1234567890',
    bank_account: 'PL61109010140000071219812874',
    invoice_number_format: 'FV/{YYYY}/{MM}/{NNN}',
    logo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};

/**
 * Factory for creating test contractor data
 */
export const testContractorFactory = {
  create: (overrides: Partial<TestContractor> = {}): TestContractor => ({
    id: 'test-contractor-id-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    name: 'Test Contractor',
    address: 'Contractor Address 456, 00-002 Warsaw',
    nip: '9876543210',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createMany: (count: number, userId: string = 'test-user-id'): TestContractor[] =>
    Array.from({ length: count }, (_, i) =>
      testContractorFactory.create({
        id: `test-contractor-${i}`,
        user_id: userId,
        name: `Contractor ${i + 1}`,
      })
    ),
};

/**
 * Factory for creating test invoice data
 */
export const testInvoiceFactory = {
  create: (overrides: Partial<TestInvoice> = {}): TestInvoice => ({
    id: 'test-invoice-id-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    contractor_id: 'test-contractor-id',
    invoice_number: 'FV/2026/01/001',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};

/**
 * Factory for creating test invoice item data
 */
export const testInvoiceItemFactory = {
  create: (overrides: Partial<TestInvoiceItem> = {}): TestInvoiceItem => ({
    id: 'test-item-id-' + Math.random().toString(36).substr(2, 9),
    invoice_id: 'test-invoice-id',
    name: 'Test Service',
    quantity: 1,
    unit_price: 100,
    vat_rate: 23,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMany: (count: number, invoiceId: string = 'test-invoice-id'): TestInvoiceItem[] =>
    Array.from({ length: count }, (_, i) =>
      testInvoiceItemFactory.create({
        id: `test-item-${i}`,
        invoice_id: invoiceId,
        name: `Service ${i + 1}`,
        unit_price: 100 * (i + 1),
      })
    ),
};

// Type definitions for test data
export interface TestUser {
  id: string;
  email: string;
  created_at: string;
}

export interface TestUserProfile {
  id: string;
  company_name: string;
  company_address: string;
  nip: string;
  bank_account: string;
  invoice_number_format: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestContractor {
  id: string;
  user_id: string;
  name: string;
  address: string;
  nip: string;
  created_at: string;
  updated_at: string;
}

export interface TestInvoice {
  id: string;
  user_id: string;
  contractor_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'issued' | 'paid';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TestInvoiceItem {
  id: string;
  invoice_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  created_at: string;
}
