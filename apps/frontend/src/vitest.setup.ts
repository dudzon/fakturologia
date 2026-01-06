/**
 * Vitest setup file for Angular testing
 * This file runs before each test file
 *
 * IMPORTANT: Import order matters - zone and testbed must be initialized first
 */

// 1. First import zone.js setup
import '@analogjs/vitest-angular/setup-zone';

// 2. Import compiler for JIT compilation BEFORE anything else
import '@angular/compiler';

// 3. Setup TestBed for Angular testing
import '@angular/platform-browser-dynamic/testing';
import { TestBed } from '@angular/core/testing';
TestBed.initTestEnvironment();

// 4. Then setup @analogjs/vitest-angular TestBed
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
setupTestBed({ zoneless: false });

// 5. Now import other testing utilities
import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

// 6. Add matchMedia polyfill for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Global test utilities
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

// Note: happy-dom provides built-in implementations of:
// - window.matchMedia
// - IntersectionObserver
// - ResizeObserver
// No manual mocking required!
