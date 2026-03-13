# GitHub Copilot Instructions — MAGIC-FARM

This file governs how GitHub Copilot and coding agents assist in this repository.
Follow every section strictly. These rules exist to protect a production-grade
codebase maintained by HUSTLEROPERATOR.

---

## 1. Role and Operating Principles

You are a disciplined coding assistant for a production Next.js 14 App Router
application. Your role is to help implement focused, reviewable changes — not to
redesign, refactor, or rewrite existing systems.

**Core principles:**
- Preserve existing architecture above all else.
- Reuse shared systems before creating anything new.
- Make the smallest correct change that satisfies the requirement.
- Never introduce duplicate abstractions, providers, contexts, or helpers.
- Behavior must remain stable unless explicitly requested to change it.
- All UI text is in **Italian**.

---

## 2. Required Workflow Before Coding

Before writing any code:

1. **Read the relevant files** — locate existing implementations before assuming something is missing.
2. **Check `lib/` first** — utilities, auth, security, validation, modules, and UI tokens all live there.
3. **Check `components/cards/`** — the card engine is the single source of truth for all card behavior and visuals.
4. **Check `lib/motion/presets.ts`** — all animation constants and reduced-motion support already exist here.
5. **Check `lib/ui/tokens.ts`** — all card sizing, z-index, and transition tokens are defined here.
6. **Check `lib/validations/schemas.ts`** — Zod schemas for all domain objects are centralised here.
7. **Check `lib/auth/rbac.ts`** — use `requireAuth()` / `requireAdmin()` for every protected route.
8. **Check `lib/audit/logger.ts`** — every state-changing action must call `createAuditLog()`.
9. Only after confirming that what you need does not already exist should you propose a new abstraction.

---

## 3. Implementation Rules

- **Auth:** Use `requireAuth()` / `requireAdmin()` from `lib/auth/rbac.ts`. Never roll custom session checks.
- **Validation:** Use Zod schemas from `lib/validations/schemas.ts`. Add new schemas to that file; do not define inline schemas in route files.
- **Audit logging:** Call `createAuditLog()` from `lib/audit/logger.ts` after every write operation. It never throws — do not wrap it.
- **API routes:** Wrap `request.json()` in try/catch. Return structured JSON error responses with appropriate HTTP status codes.
- **Rate limiting:** Apply existing rate-limit helpers from `lib/security/rate-limit.ts` at the top of POST handlers.
- **Answers/secrets:** SHA-256 hash with salt. Never store or log plaintext.
- **CSS classes:** Use the existing design system — `card-magic`, `btn-magic`, `input-magic`, `font-cinzel`. Do not introduce utility-class soup or external component libraries (no shadcn).
- **Icons:** Import from `lib/ui/icons.ts` and render via `<Icon>` from `components/ui/icon.tsx`.
- **Toast notifications:** Use `useToast()` from `components/ui/magic-toast.tsx`.
- **Admin pages:** Use the `'use client'` + `fetch('/api/admin/...')` pattern consistently.
- **Modules:** Register new modules via `lib/modules/registry.ts`. Do not bypass the module registry to add gameplay logic elsewhere.

---

## 4. Bug-Fixing Rules

- Fix only the specific defect described. Do not clean up surrounding code unless it is directly causing the bug.
- Reproduce the bug path mentally before changing anything — confirm which layer owns the problem (route, service, component, type).
- Do not change function signatures or data shapes as part of a bug fix unless the signature is itself the bug.
- If a fix requires a schema migration, add a migration file; do not alter existing migrations.
- After fixing, verify that the same fix does not silently break an adjacent code path.

---

## 5. Refactoring Rules

- Only refactor when explicitly requested.
- Refactors must be isolated commits — they must not be bundled with feature or bug-fix changes.
- Do not rename exported symbols without updating every import site.
- Do not flatten the existing directory structure (`lib/`, `components/`, `app/`, `types/`).
- Do not consolidate Prisma models or change field names without a corresponding migration and full type-chain update.

---

## 6. Documentation Update Rules

- Update inline JSDoc when you change a function's behavior, parameters, or return type.
- If a `docs/plans/` document describes a task you are completing, mark it done; do not delete it.
- Do not rewrite `README.md`, `CLAUDE.md`, `STATUS.md`, or `SECURITY.md` unless the change is explicitly requested.
- `CLAUDE.md` is the authoritative project memory file — read it, never overwrite it casually.

---

## 7. Frontend-Specific Rules

- **No new animation libraries.** Framer Motion is already in use; extend it with presets from `lib/motion/presets.ts`.
- **Reduced motion:** Every animated component must check `useReducedMotion()` from framer-motion and fall back to `INSTANT` from `lib/motion/presets.ts`.
- **Animation values:** Use only tokens from `lib/ui/tokens.ts` (perspective, lift, scale, opacity, z-index, timing). Do not hardcode pixel or duration values.
- **Card visuals:** All card rendering must go through `InteractiveCard`, `CardFanHand`, or `CardStack` in `components/cards/`. Do not implement parallel card rendering logic.
- **Prefer `transform` and `opacity`** for animations — they are GPU-composited and do not trigger layout.
- **Responsiveness:** Every new UI element must work correctly on mobile. Test with a 375 px viewport mentally before committing.
- **Accessibility:** Preserve ARIA roles, `aria-label`, and keyboard navigation on all interactive elements.
- **No new Context providers** unless the existing `components/providers.tsx` genuinely cannot accommodate the state.
- **Keep business logic out of components.** Route handlers and `lib/` modules own domain logic; components own display only.

---

## 8. TypeScript-Specific Rules

- Always type function parameters and return values explicitly — no implicit `any`.
- Use types from `types/card.ts` (`CardData`, `CardPosition`) for all card-related data.
- Extend existing Zod schemas rather than writing parallel type definitions.
- Do not use `as unknown as T` casts; fix the underlying type mismatch instead.
- Prisma-generated types are the source of truth for database shapes — do not redefine them manually.
- Use `satisfies` over `as` when asserting that a value meets a type contract.

---

## 9. Performance Rules

- Do not add new `useEffect` calls that run on every render without a tightly scoped dependency array.
- Avoid fetching data in client components when a Server Component or route handler can own the fetch.
- Do not introduce `useEffect`-based polling; use server-sent events or revalidation tags instead.
- Images must use `next/image` with explicit `width`/`height` or `fill` + `sizes`.
- Code-split large client components with `next/dynamic` when they are below the fold or conditionally shown.
- Do not add heavy third-party libraries (e.g., moment.js, lodash) for tasks that native APIs or tiny utilities can handle.

---

## 10. Security and Configuration Rules

- **No secrets in source.** All secrets must come from environment variables defined in `.env.example`.
- `lib/security/crypto.ts` uses a lazy `getEncryptionKey()` function — do not convert it to an IIFE (this breaks the Next.js build).
- Never log session tokens, answer hashes, join codes, or PII.
- `generateJoinCode()` must use `crypto.getRandomValues()` — never `Math.random()`.
- Validate all external input with Zod before using it. This applies to API route bodies, query params, and module config objects.
- Apply rate limiting (`lib/security/rate-limit.ts`) to every public-facing mutation endpoint.
- Do not expose internal Prisma errors or stack traces in API responses.

---

## 11. PR Mindset

- Every PR should do **one thing**. Feature, fix, refactor, and docs changes belong in separate PRs.
- Keep diffs small and reviewable. A PR that touches more than ~200 lines of logic warrants a justification comment.
- Do not reformat files that are not directly related to the change.
- Include a brief description of *why* the change is needed, not just *what* changed.
- If a change has runtime side effects on existing data (e.g., a migration), call that out explicitly.
- Tests must pass before a PR is considered ready. Run `npx vitest run` to verify.

---

## 12. MAGIC-FARM Repository-Specific Rules

These rules encode the concrete architecture of this repository and must not be violated.

### Card Engine
- `components/cards/InteractiveCard.tsx`, `CardFanHand.tsx`, `CardStack.tsx`, `CardBack.tsx`, `CardFrame.tsx` are the **only** card rendering primitives. Do not create alternatives.
- `lib/cards/cardMath.ts` owns all geometric calculations (fan positions, z-index). Add new math there; do not duplicate it in components.
- `types/card.ts` owns `CardData` and `CardPosition`. Do not redefine these shapes elsewhere.
- Card sizing comes exclusively from `CARD_SIZES` in `lib/ui/tokens.ts` (sm, md, lg at 2:3 ratio).
- SVG assets in `public/cards/` use a 200×300 viewBox. New assets must match this ratio.

### Motion and Animation
- All motion constants live in `lib/motion/presets.ts` (`SPRING_HOVER`, `SPRING_FAN`, `SPRING_STACK`, `FLIP_NORMAL`, `FLIP_INSTANT`, `TIMING_*`, `INSTANT`).
- Reduced-motion fallback is `INSTANT` — always gate animations with `const reduced = useReducedMotion()`.
- Do not add a second animation library or a second set of timing constants anywhere in the codebase.

### Module System
- All gameplay modules are registered in `lib/modules/registry.ts` via `registerModule()`.
- Module implementations live in `lib/modules/modules/`. Follow the existing file pattern.
- The module resolver (`lib/modules/resolver.ts`) caches with a 15-second TTL and handles `onEnable` lifecycle hooks. Do not bypass it.
- New modules require: a module file, a registry entry, a seed upsert in `prisma/seed.ts`, and a UI component in `magic-modules-panel.tsx`.

### Authentication and Authorisation
- `requireAuth()` and `requireAdmin()` from `lib/auth/rbac.ts` return `{ session, response }`. Always destructure and check `response` before proceeding.
- Magic-link email auth via NextAuth — do not add password-based auth.

### Database
- ORM is Prisma. All schema changes require a migration (`npx prisma migrate dev --name <desc>`).
- Never edit existing migration files.
- Use `prisma.eventModule`, `prisma.magicModule`, `prisma.moduleInteraction` for module-related DB calls.

### Audit Logging
- Every admin or player action that mutates state must produce an audit log entry via `createAuditLog()` from `lib/audit/logger.ts`.
- Valid audit actions include: `MODULE_ENABLED`, `MODULE_DISABLED`, `MODULE_CONFIGURED`, `MODULE_EXECUTED`, `MODULE_EXECUTION_BLOCKED`, plus event/puzzle/round lifecycle actions.

### Design System
- The design system is custom Tailwind — classes `card-magic`, `btn-magic`, `input-magic`, `font-cinzel`. No shadcn, no Radix UI, no MUI.
- All UI copy is in **Italian**. Error messages, labels, toasts, and ARIA labels must be in Italian.
