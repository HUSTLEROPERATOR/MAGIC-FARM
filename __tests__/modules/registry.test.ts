import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerModule,
  getModule,
  getAllModules,
  executeModule,
  _resetRegistryForTesting,
} from '@/lib/modules/registry';
import type { MagicModuleHandler, ModuleContext } from '@/lib/modules/types';

const mockHandler: MagicModuleHandler<{ configVersion: number }, { choice: string }> = {
  key: 'TEST_MODULE',
  meta: {
    name: 'Test',
    description: 'Test module',
    icon: 'Sparkles',
    difficulty: 'base',
    scope: 'user',
    priority: 10,
  },
  defaultConfig: { configVersion: 1 },
  validateConfig: (c: unknown) => {
    const obj = c as Record<string, unknown>;
    if (obj.configVersion !== 1) throw new Error('invalid config');
    return obj as { configVersion: number };
  },
  validateInput: (i: unknown) => {
    const obj = i as Record<string, unknown>;
    if (typeof obj.choice !== 'string') throw new Error('invalid input');
    return obj as { choice: string };
  },
  isAvailable: async () => true,
  run: async (_ctx, _cfg, input) => ({
    success: true,
    data: { picked: input.choice },
    audit: { scoreDelta: 10 },
  }),
};

describe('Module Registry', () => {
  beforeEach(() => {
    _resetRegistryForTesting();
  });

  it('registers and retrieves a module', () => {
    registerModule(mockHandler);
    expect(getModule('TEST_MODULE')).toBe(mockHandler);
  });

  it('returns undefined for unknown module', () => {
    expect(getModule('UNKNOWN')).toBeUndefined();
  });

  it('lists all registered modules', () => {
    registerModule(mockHandler);
    expect(getAllModules()).toHaveLength(1);
  });

  it('throws on duplicate registration', () => {
    registerModule(mockHandler);
    expect(() => registerModule(mockHandler)).toThrow();
  });

  it('executeModule returns success for valid input', async () => {
    registerModule(mockHandler);
    const ctx: ModuleContext = { eventNightId: 'evt1', roundId: 'r1' };
    const result = await executeModule('TEST_MODULE', ctx, { configVersion: 1 }, { choice: 'red' });
    expect(result.success).toBe(true);
    expect(result.data?.picked).toBe('red');
  });

  it('executeModule returns VALIDATION_ERROR for bad config', async () => {
    registerModule(mockHandler);
    const ctx: ModuleContext = { eventNightId: 'evt1' };
    const result = await executeModule('TEST_MODULE', ctx, { configVersion: 99 }, undefined);
    expect(result.success).toBe(false);
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('executeModule returns error for unknown module', async () => {
    const ctx: ModuleContext = { eventNightId: 'evt1' };
    const result = await executeModule('NOPE', ctx, {}, undefined);
    expect(result.success).toBe(false);
    expect(result.code).toBe('VALIDATION_ERROR');
  });
});
