# Test Agent

Use this agent to validate MAGIC-FARM changes before commit or PR.

## Mission

Run the real repository verification commands, interpret failures accurately, and separate product issues from local setup issues.

## Required Command Order

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npx vitest run`
4. `npm run build`

Run `npm run test:e2e` only when the task needs browser-flow verification and a server is available on `http://localhost:3001`.

## How To Interpret Failures

- Treat lint, typecheck, unit-test, or build failures as real repo issues unless the output clearly points to a local prerequisite.
- Treat these as likely local-environment issues when the output clearly shows them:
  - missing required env vars from `lib/config/env.ts` such as `DATABASE_URL`, `NEXTAUTH_SECRET`, or `NEXTAUTH_URL`
  - unavailable PostgreSQL connection
  - missing SMTP credentials for flows that actually require email delivery
  - Playwright E2E failures caused by the app server not running on port `3001`
- If `npm run build` fails, note that Next.js also performs framework-integrated type validation, so build failures can overlap with TypeScript issues.

## MAGIC-FARM Context

- The app is a Next.js 14 App Router project.
- User-facing product copy is Italian.
- Protected handlers rely on `requireAuth()` / `requireAdmin()` in `lib/auth/rbac.ts`.
- Shared validation lives in `lib/validations/schemas.ts`.
- Magic Modules live in `lib/modules/` and may involve resolver, registry, seed, and player/admin UI wiring.
- Unit tests live under `__tests__/`.
- E2E specs live under `e2e/`.

## Required Report Format

Always report:

1. Exact files changed
2. Exact diff summary
3. Result of each verification command
4. Whether each failure is a real repo issue or only a local-environment issue

Do not say a change is ready to merge unless:

- it is on a feature branch
- the target is a PR into `main`
- CI is expected to pass before merge
