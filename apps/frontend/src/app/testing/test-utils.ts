/**
 * Test Utilities for Angular Frontend
 * Common testing utilities, mock factories, and helpers
 */
import { signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { session: null, user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://test.com/image.png' } }),
      }),
    },
  };
}

/**
 * Creates a mock Router for testing
 */
export function createMockRouter() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true),
    events: {
      pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    },
    url: '/',
    routerState: { snapshot: { url: '/' } },
  };
}

/**
 * Creates a mock ActivatedRoute for testing
 */
export function createMockActivatedRoute(params: Record<string, string> = {}) {
  return {
    params: { subscribe: vi.fn((cb) => cb(params)) },
    queryParams: { subscribe: vi.fn((cb) => cb({})) },
    snapshot: {
      params,
      queryParams: {},
      data: {},
    },
  };
}

/**
 * Create a writable signal for testing
 */
export function createTestSignal<T>(initialValue: T): WritableSignal<T> {
  return signal(initialValue);
}

/**
 * Factory for creating test user data
 */
export const testUserFactory = {
  create: (overrides: Partial<TestUser> = {}): TestUser => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

/**
 * Factory for creating test contractor data
 */
export const testContractorFactory = {
  create: (overrides: Partial<TestContractor> = {}): TestContractor => ({
    id: 'test-contractor-id',
    user_id: 'test-user-id',
    name: 'Test Contractor',
    address: 'Test Address 123',
    nip: '1234567890',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMany: (count: number): TestContractor[] =>
    Array.from({ length: count }, (_, i) =>
      testContractorFactory.create({
        id: `test-contractor-${i}`,
        name: `Contractor ${i + 1}`,
      }),
    ),
};

/**
 * Factory for creating test invoice data
 */
export const testInvoiceFactory = {
  create: (overrides: Partial<TestInvoice> = {}): TestInvoice => ({
    id: 'test-invoice-id',
    user_id: 'test-user-id',
    contractor_id: 'test-contractor-id',
    invoice_number: 'FV/2026/01/001',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    created_at: new Date().toISOString(),
    items: [],
    ...overrides,
  }),
};

/**
 * Factory for creating test invoice items
 */
export const testInvoiceItemFactory = {
  create: (overrides: Partial<TestInvoiceItem> = {}): TestInvoiceItem => ({
    id: 'test-item-id',
    invoice_id: 'test-invoice-id',
    name: 'Test Service',
    quantity: 1,
    unit_price: 100,
    vat_rate: 23,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

// Type definitions for test data
export interface TestUser {
  id: string;
  email: string;
  created_at: string;
}

export interface TestContractor {
  id: string;
  user_id: string;
  name: string;
  address: string;
  nip: string;
  created_at: string;
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
  items: TestInvoiceItem[];
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
