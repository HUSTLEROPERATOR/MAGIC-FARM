# Security Model

## Threat Model

### Assets

- User personal data (email, name)
- Session tokens (JWT)
- Game answers and scores
- Consent records

### Threats and Mitigations

| Threat | Mitigation |
|---|---|
| **Brute-force login** | Rate limiting on magic link requests (5 per 15 min per IP+email). No passwords to brute-force. |
| **Session hijacking** | JWT tokens with NEXTAUTH_SECRET signing. HttpOnly cookies. 30-day max age. |
| **Unauthorized access** | Middleware enforces auth on all routes except explicit public paths. Onboarding gating prevents partial accounts from accessing protected features. |
| **CSRF** | NextAuth built-in CSRF token protection on all mutations. |
| **XSS** | React's built-in output escaping. CSP-compatible rendering. No `dangerouslySetInnerHTML`. |
| **Clickjacking** | X-Frame-Options: DENY header on all responses. |
| **MIME sniffing** | X-Content-Type-Options: nosniff header. |
| **Information leakage** | Generic error messages on alias conflicts. IP addresses hashed before storage. Email hashed in audit logs. |
| **Alias enumeration** | Generic "not available" message instead of "already taken". Rate limiting prevents bulk checks. |
| **Answer leakage** | Game answers stored as salted hashes (never plaintext). |
| **Privilege escalation** | Server-side session validation on all API routes. Middleware-level auth checks. |

### Authentication Flow Security

1. User submits email to `/api/auth/request-link` (rate-limited)
2. Server validates email and checks rate limit
3. NextAuth generates a one-time magic link token
4. Token sent via SMTP to user's email
5. User clicks link; NextAuth verifies token and creates JWT session
6. JWT contains: user ID, alias, name, onboarding status
7. Subsequent requests authenticated via JWT cookie

### Middleware Access Control

- **Public routes** (no auth required): `/` (exact), `/login`, `/verify-request`, `/privacy`, `/terms`, `/api/auth/*`
- **All other routes**: Require valid JWT
- **Onboarding gating**: Users without completed onboarding are redirected to `/onboarding`
- **Alias gating**: Users without alias are redirected to `/setup-alias`

### Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| Magic link request | 5 attempts | 15 minutes |
| Alias setting | 10 attempts | 60 seconds |
| Answer submission | 10 attempts | 60 seconds |
| Game join | 3 attempts | 5 minutes |
| Clue board messages | 20 messages | 60 seconds |

### Audit Logging

All security-relevant events are logged to the `audit_logs` table:

- `USER_REGISTER` - New account creation
- `USER_LOGIN` - Successful sign-in
- `AUTH_MAGIC_LINK_REQUESTED` - Magic link request (email stored as hash)
- `ONBOARDING_COMPLETED` - Profile completion
- `CONSENT_UPDATED` - Privacy/marketing consent changes
- `ALIAS_ATTEMPT` / `ALIAS_SET_SUCCESS` / `ALIAS_SET_CONFLICT` / `ALIAS_SET_FAILURE` - Alias operations

Logs include hashed IP and user agent for forensic analysis without storing PII.
