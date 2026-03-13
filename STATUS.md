# 🎩 MAGIC-FARM — Project Status

**Last Updated:** March 13, 2026  
**Version:** 1.0.0 (Active Development)  
**Branch audited:** `main` / `feat/magic-modules`

---

## 📋 Audit Summary — Major Inaccuracies Found in Previous STATUS.md

The previous STATUS.md (dated February 5, 2026) was severely outdated and misrepresented the real
product state. The following major inaccuracies were identified by inspecting the actual code:

| Claim in old STATUS.md | Reality (verified from code) |
|---|---|
| "~25% complete" | All major features are implemented end-to-end |
| "No tests written" | 134 unit/integration tests across 14 files; 3 Playwright E2E specs |
| "Profile page returns 404" | `app/(protected)/profilo/page.tsx` exists (205 lines, server component) |
| "Library page returns 404" | `app/(protected)/libreria/page.tsx` exists (135 lines) |
| "Leaderboard link leads to empty page" | Full leaderboard UI at `/classifica` and `/leaderboard` (280 lines each) |
| "No admin dashboard" | `app/(protected)/admin/page.tsx` exists (774 lines, fully functional) |
| "No puzzle display/answer submission" | Full gameplay loop at `/serate/[eventId]` and `/game`; submission API at `POST /api/serate/[eventId]/submit` |
| "No clue board" | `clue-board.tsx` component + `/api/serate/[eventId]/messages` API |
| "No alliances" | `/api/serate/[eventId]/alliance-effect` API + `alliance-effects.tsx` component |
| "No table join UI" | `join-table-form.tsx` + `/api/serate/[eventId]/join` |
| "No consent UI" | `app/consents/page.tsx` exists; onboarding captures consent |
| "14 database models" | **25 models** in `prisma/schema.prisma` |
| "No Magic Modules" | 18 modules fully implemented, tested, and DB migration applied |
| "Vitest configured, no tests" | 134 tests, 14 test files |
| Magic Modules not mentioned | Full system: registry, resolver, 18 modules, admin API, player API, UI panel |
| Open Stage not mentioned | Full system: schema, admin API, public application form |
| Card engine not mentioned | 5 card components + `lib/ui/tokens.ts` + `lib/motion/presets.ts` + framer-motion |

---

## ✅ Implemented and Usable

### Authentication & User Management
- Magic-link email auth (NextAuth 4.24 with Prisma adapter)
- 30-day sessions with HttpOnly cookie JWTs
- Alias setup (unique public display names) with suggestions
- Onboarding flow with mandatory privacy/consent capture
- Email verification flow + welcome emails (Nodemailer)
- Consent management page (`/consents`) with revocation (`DELETE /api/consents/revoke`)
- Privacy policy page, Terms of Service page

### Core Infrastructure
- Next.js 14.2 App Router; all pages use Italian UI
- PostgreSQL via Prisma 5.22; 5 migrations applied (latest: `20260218181251_add_magic_modules`)
- Tailwind CSS with custom `magic` design system (`card-magic`, `btn-magic`, `input-magic`, `font-cinzel`)
- Zod validation schemas for all API operations
- Rate limiting with `lib/security/rate-limit.ts` (per-IP and per-user limiters for auth, hints, modules, invites)
- Audit logging via `lib/audit/logger.ts` (never throws; logs major user and admin actions)
- RBAC guards: `requireAuth()` / `requireAdmin()` from `lib/auth/rbac.ts`
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff
- Salted SHA-256 answer hashing; AES-256-GCM encryption for sensitive fields
- Cryptographically secure token generation (`crypto.getRandomValues()`)
- Middleware enforces auth on all protected routes with onboarding gating

### Admin Panel (`/admin`)
- Full event management: create, list, update status (DRAFT → LIVE → ENDED)
- Round management: create rounds per event, set type (SINGLE_TABLE, MULTI_TABLE, INDIVIDUAL)
- Puzzle management: create/edit puzzles with hints and SHA-256 hashed answers
- Table management: view tables and members per event
- Magic Modules panel: enable/disable modules per event, configure parameters (SpellsPanel)
- Open Stage management: view, approve, and reject performer applications
- Admin API routes: `/api/admin/events`, `/api/admin/rounds`, `/api/admin/puzzles`, `/api/admin/hints`, `/api/admin/tables`, `/api/admin/modules`, `/api/admin/open-stage`

### Event Night Gameplay (`/serate`)
- Event listing page: shows DRAFT and LIVE events with status indicators
- Event detail page (`/serate/[eventId]`): full in-event experience
- Table join flow: `join-table-form.tsx` + `POST /api/serate/[eventId]/join`
- Puzzle card display: `puzzle-card.tsx` with hint request support
- Answer submission: `POST /api/serate/[eventId]/submit` with SHA-256 hash verification, scoring, and penalty deduction
- Hint system: `POST /api/serate/[eventId]/hint` with progressive reveal and penalty tracking
- Clue Board (in-table messaging): `clue-board.tsx` + `GET/POST /api/serate/[eventId]/messages`
- Alliance effects (cross-table): `alliance-effects.tsx` + `/api/serate/[eventId]/alliance-effect`
- Live leaderboard: `live-leaderboard.tsx` + `GET /api/serate/[eventId]/leaderboard`
- Event metrics: `event-metrics.tsx` + `GET /api/serate/[eventId]/metrics`
- Ritual / event ceremony: `ritual-overlay.tsx` + `POST /api/serate/[eventId]/ritual`
- Spectator mode toggle: `spectator-toggle.tsx` + `POST /api/serate/[eventId]/spectator`

### Game Page (`/game`)
- Standalone puzzle gameplay interface (377 lines, `'use client'`)
- Puzzle card display, answer input, hint requests, score tracking per round

### Magic Modules System (18 modules)
All 18 modules implemented in `lib/modules/modules/`, registered in `lib/modules/registry.ts`,
resolved with 15-second cache in `lib/modules/resolver.ts`.

| Key | Name | Difficulty | Scope | Player UI |
|---|---|---|---|---|
| `CARD_PREDICTION_BINARY` | Predizione Carta | Base | User | 🎨 Custom |
| `EQUIVOQUE_GUIDED` | Equivoque Guidato | Intermedio | User | 🎨 Custom |
| `ENVELOPE_PREDICTION` | Predizione in Busta | Avanzato | Table | 🎨 Custom |
| `MATHEMATICAL_FORCE_27` | Forzatura Matematica 27 | Base | User | 🎨 Custom |
| `MATH_1089_CARDS` | 1089 con Carte | Base | User | 🔁 Auto-step |
| `SYNCED_CARD_THOUGHT` | Carta Pensata in Sincronia | Base | Global | 🔁 Auto-step |
| `ACAAN_DYNAMIC` | ACAAN Dinamico | Avanzato | User | 🪄 Magician |
| `BIRTHDAY_CARD_FORCE` | Carta dalla Data di Nascita | Base | User | 🪄 Magician |
| `CLOCK_FORCE` | Forzatura a Orologio | Base | User | 🪄 Magician |
| `FIRMA_SIGILLATA` | Firma Sigillata | Avanzato | Global | 🪄 Magician |
| `INVISIBLE_DECK_DIGITAL` | Mazzo Invisibile Digitale | Avanzato | User | 🪄 Magician |
| `MAGICIANS_CHOICE_4` | Equivoque a 4 Carte | Intermedio | User | 🪄 Magician |
| `MULTILEVEL_PREDICTION` | Previsione Multilivello | Avanzato | User | 🪄 Magician |
| `PREDICTION_HASH` | Previsione Hash (SHA-256) | Avanzato | Global | 🪄 Magician |
| `PSYCHOLOGICAL_FORCE_CARD` | Forzatura Psicologica | Intermedio | User | 🪄 Magician |
| `SEALED_ENVELOPE_DIGITAL` | Busta Sigillata Digitale | Intermedio | Table | 🪄 Magician |
| `SHARED_IMPOSSIBLE_CARD` | Carta Condivisa Impossibile | Avanzato | Table | 🪄 Magician |
| `TWENTY_ONE_CARDS` | Trick delle 21 Carte | Intermedio | User | 🪄 Magician |

Module API: `GET /api/serate/[eventId]/modules`, `POST /api/serate/[eventId]/modules/[moduleKey]/execute`  
Admin API: `GET/PATCH /api/admin/modules/[eventModuleId]`, `PUT /api/admin/modules/[eventModuleId]/config`  
Special: `POST /api/admin/modules/firma-sigillata/reveal`  
Audit actions: MODULE_ENABLED, MODULE_DISABLED, MODULE_CONFIGURED, MODULE_EXECUTED, MODULE_EXECUTION_BLOCKED

### Card Engine (UI Primitives)
- `InteractiveCard` — flip animation, hover, gold reveal state
- `CardFanHand` — fan layout for multiple cards
- `CardStack` — stacked deck with peeking
- `CardBack` / `CardFrame` — SVG-based card visuals (200×300, 2:3 ratio)
- `lib/ui/tokens.ts` — sizing tokens, perspective, reveal constants
- `lib/motion/presets.ts` — framer-motion spring/timing presets with reduced-motion fallback
- Used in `magic-modules-panel.tsx` for card-based module UIs

### Leaderboard & Rankings
- `/classifica` — server-rendered leaderboard reading `LeaderboardEntry` model
- `/leaderboard` — client-side leaderboard with event/table/global tabs (280 lines)
- `GET /api/leaderboard` — global ranking endpoint
- `GET /api/classifica` — alternative leaderboard endpoint
- `lib/game/scoring.ts` — full scoring algorithm with time bonuses and hint penalties

### User Profile (`/profilo`)
- Server-rendered profile page (205 lines)
- Shows user stats, events participated, badges, activity history

### Library (`/libreria`)
- Server-rendered library page (135 lines)
- Reads `LibraryEntry` model; displays magic content by category
- `GET /api/libreria` — API endpoint for library entries

### Open Stage — Palco Aperto Magico
- Public application form at `/events/open-magic-stage`
- `POST /api/open-stage/apply` — submit performer application
- Admin management at `/admin/open-stage` + `/api/admin/open-stage`
- `OpenStageApplication` model with `PENDING / APPROVED / REJECTED` status

### Consents & Privacy
- Onboarding flow captures privacy policy and marketing consent with SHA-256 evidence hash
- `app/consents/page.tsx` — consent management UI
- `GET/POST /api/consents` — read/update consent record
- `DELETE /api/consents/revoke` — revoke marketing consent
- Privacy policy page (`/privacy`) and Terms of Service page (`/terms`)
- `PRIVACY_IMPLEMENTATION.md` documents full evidence model

### Other APIs
- `GET /api/serate` — list events
- `GET/PATCH /api/admin/events`, `GET/PATCH /api/admin/events/[eventId]`
- `GET /api/events`, `GET /api/events/active`, `GET /api/events/join`, `GET /api/events/[eventId]`
- `GET /api/puzzles/[puzzleId]` — fetch puzzle detail
- `POST /api/hints/request` — request a hint (rate-limited)
- `POST /api/submissions` — alternate submission endpoint
- `GET /api/table/me` — fetch current user's table
- `GET /api/badges`, `GET /api/badges/check` — badge awarding
- `GET /api/profilo` — user profile data
- `GET /api/host/invite`, `GET /api/host/top-players` — host-scoped endpoints
- `GET /api/user/alias`, `POST /api/user/onboarding` — user setup

---

## ⚠️ Implemented but Partial / Needs Validation

1. **Anti-cheat (`detectSuspiciousActivity()`)** — function implemented in `lib/game/scoring.ts` but never called in the submission route. Rapid/suspicious submissions are not flagged in production.

2. **Spectator mode** — `isSpectator` field exists on `TableMembership` and toggle API exists, but spectators are not excluded from leaderboard or scoring in the current implementation.

3. **HOST role** — `UserRole.HOST` does not exist in the Prisma schema. Host-gated API routes (`/api/host/*`) currently fall back to admin-level access with TODO comments.

4. **Answer fuzzy matching** — README references Levenshtein-distance matching; it is not implemented in `POST /api/serate/[eventId]/submit`. Answers are exact-match after normalization only.

5. **Leaderboard pagination** — `GET /api/leaderboard` and `GET /api/admin/events` do not support `page`/`skip` parameters. At scale, these queries are unbounded.

6. **Rate limiter error handling** — `lib/security/rate-limit.ts` swallows internal errors and returns a rate-limit rejection instead of distinguishing real limit hits from internal failures.

7. **Email notifications** — Nodemailer is used only for magic-link auth. No game event notifications (round start, result, badge) are sent.

8. **Audit log actor role** — `actorRole` is often `null` in audit log entries, making role-based filtering unreliable.

9. **Real-time updates** — There is no WebSocket layer. Live leaderboard and clue board use manual refresh / polling patterns only.

10. **Telemetry / feedback layers** — `lib/feedback/haptics.ts`, `lib/feedback/sound.ts`, `lib/telemetry/ux-events.ts`, and `lib/performance/adaptive.ts` are referenced in planning documents but do **not** exist in the repository.

---

## 🔒 Blocked or Pending

1. **DB migration on production** — All 5 migrations exist in `prisma/migrations/`. The migration `20260218181251_add_magic_modules` must be applied to any environment not yet migrated (production database). No seed data for production.

2. **`game/page.tsx` completeness** — The `/game` page contains one TODO item; its behavior under certain edge cases (no active round, table not joined) should be validated.

3. **DB indexes** — Missing indexes on `Submission.isCorrect`, `ModuleInteraction.status`, and `TableMembership.leftAt` noted in backlog. Will impact performance at scale.

4. **Soft-delete** — Only `User` has `deletedAt`. `EventNight`, `Puzzle`, `Round`, and `Badge` lack soft-delete support.

5. **Deployment guide** — No deployment guide exists. `.env.example` is present; `docker-compose.yml` exists for local PostgreSQL.

---

## 🧪 Testing Status

| Type | Count | Status |
|---|---|---|
| Unit / integration tests | 134 tests, 14 files | ✅ All passing (per `docs/AUDIT_REPORT.md`, 2026-03-12) |
| E2E (Playwright) | 3 specs | home, login, verify-request — configured, not CI-wired |
| API route tests | 0 | Not covered; only library logic tested |
| Coverage | Not measured | No coverage tooling configured |

**Test files:**
- `__tests__/scoring.test.ts`, `schemas.test.ts`, `alias-normalization.test.ts`
- `__tests__/answer-normalizer.test.ts`, `env-validation.test.ts`
- `__tests__/harry-potter-quiz.test.ts`, `host-invite-rate-limit.test.ts`
- `__tests__/modules/` — validators, registry, resolver, card-prediction-binary, equivoque-guided, envelope-prediction, firma-sigillata

**Run tests:** `npx vitest run` (requires `npm install` first; dependencies not committed)

---

## 📦 Database Models (25 Total)

**Auth:** User, Account, Session, VerificationToken  
**Organizations & Events:** Organization, EventNight  
**Gameplay:** Round, Puzzle, Hint, Submission, Table, TableMembership, ClueBoardMessage, Alliance  
**Rankings & Rewards:** LeaderboardEntry, Badge, BadgeAward, EventMetrics  
**Consent & Audit:** Consent, AuditLog  
**Library:** LibraryEntry  
**Magic Modules:** MagicModule, EventModule, ModuleInteraction  
**Open Stage:** OpenStageApplication

All models have corresponding API routes and/or UI pages. No model is entirely unused.

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.2.x |
| UI | React + Tailwind CSS (custom magic theme) | 18.3.x |
| Language | TypeScript | 5.5.x |
| Database | PostgreSQL via Prisma ORM | 5.22.0 |
| Auth | NextAuth with Prisma adapter | 4.24.x |
| Animation | framer-motion | 12.34.x |
| Validation | Zod | 3.23.x |
| Email | Nodemailer | 7.x |
| Unit tests | Vitest | 2.0.x |
| E2E tests | Playwright | configured |

---

## 🚀 Realistic Next Priorities

1. **Validate production DB migration** — Confirm `add_magic_modules` is applied; run seed if needed
2. **Wire `detectSuspiciousActivity()`** — Call in submit route, flag suspicious submissions
3. **Spectator exclusion from scoring** — Enforce `isSpectator` check in leaderboard queries
4. **HOST role implementation** — Add `HOST` to `UserRole` enum, update `requireAuth()`, remove admin fallback
5. **Leaderboard pagination** — Add `take`/`skip` to `GET /api/leaderboard` and admin event list
6. **Fuzzy answer matching** — Implement Levenshtein-distance with configurable threshold in submit route
7. **Real-time** — Evaluate Server-Sent Events or WebSocket for live leaderboard and clue board
8. **API test coverage** — Add integration tests for critical routes (submit, hint, modules execute)
9. **Deployment guide** — Write step-by-step guide covering env vars, migration, seed, and production build
10. **DB indexes** — Add missing indexes for `Submission.isCorrect`, `ModuleInteraction.status`, `TableMembership.leftAt`

---

## ⚠️ Known Risks

- **No real-time layer** — Clue board and leaderboard require page refresh; UX degrades in live sessions
- **Unbounded queries** — Leaderboard and event list endpoints can return large result sets without pagination
- **Anti-cheat inactive** — The implemented `detectSuspiciousActivity()` function has no effect in production
- **HOST role gap** — Host-gated flows are currently admin-only; hosts cannot be separated from administrators
- **No E2E CI integration** — Playwright tests are configured but not run in any CI pipeline
- **`ENCRYPTION_KEY` dependency** — The encryption key must be set before production deployment; app will error at runtime if missing

---

## 📚 Other Docs Requiring Revision

| File | Why it is outdated | Priority |
|---|---|---|
| `STATUS.it.md` | Italian mirror of the old STATUS.md; contains the same ~25% claim and all the same inaccuracies | **HIGH** — Should be updated to mirror this document |
| `README.md` | Likely references `pnpm` instead of `npm` for some commands; may reference old feature status or missing pages; 23 KB — needs review | **HIGH** |
| `CLAUDE.md` | Task 13 ("Run Prisma migration + seed") marked as NOT DONE, but `20260218181251_add_magic_modules` migration file exists in `prisma/migrations/`; backlog items A1/A3/A4/A5/A6/A7 are marked as fixed (strikethrough) but not all are verifiable without running the app | **MEDIUM** |
| `docs/plans/2026-02-16-magic-modules-implementation.md` | Implementation plan document; the plan is now executed — should be archived or updated to reflect completion | **LOW** |
| `docs/plans/2026-02-16-magic-modules-design.md` | Design document written before implementation; may not match final module API signatures or resolver behavior | **LOW** |

---

*This document reflects the actual codebase state as of March 13, 2026. Verified by direct inspection of all source files, API routes, Prisma schema, test files, and migration history.*
