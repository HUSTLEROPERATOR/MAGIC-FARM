# CLAUDE.md - MAGIC-FARM

## Project
MAGIC-FARM is a Next.js 14 App Router application for Italian-language magic-themed puzzle nights. It uses Prisma/PostgreSQL, NextAuth magic-link auth, Tailwind CSS, Vitest, and Playwright.

## Working Map

- `app/`: routes, layouts, pages, and API handlers
- `app/(protected)/`: authenticated product surfaces like dashboard, admin, serate, classifica, leaderboard, libreria, profilo
- `app/api/`: auth, consent, event, serata, leaderboard, host, admin, and module endpoints
- `lib/auth/`: auth options and RBAC helpers
- `lib/game/`: answer normalization and scoring
- `lib/modules/`: module types, registry, resolver, validators, and implementations
- `components/modules/MagicianControlPanel.tsx`: generic UI for magician-controlled modules
- `prisma/`: schema, migrations, and seed data
- `__tests__/`: Vitest coverage
- `e2e/`: Playwright specs
- `docs/MAGICIAN_CONTROLLED_SYSTEM.md`: current magician-controlled module design

## Key Rules

- All end-user UI copy stays in Italian.
- Admin pages follow the `'use client'` + `fetch('/api/admin/...')` pattern.
- Use `requireAuth()` / `requireAdmin()` from `lib/auth/rbac.ts`; both return `{ session, response }`.
- Keep schemas in `lib/validations/schemas.ts`.
- Call `createAuditLog()` after state-changing actions.
- Reuse `lib/security/rate-limit.ts` for public mutation routes.
- Use existing UI primitives: `card-magic`, `btn-magic`, `input-magic`, `font-cinzel`, `useToast()`, `lib/ui/icons.ts`, and `components/ui/icon.tsx`.
- Keep card rendering in `components/cards/` and card math in `lib/cards/cardMath.ts`.
- Keep module behavior in `lib/modules/`. If module behavior changes, check `registry.ts`, `resolver.ts`, `prisma/seed.ts`, and `magic-modules-panel.tsx`.
- Preserve the current module UX split: custom UI, auto, and magician-controlled.
- Respect `lib/config/env.ts`: `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are required.
- Do not edit old Prisma migrations. Add new ones.

## Commands

- `npm run dev`
- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run`
- `npm run build`
- `npm run test:e2e` with a local server on port `3001`

## Git Workflow

- Never commit directly to `main`.
- Always use a feature branch.
- Open a PR into `main`.
- CI must pass before merge.
