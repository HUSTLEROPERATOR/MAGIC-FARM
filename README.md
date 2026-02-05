# Magic Farm

Magic Farm is a competitive magic-themed event platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and NextAuth (email magic links).

## Prerequisites

- Node.js 18+
- PostgreSQL database
- SMTP server (for magic link emails)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in all values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `NEXTAUTH_SECRET` | Random secret for signing JWTs (`openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | Application URL (e.g. `http://localhost:3000`) |
   | `SMTP_HOST` | SMTP server hostname |
   | `SMTP_PORT` | SMTP server port (587 for TLS, 465 for SSL) |
   | `SMTP_USER` | SMTP authentication username |
   | `SMTP_PASSWORD` | SMTP authentication password |
   | `SMTP_FROM` | Sender address (e.g. `Magic Farm <noreply@example.com>`) |
   | `ENCRYPTION_KEY` | AES encryption key for sensitive data |

   The app validates required env vars at startup and fails fast if any are missing.

3. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations (development)
   npm run db:migrate

   # Or push schema directly (no migration history)
   npm run db:push
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

## SMTP Testing

For local development, you can use services like:

- [Mailtrap](https://mailtrap.io/) - catches all outgoing emails
- [Mailhog](https://github.com/mailhog/MailHog) - local SMTP server with web UI
- [Ethereal](https://ethereal.email/) - disposable SMTP accounts

Configure the SMTP variables in `.env` to point to your test SMTP server.

## User Flow

1. User visits `/` and clicks "Entra nel Magic"
2. Enters email on `/login` and receives a magic link
3. Clicks magic link, lands on `/onboarding`
4. Completes onboarding: first name, last name, privacy consent
5. Sets public alias on `/setup-alias`
6. Accesses `/dashboard` and all app sections

## Security Notes

- **Authentication**: Email magic links via NextAuth with JWT session strategy
- **No passwords**: Zero password storage; authentication via one-time email links
- **IP hashing**: IP addresses are SHA-256 hashed before storage (never stored in plaintext)
- **Rate limiting**: Login attempts, alias changes, and API endpoints are rate-limited
- **Audit logging**: All authentication events, consent changes, and alias operations are logged
- **Consent tracking**: Privacy and marketing consent stored with evidence hash, IP hash, user agent, and version
- **Input validation**: All inputs validated with Zod schemas
- **CSRF protection**: Built-in via NextAuth
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

## Data Stored

| Data | Storage | Purpose |
|---|---|---|
| Email | Plaintext (required for auth) | Authentication |
| First/Last name | Plaintext | User profile |
| Alias | Plaintext (unique, lowercase) | Public leaderboard display |
| IP address | SHA-256 hash only | Audit trails, rate limiting |
| Consent records | With evidence hash + versions | GDPR compliance |
| Game data | Scores, times, attempts | Competition mechanics |

See [SECURITY.md](./SECURITY.md) and [PRIVACY_IMPLEMENTATION.md](./PRIVACY_IMPLEMENTATION.md) for detailed information.