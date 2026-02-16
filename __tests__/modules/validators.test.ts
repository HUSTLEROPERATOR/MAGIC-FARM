import { describe, it, expect } from 'vitest';
import { validateBaseConfig } from '@/lib/modules/validators';

describe('validateBaseConfig', () => {
  it('passes with valid configVersion', () => {
    const result = validateBaseConfig({ configVersion: 1 });
    expect(result).toEqual({ configVersion: 1 });
  });

  it('fails without configVersion', () => {
    expect(() => validateBaseConfig({})).toThrow();
  });

  it('fails with non-number configVersion', () => {
    expect(() => validateBaseConfig({ configVersion: 'one' })).toThrow();
  });

  it('fails with configVersion < 1', () => {
    expect(() => validateBaseConfig({ configVersion: 0 })).toThrow();
  });

  it('passes through extra fields', () => {
    const result = validateBaseConfig({ configVersion: 1, extra: 'value' });
    expect(result.configVersion).toBe(1);
  });
});
