/**
 * Angular Testing Library Utilities
 * Wrapper functions for @testing-library/angular with common configurations
 */
import { Type, Provider } from '@angular/core';
import { render, RenderResult, RenderComponentOptions } from '@testing-library/angular';
import { createMockSupabaseClient, createMockRouter } from './test-utils';
import { Router } from '@angular/router';

/**
 * Render a component with common providers and configurations
 */
export async function renderComponent<T>(
  component: Type<T>,
  options: RenderComponentOptions<T> = {}
): Promise<RenderResult<T>> {
  const defaultProviders: Provider[] = [
    { provide: Router, useValue: createMockRouter() },
    // Add more common providers as needed
  ];

  return render(component, {
    ...options,
    providers: [...defaultProviders, ...(options.providers ?? [])],
  });
}

/**
 * Render a component with mock Supabase client
 */
export async function renderWithSupabase<T>(
  component: Type<T>,
  options: RenderComponentOptions<T> = {}
): Promise<RenderResult<T> & { supabaseMock: ReturnType<typeof createMockSupabaseClient> }> {
  const supabaseMock = createMockSupabaseClient();

  const result = await renderComponent(component, {
    ...options,
    providers: [
      // Add Supabase provider mock here when implemented
      ...(options.providers ?? []),
    ],
  });

  return { ...result, supabaseMock };
}

/**
 * Re-export commonly used testing library functions
 */
export { screen, fireEvent, waitFor, within } from '@testing-library/angular';
export { userEvent } from '@testing-library/user-event';
