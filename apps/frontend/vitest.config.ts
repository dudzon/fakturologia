/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@env': resolve(__dirname, './src/environments'),
      '@shared': resolve(__dirname, './src/app/shared'),
      '@core': resolve(__dirname, './src/app/core'),
      '@features': resolve(__dirname, './src/app/features'),
      '@services': resolve(__dirname, './src/app/services'),
      '@stores': resolve(__dirname, './src/app/stores'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    css: false,
    reporters: ['default'],
    // Coverage configuration - run with: npm run test:unit:cov
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.mock.ts',
        'src/app/**/index.ts',
        'src/app/**/*.routes.ts',
        'src/app/**/*.config.ts',
        'src/main.ts',
        'src/app/testing/**',
      ],
      thresholds: {
        // Minimum coverage thresholds - adjust as project grows
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
    // Type checking
    typecheck: {
      enabled: false, // Enable when needed: npm run test:unit -- --typecheck
    },
  },
});
