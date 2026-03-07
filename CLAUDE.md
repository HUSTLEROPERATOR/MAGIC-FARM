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

---

## Backlog — Audit 2026-02-24

Analisi completa del repo eseguita il 2026-02-24. 33 problemi trovati e classificati.

### PRIORITÀ 1 — Immediato (sicurezza / blocker)

| # | File | Problema | Note |
|---|------|----------|------|
| ~~A1~~ | `lib/security/crypto.ts:4` | **ENCRYPTION_KEY hardcoded** — lancia errore se non settata in prod | `process.env.ENCRYPTION_KEY \|\| 'default-key...'` |
| A2 | `prisma/migrations/` | **Migration Magic Modules non applicata** — Task 13 ancora aperto | Vedi comandi sotto |
| ~~A3~~ | Tutte le API routes | **`request.json()` senza try/catch** — JSON malformato crasha la route | Impatta: admin/events, admin/puzzles, alliance-effect, ecc. |
| ~~A4~~ | `lib/security/crypto.ts:73` | **`generateJoinCode()` usa `Math.random()`** — non sicuro crittograficamente | Sostituire con `crypto.getRandomValues()` |
| ~~A5~~ | `app/api/serate/[eventId]/hint/route.ts` | **`rateLimitHint()` definita ma mai chiamata** | Aggiungere check all'inizio del handler |
| ~~A6~~ | `app/api/serate/[eventId]/messages/route.ts` | **`rateLimitClueBoard()` definita ma mai chiamata** | Aggiungere check nel POST handler |
| ~~A7~~ | `app/api/serate/[eventId]/alliance-effect/route.ts` | **Nessuna validazione Zod** su `action` e `puzzleId` | Aggiungere schema `z.enum(['share_hint','check_common_goal','list'])` |

### PRIORITÀ 2 — Prossimo sprint (feature incomplete / qualità)

| # | File | Problema | Note |
|---|------|----------|------|
| B1 | `app/api/serate/[eventId]/submit/route.ts` | **Nessun fuzzy matching risposte** — il README cita Levenshtein ma non esiste | Implementare distanza di Levenshtein con soglia configurabile |
| B2 | `lib/game/scoring.ts:83` | **`detectSuspiciousActivity()` definita ma mai chiamata** — anti-cheat non attivo | Chiamarla nel submit route, flaggare submission sospette |
| B3 | Schema (`isSpectator`) | **Spectator mode nello schema ma nessuna logica** — gli spettatori entrano in classifica | Aggiungere check `isSpectator` nel scoring |
| B4 | `app/api/leaderboard/route.ts` | **Nessuna paginazione** — groupBy senza `take`/`skip` | Default limit 100, aggiungere `page` param |
| B5 | `app/api/admin/events/route.ts` | **Nessuna paginazione** nella lista eventi admin | Aggiungere `take`/`skip` |
| B6 | `lib/security/rate-limit.ts:175` | **Rate limiter swallows all errors** — errori interni rigettano richieste legittime | Loggare l'errore e distinguere da rate limit reale |

### PRIORITÀ 3 — Backlog (qualità / data model)

| # | File | Problema | Note |
|---|------|----------|------|
| C1 | `__tests__/` | **Zero test sulle API routes** — solo `__tests__/modules/` coperto | Aggiungere integration test per routes critiche |
| C2 | `lib/game/scoring.ts` | **`calculateScore()` / `calculateRankings()` non testate** | Edge case: punteggio minimo, tie, valori negativi |
| C3 | Prisma schema | **Index mancanti**: `Submission.isCorrect`, `ModuleInteraction.status`, `TableMembership.leftAt` | Aggiungere `@@index` nel schema |
| C4 | `app/api/serate/[eventId]/hint/route.ts` | **Hint crea record in `Submission`** — tabella cresce unbounded | Valutare tabella `HintRequest` separata |
| C5 | `app/api/host/*.ts` | **Ruolo HOST non implementato** — gated su admin con TODO | Aggiungere `HOST` a `UserRole`, aggiornare `requireAuth()` |
| C6 | Schema | **Nessun soft-delete** per `EventNight`, `Puzzle`, `Round`, `Badge` | Solo `User` ha `deletedAt` |
| C7 | `lib/audit/logger.ts` | **`actorRole` spesso null** — difficile filtrare log per ruolo | Fetchare e includere sempre il ruolo corrente |
| C8 | Mix lingue nei messaggi di errore | Alcune routes restituiscono "Event not found" (EN) invece di IT | Standardizzare tutto in italiano |

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

2. **ENCRYPTION_KEY hardcoded default** (BLOCKER for security): `lib/security/crypto.ts:4` usa
   `process.env.ENCRYPTION_KEY || 'default-key-change-in-production'`. Se la variabile non è settata,
   tutti i dati cifrati sono compromessi. Fix: throw se non settata in produzione.

3. **Use npm, not pnpm**: `package.json` uses standard npm scripts. `README.md` references `pnpm` but
   `npm`/`npx` work correctly for all commands in this repo.

4. **Bugs fixed during 2026-02-18 audit** (committed separately):
   - `lib/modules/resolver.ts`: unresolved git merge conflict (`<<<<<<< HEAD` markers) — fixed
   - `lib/security/rate-limit.ts`: `moduleExecuteLimiter` declared twice — duplicate removed
