/**
 * Example unit test to verify Jest configuration
 * This file demonstrates how to write tests in NestJS
 */
import { Test, TestingModule } from '@nestjs/testing';

describe('Jest Configuration', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should create a testing module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should have access to mock utilities', () => {
    const mockFn = jest.fn().mockReturnValue('mocked');
    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
