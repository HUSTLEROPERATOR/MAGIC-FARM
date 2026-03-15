# MAGIC-FARM Agent Guide

## Repository Purpose

MAGIC-FARM is a full-stack Next.js 14 application for Italian-language magic-themed puzzle nights. Players authenticate with magic links, join live events and tables, solve puzzles, request hints, use optional "Magic Modules", and follow live leaderboards. Admins manage events, rounds, puzzles, tables, modules, and open-stage activity.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript 5.5
- Tailwind CSS with a custom MAGIC-FARM design system
- Prisma 5 + PostgreSQL
- NextAuth email magic-link authentication
- Nodemailer for transactional email
- Zod for validation
- Vitest for unit tests
- Playwright for E2E tests

## Repo Map

- `app/`: App Router pages, layouts, and route handlers
- `app/(protected)/`: authenticated pages such as dashboard, admin, serate, leaderboard, libreria, profilo
- `app/api/`: JSON route handlers for auth, consents, events, serate, leaderboard, admin, host, modules
- `components/`: UI components, including card primitives and module UIs
- `components/modules/MagicianControlPanel.tsx`: generic control UI for magician-controlled modules
- `lib/auth/`: NextAuth setup and RBAC helpers
- `lib/config/env.ts`: runtime environment validation
- `lib/game/`: answer normalization and scoring logic
- `lib/modules/`: module types, validators, registry, resolver, and 18 gameplay modules
- `lib/security/`: crypto, email/domain controls, rate limiting, turnstile helpers
- `lib/audit/logger.ts`: non-throwing audit logging for state-changing actions
- `lib/validations/schemas.ts`: central Zod schemas
- `prisma/schema.prisma`: database schema
- `prisma/migrations/`: migration history
- `prisma/seed.ts`: seed data, including module registration data
- `__tests__/`: Vitest coverage for env validation, security, scoring, audit, schema, and modules
- `e2e/`: Playwright specs
- `docs/MAGICIAN_CONTROLLED_SYSTEM.md`: magician-controlled module architecture and UX notes

## Commands

Use `npm` for repo commands.

- `npm run dev`: start local dev server on port `3001`
- `npm run lint`: Next.js ESLint checks
- `npx tsc --noEmit`: explicit TypeScript typecheck
- `npx vitest run`: run unit tests once
- `npm run build`: production build
- `npm run test:e2e`: Playwright tests, requires the app to be running on port `3001`
- `npm run db:generate`: regenerate Prisma client
- `npm run db:migrate`: create/apply Prisma migrations in development
- `npm run db:seed`: seed local development data

## Repo-Specific Rules

- Keep user-facing UI copy in Italian unless a file already establishes a technical English-only surface.
- Preserve the existing custom design system. Reuse classes like `card-magic`, `btn-magic`, `input-magic`, and `font-cinzel`.
- Use `requireAuth()` and `requireAdmin()` from `lib/auth/rbac.ts` for protected route handlers. They return `{ session, response }`; return `response` immediately when present.
- Put request validation in `lib/validations/schemas.ts` instead of scattering inline schemas across route handlers.
- Call `createAuditLog()` after state-changing admin or player actions.
- Reuse existing rate limiters from `lib/security/rate-limit.ts` at the start of public mutation routes.
- Keep answer checking, scoring, and anti-cheat logic in `lib/game/`, not in React components.
- Keep module logic inside `lib/modules/`. New or changed modules should flow through `validators.ts`, `registry.ts`, `resolver.ts`, `prisma/seed.ts`, and the relevant UI in `app/(protected)/serate/[eventId]/components/magic-modules-panel.tsx`.
- Preserve the current three module interaction modes documented in `docs/MAGICIAN_CONTROLLED_SYSTEM.md`: custom UI, auto, and magician-controlled.
- Treat `components/cards/` and `lib/cards/cardMath.ts` as the single card-rendering system. Do not create parallel card components.
- Respect `lib/config/env.ts`: `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are required at runtime; SMTP and Turnstile values are optional in local development.
- Do not edit existing Prisma migration files. Add a new migration when the schema changes.

## Verification Before Commit

Run these commands before committing documentation or code changes unless the task explicitly says otherwise:

- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run`
- `npm run build`

If a command fails, identify whether it is:

- a real repository issue introduced or exposed by the change, or
- a local-environment issue such as missing env vars, unavailable database access, or an E2E server prerequisite

## Branch and PR Workflow

- Never commit directly to `main`.
- Always work on a feature branch.
- If you are currently on `main`, create and switch to a feature branch before editing anything.
- Open a pull request targeting `main`.
- CI must pass before merge.
- Include the exact files changed, a diff summary, and the results of lint, typecheck, tests, and build in your handoff.
