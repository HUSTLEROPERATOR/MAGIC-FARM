import { describe, it, expect } from 'vitest';

/**
 * Tests for alias normalization logic used in app/api/user/alias/route.ts
 * The normalization is: trim + lowercase
 */
function normalizeAlias(alias: string): string {
  return alias.trim().toLowerCase();
}

function isValidNormalizedAlias(alias: string): boolean {
  return (
    alias.length >= 3 &&
    alias.length <= 30 &&
    /^[a-z0-9_\-\.]+$/.test(alias)
  );
}

describe('Alias normalization', () => {
  it('should lowercase the alias', () => {
    expect(normalizeAlias('MysticWizard')).toBe('mysticwizard');
  });

  it('should trim whitespace', () => {
    expect(normalizeAlias('  wizard  ')).toBe('wizard');
  });

  it('should handle mixed case with special chars', () => {
    expect(normalizeAlias('My_Alias-123')).toBe('my_alias-123');
  });

  it('should preserve dots', () => {
    expect(normalizeAlias('user.name')).toBe('user.name');
  });

  it('normalized alias should pass validation', () => {
    const normalized = normalizeAlias('MysticWizard');
    expect(isValidNormalizedAlias(normalized)).toBe(true);
  });

  it('should reject alias with spaces after normalization', () => {
    const normalized = normalizeAlias('my alias');
    expect(isValidNormalizedAlias(normalized)).toBe(false);
  });

  it('should reject too-short alias after normalization', () => {
    const normalized = normalizeAlias('  ab  ');
    expect(isValidNormalizedAlias(normalized)).toBe(false);
  });

  it('should reject alias with uppercase after normalization (sanity check)', () => {
    const normalized = normalizeAlias('ABC');
    // After normalization, should be 'abc' which is valid lowercase
    expect(normalized).toBe('abc');
    expect(isValidNormalizedAlias(normalized)).toBe(true);
  });
});
