# GitHub Copilot Instructions — MAGIC-FARM

Use these instructions when generating or editing code in this repository.

## Project Context

MAGIC-FARM is a Next.js 14 App Router application for live magic-themed puzzle nights. The product surface is in Italian. Players authenticate by email magic link, join events and tables, submit puzzle answers, unlock hints, use optional Magic Modules, and view leaderboards. Admins manage event configuration, rounds, puzzles, modules, and open-stage workflows.

## Tech Stack

- Next.js 14.2 + React 18 + TypeScript 5.5
- Tailwind CSS with a custom "magic" design system
- Prisma 5 + PostgreSQL
- NextAuth email provider + JWT sessions
- Nodemailer for mail
- Zod for validation
- Vitest for unit tests
- Playwright for E2E tests

## File-System Map

- `app/`: routes and layouts
- `app/(protected)/`: authenticated UI
- `app/api/`: route handlers
- `components/cards/`: canonical card-rendering primitives
- `components/modules/MagicianControlPanel.tsx`: generic magician-controlled module UI
- `lib/auth/`: auth and RBAC
- `lib/game/`: scoring and answer normalization
- `lib/modules/`: module registry, resolver, validators, and module implementations
- `lib/security/`: crypto, rate limiting, anti-bot, email policies
- `lib/validations/schemas.ts`: shared Zod schemas
- `prisma/`: schema, migrations, seed
- `__tests__/`: Vitest suites
- `e2e/`: Playwright specs
- `docs/MAGICIAN_CONTROLLED_SYSTEM.md`: module UI architecture

## Required Working Style

- Read the existing implementation first. MAGIC-FARM already has helpers for auth, validation, rate limiting, audit logging, card rendering, and module execution.
- Keep changes narrow and reviewable. Do not refactor unrelated code.
- Preserve current architecture. Extend existing folders and helpers instead of creating parallel systems.
- Keep UI text, validation errors, toasts, and labels in Italian.

## Implementation Rules

- Use `requireAuth()` / `requireAdmin()` from `lib/auth/rbac.ts` for protected handlers.
- Add or extend Zod schemas in `lib/validations/schemas.ts`.
- Call `createAuditLog()` after state-changing actions.
- Apply the existing rate-limit helpers from `lib/security/rate-limit.ts` to public mutation endpoints.
- Wrap `request.json()` parsing in `try/catch` when editing or adding route handlers.
- Keep answer hashing and secret handling inside the existing crypto helpers. Never log plaintext secrets, join codes, hashes, or tokens.
- Use the existing design system classes: `card-magic`, `btn-magic`, `input-magic`, `font-cinzel`.
- Reuse `lib/ui/icons.ts`, `components/ui/icon.tsx`, and `components/ui/magic-toast.tsx`.
- Admin screens should follow the existing `'use client'` + `fetch('/api/admin/...')` pattern.
- Keep business logic in `lib/` or route handlers, not in presentational components.

## MAGIC-FARM-Specific Architecture Rules

- Card visuals must go through `components/cards/InteractiveCard.tsx`, `CardFanHand.tsx`, `CardStack.tsx`, `CardBack.tsx`, and `CardFrame.tsx`.
- Card geometry belongs in `lib/cards/cardMath.ts`; do not duplicate layout math in components.
- Motion values belong in `lib/motion/presets.ts` and `lib/ui/tokens.ts`.
- Magic Modules are registered in `lib/modules/registry.ts` and resolved through `lib/modules/resolver.ts`.
- Module implementations live in `lib/modules/modules/`.
- The current module UX supports three paths: custom UI, auto flow, and magician-controlled flow. Preserve that split.
- If you change module behavior, also inspect `prisma/seed.ts`, `lib/modules/types.ts`, and `app/(protected)/serate/[eventId]/components/magic-modules-panel.tsx`.
- Respect `lib/config/env.ts`: runtime requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
- Prisma is the source of truth for data shape. Schema changes require a new migration. Never edit old migrations.

## Verification Commands

Use these commands before considering a change complete:

- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run`
- `npm run build`

Optional when the task touches browser flows:

- `npm run test:e2e` with the app running on `http://localhost:3001`

## Git Workflow

- Never commit directly to `main`.
- Always work on a feature branch.
- Open a pull request into `main`.
- CI must pass before merge.
