import { describe, it, expect } from 'vitest';
import { registerSchema, aliasSchema } from '@/lib/validations/schemas';

describe('registerSchema (onboarding validation)', () => {
  it('should pass with valid complete data', () => {
    const result = registerSchema.safeParse({
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario@example.com',
      privacyAccepted: true,
      marketingOptIn: false,
    });
    expect(result.success).toBe(true);
  });

  it('should fail if firstName is empty', () => {
    const result = registerSchema.safeParse({
      firstName: '',
      lastName: 'Rossi',
      email: 'mario@example.com',
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('should fail if lastName is empty', () => {
    const result = registerSchema.safeParse({
      firstName: 'Mario',
      lastName: '',
      email: 'mario@example.com',
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('should fail if privacyAccepted is false', () => {
    const result = registerSchema.safeParse({
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario@example.com',
      privacyAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it('should fail if email is invalid', () => {
    const result = registerSchema.safeParse({
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'not-an-email',
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('should pass without marketingOptIn (optional)', () => {
    const result = registerSchema.safeParse({
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario@example.com',
      privacyAccepted: true,
    });
    expect(result.success).toBe(true);
  });

  it('should fail if firstName exceeds max length', () => {
    const result = registerSchema.safeParse({
      firstName: 'A'.repeat(101),
      lastName: 'Rossi',
      email: 'mario@example.com',
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('aliasSchema', () => {
  it('should pass with valid alias', () => {
    const result = aliasSchema.safeParse({ alias: 'MysticWizard' });
    expect(result.success).toBe(true);
  });

  it('should pass with underscores and hyphens', () => {
    const result = aliasSchema.safeParse({ alias: 'my_alias-123' });
    expect(result.success).toBe(true);
  });

  it('should fail if alias is too short', () => {
    const result = aliasSchema.safeParse({ alias: 'ab' });
    expect(result.success).toBe(false);
  });

  it('should fail if alias is too long', () => {
    const result = aliasSchema.safeParse({ alias: 'a'.repeat(31) });
    expect(result.success).toBe(false);
  });

  it('should fail with special characters', () => {
    const result = aliasSchema.safeParse({ alias: 'my alias!' });
    expect(result.success).toBe(false);
  });

  it('should fail with spaces', () => {
    const result = aliasSchema.safeParse({ alias: 'my alias' });
    expect(result.success).toBe(false);
  });
});
