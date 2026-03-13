# Security Model

## Overview

Magic Farm is a Next.js 14 App Router application for magic-show event management. This document describes the security controls that are implemented in the codebase today. It does not describe aspirational or planned controls.

---

## Authentication and Session Model

### Mechanism

Authentication is magic-link only. There are no passwords. Users submit their email address; NextAuth `EmailProvider` sends a one-time link via SMTP. The link is single-use and time-limited by NextAuth.

### Session strategy

- **Strategy**: JWT (`next-auth` session strategy `'jwt'`)
- **Token max age**: 30 days (`maxAge: 30 * 24 * 60 * 60`)
- **Token refresh age**: 24 hours (`updateAge: 24 * 60 * 60`)
- **Storage**: HttpOnly cookie, signed with `NEXTAUTH_SECRET`
- **Payload**: `id`, `alias`, `firstName`, `lastName`, `role`, `onboardingComplete`, `consentsComplete`

### Role enforcement at JWT level

On every periodic token refresh (when there is no `trigger`), the JWT callback re-fetches `role` and `deletedAt` from the database. If the user is soft-deleted, the refreshed token will reflect the blocked state on the next request. Role changes take effect without requiring sign-out.

### Soft-deleted user block

In the `signIn` callback, any user whose `deletedAt` field is set is blocked from signing in immediately. `signIn` returns `false`, which NextAuth treats as a denied sign-in.

### Magic-link request endpoint

`POST /api/auth/request-link` performs the following before the actual magic link is sent by NextAuth:

1. Validates the email with Zod (`.email()` check)
2. Rate-limits by `SHA-256(ip):SHA-256(email)` combination (5 per 15 minutes)
3. Writes an `AUTH_MAGIC_LINK_REQUESTED` audit log with hashed email and hashed IP; raw values are never stored

The actual magic link is generated and sent by NextAuth at `/api/auth/signin/email`, which is a separate internal endpoint.

---

## Access Control Model

### Middleware (`middleware.ts`)

`next-auth/middleware` (`withAuth`) enforces authentication on every request matching the catch-all pattern `/((?!_next/static|_next/image|favicon.ico|.*\..*).*)`  .

**Public routes** (no authentication required):

| Path | Notes |
|---|---|
| `/` (exact) | Landing page |
| `/login` | Sign-in page |
| `/verify-request` | Post-magic-link page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/api/auth/*` | NextAuth internal routes |

All other routes require a valid JWT. Unauthenticated requests are redirected to `/login`.

**Authenticated users pass through a sequential gate in the middleware**:

1. **Onboarding gate** — users without `onboardingComplete` are redirected to `/onboarding`.
2. **Alias gate** — users without `alias` are redirected to `/setup-alias`.
3. **Consent gate** — requests to paths beginning with `/serate` or `/game` require `consentsComplete`. Users who have not completed consent are redirected to `/consents`.
4. **Admin gate** — requests to paths beginning with `/admin` require `role === 'ADMIN'`; all other authenticated users are redirected to `/dashboard`.
5. **Flow page guard** — fully onboarded users attempting to revisit `/onboarding` or `/setup-alias` are redirected to `/dashboard`.

API routes (`/api/*`) and static pages (`/privacy`, `/terms`) bypass steps 1–5; they are not subject to the redirect logic.

### Server-side API authorization

Two helpers in `lib/auth/rbac.ts` are called at the top of every protected API handler:

- `requireAuth()` — calls `getServerSession(authOptions)`; returns HTTP 401 if no valid session.
- `requireAdmin()` — calls `requireAuth()` then checks `session.user.role === 'ADMIN'`; returns HTTP 403 if the role check fails.

Both helpers return `{ session, response }`. Handlers must return `response` immediately if it is non-null.

**Admin-only routes** (all guarded by `requireAdmin()`):

- `POST /api/admin/events` and related event management routes
- `POST/PATCH /api/admin/puzzles`, `/api/admin/rounds`, `/api/admin/tables`, `/api/admin/hints`
- `GET/POST/PATCH /api/admin/modules`
- `POST /api/host/invite` (currently ADMIN-only; HOST role is not yet implemented)
- `GET /api/host/top-players`

**Authenticated-user routes** (guarded by `requireAuth()` or inline `getServerSession` check):

- All `/api/serate/[eventId]/*` routes
- `/api/consents`
- `/api/user/*`
- `/api/profilo`
- `/api/submissions`, `/api/classifica`, `/api/leaderboard`

---

## Consent and Gameplay Enforcement

### Consent schema

`POST /api/consents` validates the request body with Zod. The following fields are required (`z.literal(true)`):

- `privacyAccepted` — Privacy Policy acceptance
- `termsAccepted` — Terms of Service acceptance
- `consentPlatform` — Platform usage consent (required to play)

The following are optional booleans:

- `marketingOptIn` — Marketing communications from the platform controller
- `consentControllerMarketing` — Marketing from the controller entity
- `consentShareWithHost` — Sharing identity/contact with the event host
- `consentHostMarketing` — Marketing from the event host (only stored as `true` when `consentShareWithHost` is also `true`)

### Consent evidence

Each consent record stores:

- `evidenceHash` — SHA-256 of `ip + userAgent + timestamp` (provides tamper-evident proof without storing raw IP)
- `ipAddressHash` — SHA-256 of the raw IP address; raw IP is never persisted
- `userAgent` — raw user agent string

### Consent gate enforcement

The middleware blocks access to `/serate/*` and `/game/*` unless `consentsComplete` is `true` in the JWT. `consentsComplete` is set when both `privacyAcceptedAt` and `termsAcceptedAt` are non-null in the user's most recent `Consent` record.

### Host invite consent gate

`POST /api/host/invite` skips any user who does not have both `consentShareWithHost` and `consentHostMarketing` set. Skipped users are counted in the response and in the audit log. The host never receives or sees the recipient email addresses; emails are sent by the platform on the host's behalf.

---

## Rate Limiting and Anti-Abuse

### Implementation note

All rate limiters use `RateLimiterMemory` from `rate-limiter-flexible`. State is in-process memory and is lost on server restart. Limits do not share state across multiple Node.js process instances. Keys are based on user ID, hashed IP, or a combination.

### Configured rate limiters

| Limiter | Limit | Window | Key | Applied in |
|---|---|---|---|---|
| `loginLimiter` | 5 (configurable via env) | 15 min (configurable via env) | `SHA-256(ip):SHA-256(email)` | `POST /api/auth/request-link` |
| `submitLimiter` (alias use) | 5 (configurable via env) | 30 s (configurable via env) | `alias:<userId>:<SHA-256(ip)>` | `POST /api/user/alias` — note: the limiter is named `submitLimiter` in code but is applied to alias-setting, not answer submission |
| `hintLimiter` | 3 | 5 min | `userId` | `POST /api/serate/[eventId]/hint` |
| `clueBoardLimiter` | 20 | 60 s | `userId` | `POST /api/serate/[eventId]/messages` |
| `hostInviteLimiter` | 5 | 10 min | `hostId_SHA-256(ip)` | `POST /api/host/invite` |
| `hostExportLimiter` | 10 | 10 min | caller-provided identifier | `GET /api/host/top-players` |
| `moduleExecuteLimiter` | 3 | 10 s | `userId` | `POST /api/serate/[eventId]/modules/[moduleKey]/execute` |
| `puzzleCooldownLimiter` | 1 | 5 s | `userId:puzzleId` | defined; **not yet applied** in submit handler |
| `ipSubmitLimiter` | 30 | 5 min | `SHA-256(ip)` | defined; **not yet applied** in submit handler |
| `gameJoinLimiter` | 3 | 5 min | caller-provided identifier | defined; **not yet applied** in join handler |

`loginLimiter` and `submitLimiter` defaults can be overridden via `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW`, `RATE_LIMIT_SUBMIT_MAX`, `RATE_LIMIT_SUBMIT_WINDOW` environment variables.

### Additional anti-abuse controls

**Turnstile anti-bot** (`lib/security/turnstile.ts`): `POST /api/host/invite` requires a valid Cloudflare Turnstile token. In development, the check is skipped when `TURNSTILE_SECRET_KEY` is not set. In production, a missing key or invalid token results in HTTP 403. Failures are audit-logged with `HOST_INVITE_TURNSTILE_FAIL`.

**Invite idempotency** (`lib/security/invite-idempotency.ts`): A deterministic SHA-256 batch ID is derived from `hostId + eventId + sorted(userIds)`. Within a 10-minute window, a duplicate batch is rejected with HTTP 409. The check is performed against the `audit_logs` table. Duplicates are logged with `HOST_INVITE_DUPLICATE`.

**Email domain blocklist** (`lib/security/email-blocklist.ts`): A static list of ~70 known disposable/temporary email domains is checked before processing host invites. Additional domains can be blocked via the `BLOCKED_EMAIL_DOMAINS` environment variable (comma-separated). An allowlist mode is available via `ALLOWED_EMAIL_DOMAINS` (when set, only those domains are accepted). Verified-email status is also required for invite eligibility.

**Duplicate submission guard**: The submit handler (`POST /api/serate/[eventId]/submit`) checks the database for an existing `isCorrect: true` submission before processing. A second correct answer is rejected with HTTP 400.

**Module interaction idempotency**: The module execute handler returns a cached result for interactions already marked `COMPLETED` with a terminal state (`isLastStep: true` or `reveal: true`), preventing double-execution and double-scoring.

**Clue board message length**: Messages are capped at 500 characters server-side. The POST handler rejects longer messages with HTTP 400.

---

## Data Handling and Storage Protections

### Answer hashing

Puzzle answers are stored as `(SHA-256(answer + salt), salt)` pairs. The plaintext answer is never persisted. Verification uses `verifyHash()` which recomputes the hash and compares with constant-time string equality (native JS `===`; not a timing-safe comparison — see Known Limitations).

### Join code hashing

Table join codes are generated with `generateJoinCode()`, which uses `crypto.randomBytes(6)` to produce a 6-character alphanumeric code. The code is stored as a salted SHA-256 hash. Verification uses the same `verifyHash()` path.

### IP address handling

`hashIP(ip)` applies SHA-256 (no salt) to the raw IP before storage. This is a consistent one-way hash: the raw IP is never written to any database table. The hash is stored in `audit_logs.ipHash` and `consents.ipAddressHash`.

### AES encryption

`lib/security/crypto.ts` exports `encrypt()` and `decrypt()` using AES via `crypto-js`, keyed from `ENCRYPTION_KEY`. In production, the function throws at call time if `ENCRYPTION_KEY` is not set or equals the default placeholder value. In development, the default key is used with a console warning.

### Email addresses in audit logs

Email addresses passed to `createAuditLog` are stored as SHA-256 hashes (using the same `hashIP` function). Plaintext email is never written to the audit log.

### Security response headers

Set globally via `next.config.js` for all routes:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

No `Content-Security-Policy` header is currently configured.

### CSRF

NextAuth provides built-in CSRF token protection on all state-mutating endpoints (sign-in, sign-out, magic-link callback). No custom CSRF implementation is present.

---

## Audit Logging

All audit logs are written by `createAuditLog()` in `lib/audit/logger.ts`. The function never throws; internal errors are printed to the console but do not propagate to the caller.

Every log entry automatically receives:
- `requestId` — a `crypto.randomUUID()` per-request correlation ID
- `ipHash` — SHA-256 of the raw IP when `ipAddress` is provided (raw IP never persisted)
- `userAgent` — stored as provided; contains no personal data transformation

### Logged actions

**Authentication**
- `USER_REGISTER` — new account on first sign-in
- `USER_LOGIN` — subsequent sign-ins
- `AUTH_MAGIC_LINK_REQUESTED` — magic link request (email stored as hash)
- `EMAIL_VERIFIED` — email address verified by NextAuth
- `USER_LOGOUT` — sign-out event

**Onboarding and profile**
- `ONBOARDING_COMPLETED` — profile name submitted
- `ALIAS_ATTEMPT` — alias set attempt
- `ALIAS_SET_SUCCESS` / `ALIAS_SET_CONFLICT` / `ALIAS_SET_FAILURE` — alias operation outcomes

**Consent**
- `CONSENT_UPDATED` — any consent write (includes all field values, no PII)
- `CONSENT_REVOKED` — consent withdrawal
- `PRIVACY_ACCEPTED` / `MARKETING_OPT_IN` / `MARKETING_OPT_OUT` — granular consent events

**Gameplay**
- `GAME_JOIN` — user joins an event
- `TABLE_JOIN` / `TABLE_LEAVE` — table membership changes
- `ANSWER_SUBMITTED` — answer submission
- `HINT_REQUESTED` — hint unlock

**Admin operations**
- `ADMIN_EVENT_CREATE` / `ADMIN_EVENT_UPDATE`
- `ADMIN_ROUND_CREATE` / `ADMIN_ROUND_UPDATE`
- `ADMIN_PUZZLE_CREATE`
- `ADMIN_TABLE_CREATE`
- `ADMIN_MESSAGE_HIDDEN`
- `ADMIN_USER_BANNED`
- `ADMIN_CONSENT_EXPORT`

**Host operations**
- `HOST_INVITE_SENT` — invite batch dispatched (includes sentCount, skippedCount, failedCount, eligibilityFailures)
- `HOST_INVITE_RATE_LIMIT` — invite request blocked by rate limiter
- `HOST_INVITE_DUPLICATE` — duplicate batch rejected
- `HOST_INVITE_TURNSTILE_FAIL` — Turnstile verification failed
- `HOST_EXPORT_ATTEMPT` — top-players export requested
- `HOST_EXPORT_RATE_LIMIT` — export blocked by rate limiter

**Anti-cheat**
- `SUBMISSION_COOLDOWN_BLOCKED` — per-puzzle cooldown triggered
- `SUBMISSION_IP_PATTERN_BLOCKED` — IP-based submission pattern blocked

**Privacy / account lifecycle**
- `USER_DATA_EXPORT` — GDPR data export request
- `USER_DELETE_REQUEST` / `USER_DELETED` — deletion request and completion

**Magic Modules**
- `MODULE_ENABLED` / `MODULE_DISABLED` / `MODULE_CONFIGURED`
- `MODULE_EXECUTED` — successful module execution
- `MODULE_EXECUTION_BLOCKED` — module execution rejected

**Mentalism engine**
- `MENTALISM_FIRMA_LOCKED` / `MENTALISM_FIRMA_REVEALED`
- `MENTALISM_THOUGHT_SUBMITTED`
- `MENTALISM_MEMORIA_SAVED`
- `MENTALISM_IDENTITY_REVEALED`

---

## Known Limitations and Future Hardening Opportunities

The following are verified gaps in the current implementation. They are documented here to prevent the security model from being misrepresented as complete.

1. **Answer submission route has no rate limiting.** `POST /api/serate/[eventId]/submit` does not call `rateLimitSubmission`, `rateLimitPuzzleCooldown`, or `rateLimitIPSubmissions`. The three relevant rate limiters are defined and functional in `lib/security/rate-limit.ts` but are not wired into the submit handler.

2. **Game join route has no rate limiting.** `POST /api/serate/[eventId]/join` does not call `rateLimitGameJoin`. The limiter is defined but not applied.

3. **Anti-cheat detection not active.** `detectSuspiciousActivity()` is defined in `lib/game/scoring.ts` but is never called from the submit route. Suspicious submission patterns are not flagged.

4. **In-memory rate limiters do not survive restarts or scale horizontally.** All `RateLimiterMemory` instances reset when the process restarts. In a multi-instance deployment, limits are enforced per-instance only.

5. **No Content-Security-Policy header.** `next.config.js` does not configure a CSP. XSS mitigation relies entirely on React's output escaping.

6. **Answer hash comparison is not timing-safe.** `verifyHash()` uses JavaScript `===` for string comparison. Node's `crypto.timingSafeEqual` is not used, leaving a theoretical timing channel.

7. **`hostExportLimiter` and `gameJoinLimiter` have no dedicated caller key pattern** — their applied identifier is left to the call site, which must be verified per route.

8. **HOST role not implemented.** The host invite route is restricted to ADMIN. A separate HOST role exists as a TODO in the codebase but is not enforced.
