/**
 * Jest setup file for NestJS backend testing
 * This file runs after the test framework is installed but before tests are executed
 */

// Extend Jest matchers if needed
// import '@testing-library/jest-dom';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Global test timeout (optional - increase for slow tests)
jest.setTimeout(10000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console output during tests
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
