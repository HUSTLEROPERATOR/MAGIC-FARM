# CLAUDE.md - Magic Farm Project Context

## Project Overview
Next.js 14 App Router app for magic show event management. PostgreSQL via Prisma, NextAuth magic-link auth, custom Tailwind "magic" design system (no shadcn). All UI in Italian.

## Key Patterns
- Admin pages: `'use client'` + `fetch('/api/admin/...')` pattern
- Auth: `requireAuth()` / `requireAdmin()` from `lib/auth/rbac.ts` — returns `{ session, response }`
- Validation: Zod schemas in `lib/validations/schemas.ts`
- Audit: `createAuditLog()` from `lib/audit/logger.ts` — never throws
- Answers: SHA-256 hashed with salt, never plaintext
- CSS: `card-magic`, `btn-magic`, `input-magic`, `font-cinzel`
- Icons: `lib/ui/icons.ts` re-exports lucide-react, `<Icon>` wrapper in `components/ui/icon.tsx`
- Toast: `useToast()` from `components/ui/magic-toast.tsx`

## Active Branch: feat/magic-modules

### Verified Task Status — 2026-02-18 (Forensic Audit)

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Prisma schema: MagicModule, EventModule, ModuleInteraction | ✅ DONE | `prisma/schema.prisma` lines 656–725 |
| 2 | `lib/modules/types.ts` + `lib/modules/validators.ts` | ✅ DONE | Both files present |
| 3 | `lib/modules/registry.ts` | ✅ DONE | registerModule, getModule, getAllModules, executeModule |
| 4 | 3 starter modules in `lib/modules/modules/` | ✅ DONE | card-prediction-binary, equivoque-guided, envelope-prediction |
| 5 | Modules wired into registry + 5 audit actions | ✅ DONE | MODULE_ENABLED/DISABLED/CONFIGURED/EXECUTED/EXECUTION_BLOCKED |
| 6 | `lib/modules/resolver.ts` (15s cache, onEnable, artifacts) | ✅ DONE | Merge conflict fixed 2026-02-18 |
| 7 | Zod schemas + rateLimitModuleExecute | ✅ DONE | `lib/validations/schemas.ts`, `lib/security/rate-limit.ts` (duplicate fixed) |
| 8 | Admin API routes (`/api/admin/modules/`) | ✅ DONE | `app/api/admin/modules/route.ts` + `[eventModuleId]/` + `[eventModuleId]/config/` |
| 9 | Player API routes (`/api/serate/[eventId]/modules/`) | ✅ DONE | `app/api/serate/[eventId]/modules/route.ts` + `[moduleKey]/execute/` |
| 10 | Seed MagicModules + auto-create EventModules on event creation | ✅ DONE | `prisma/seed.ts` (magicModule.upsert) + `app/api/admin/events/route.ts` (auto-create) |
| 11 | Admin UI SpellsPanel (toggle + config modal) | ✅ DONE | `app/(protected)/admin/page.tsx` — SpellsPanel at lines 313–316, 488+ |
| 12 | Run all tests + verify Next.js build | ✅ DONE | 35 tests pass; build compiles (warnings only) |
| 13 | Run Prisma migration + seed on dev DB | ❌ NOT DONE | No migration for magic modules — see next step |

**Progress: 12/13 tasks complete (92%)**

### What's Left

**Task 13 only** — Run Prisma migration + seed on dev DB:
```bash
# 1. Apply migration (creates magic_modules, event_modules, module_interactions tables)
npx prisma migrate dev --name add_magic_modules

# 2. Seed the database (creates 3 MagicModule rows + EventModules for seed event)
npm run db:seed
```

### Implementation Plan
Full plan: `docs/plans/2026-02-16-magic-modules-implementation.md`
Design doc: `docs/plans/2026-02-16-magic-modules-design.md`

### Test Status (as of 2026-02-18)
35 tests passing across `__tests__/modules/` (validators, registry, 3 modules, resolver).
Build: ✓ Compiled successfully (3 ESLint warnings, no errors).
Migration NOT yet applied — DB tables do NOT exist until Task 13 runs.

## Commands
- `npx vitest run` — run all tests
- `npx vitest run __tests__/modules/` — run module tests only
- `npm run build` — Next.js build
- `npx prisma validate` — validate schema (no DB needed)
- `npx prisma generate` — generate client (no DB needed)
- `npx prisma migrate dev --name add_magic_modules` — Task 13: create+apply migration
- `npm run db:seed` — seed database (after migration)

## Known Issues

1. **No DB migration applied (BLOCKER for runtime)**: `prisma/migrations/` has 5 migrations but none for magic modules.
   The schema is valid and the Prisma client is generated, but the DB tables do not exist.
   Runtime calls to `prisma.eventModule`, `prisma.magicModule`, `prisma.moduleInteraction` will fail until Task 13 runs.

2. **Use npm, not pnpm**: `package.json` uses standard npm scripts. `README.md` references `pnpm` but
   `npm`/`npx` work correctly for all commands in this repo.

3. **Bugs fixed during 2026-02-18 audit** (committed separately):
   - `lib/modules/resolver.ts`: unresolved git merge conflict (`<<<<<<< HEAD` markers) — fixed
   - `lib/security/rate-limit.ts`: `moduleExecuteLimiter` declared twice — duplicate removed
