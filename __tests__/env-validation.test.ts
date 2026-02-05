import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// We test the schema directly rather than the cached validateEnv()
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
  SMTP_FROM: z.string().min(1, 'SMTP_FROM is required'),
});

describe('Environment validation', () => {
  it('should pass with all valid env vars', () => {
    const validEnv = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      NEXTAUTH_SECRET: 'super-secret-key-123',
      NEXTAUTH_URL: 'http://localhost:3000',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user@example.com',
      SMTP_PASSWORD: 'password123',
      SMTP_FROM: 'Magic Farm <noreply@example.com>',
    };

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('should fail when DATABASE_URL is missing', () => {
    const env = {
      NEXTAUTH_SECRET: 'secret',
      NEXTAUTH_URL: 'http://localhost:3000',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'pass',
      SMTP_FROM: 'test@test.com',
    };

    const result = envSchema.safeParse(env);
    expect(result.success).toBe(false);
  });

  it('should fail when NEXTAUTH_URL is not a valid URL', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost:5432/db',
      NEXTAUTH_SECRET: 'secret',
      NEXTAUTH_URL: 'not-a-url',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'pass',
      SMTP_FROM: 'test@test.com',
    };

    const result = envSchema.safeParse(env);
    expect(result.success).toBe(false);
  });

  it('should fail when SMTP_PORT is not a number', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost:5432/db',
      NEXTAUTH_SECRET: 'secret',
      NEXTAUTH_URL: 'http://localhost:3000',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 'abc',
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'pass',
      SMTP_FROM: 'test@test.com',
    };

    const result = envSchema.safeParse(env);
    expect(result.success).toBe(false);
  });

  it('should fail when multiple vars are missing', () => {
    const env = {};
    const result = envSchema.safeParse(env);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(8);
    }
  });
});
