# Privacy Implementation

## Consent Capture

### When Consent Is Collected

Consent is captured during the onboarding flow (`/onboarding`), which is mandatory before users can access any app functionality.

### What Is Collected

1. **Privacy Policy acceptance** (mandatory)
   - `privacyAcceptedAt`: Timestamp of acceptance
   - `privacyVersion`: Version string of the policy accepted (e.g., "1.0")

2. **Marketing opt-in** (optional)
   - `marketingOptInAt`: Timestamp of opt-in (if opted in)
   - `marketingOptOutAt`: Timestamp of opt-out (if opted out or not opted in)
   - `marketingVersion`: Version string of the marketing terms

### Consent Evidence

Each consent record includes cryptographic evidence:

| Field | Description |
|---|---|
| `evidenceHash` | SHA-256 hash of IP + User Agent + Timestamp |
| `ipAddressHash` | SHA-256 hash of the IP address (raw IP never stored) |
| `userAgent` | Browser user agent string |

This evidence allows verification that consent was given without storing raw IP addresses.

## Storage

Consent records are stored in the `consents` table (Prisma model `Consent`):

```
Consent {
  id                String
  userId            String    -> User
  privacyAcceptedAt DateTime?
  privacyVersion    String?
  marketingOptInAt  DateTime?
  marketingVersion  String?
  marketingOptOutAt DateTime?
  evidenceHash      String?
  ipAddressHash     String?
  userAgent         String?
  createdAt         DateTime
  updatedAt         DateTime
}
```

## Data Flow

1. User submits onboarding form with name + consent checkboxes
2. Server validates input with Zod schema
3. User record updated with `firstName`, `lastName`
4. Consent record upserted with timestamps, versions, and evidence
5. Audit log created for `ONBOARDING_COMPLETED` and `CONSENT_UPDATED`
6. JWT token updated with `onboardingComplete: true`

## IP Address Handling

IP addresses are **never stored in plaintext**. All IP-related storage uses SHA-256 one-way hashing:

- `hashIP()` in `lib/security/crypto.ts` hashes IPs before storage
- `generateConsentEvidenceHash()` combines IP + User Agent + Timestamp into a single evidence hash
- Audit logs store `ipHash` (hashed IP), never raw IP

## Consent Versioning

Privacy and marketing consent versions are tracked separately. When policies are updated:

1. Update the version constants in `app/api/user/onboarding/route.ts`
2. Update the privacy policy page at `/privacy`
3. Existing consents retain their original version for audit purposes

## User Rights (GDPR)

The system supports:

- **Right to access**: User data is available through the profile
- **Right to rectification**: Name can be updated
- **Right to erasure**: `deletedAt` soft-delete field on User model
- **Right to data portability**: Audit action `USER_DATA_EXPORT` is defined for export operations
- **Right to withdraw consent**: Marketing consent can be updated; privacy consent withdrawal requires account deletion
