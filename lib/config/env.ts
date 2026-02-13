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

  // ── Anti-bot (Cloudflare Turnstile) — optional in dev ──
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),

  // ── Email domain policies — optional ──
  BLOCKED_EMAIL_DOMAINS: z.string().optional(),   // comma-separated
  ALLOWED_EMAIL_DOMAINS: z.string().optional(),   // comma-separated (allowlist mode)
});

export type Env = z.infer<typeof envSchema>;

let _validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (_validatedEnv) return _validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Missing or invalid environment variables:\n${errors}\n\nPlease check your .env file.`
    );
  }

  _validatedEnv = result.data;
  return _validatedEnv;
}
