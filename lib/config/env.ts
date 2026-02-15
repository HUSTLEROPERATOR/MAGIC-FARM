import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // SMTP opzionale in dev mode per permettere test senza email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

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
