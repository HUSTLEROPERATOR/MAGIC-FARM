/**
 * Disposable / temporary email domain blocklist.
 * Used to prevent prize-farming with throwaway addresses.
 * Maintain this list or switch to a third-party API for production scale.
 */

const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  // High-volume disposable providers
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.de',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  'temp-mail.io',
  'fakeinbox.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'mailnesia.com',
  'maildrop.cc',
  'discard.email',
  'discardmail.com',
  'discardmail.de',
  'mailcatch.com',
  'meltmail.com',
  'harakirimail.com',
  'jetable.org',
  'mytemp.email',
  'tempail.com',
  'tempm.com',
  'tempmailo.com',
  'tempr.email',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'fiifke.de',
  'filzmail.com',
  'gishpuppy.com',
  'incognitomail.org',
  'mailexpire.com',
  'mailforspam.com',
  'mailinator.net',
  'mailnull.com',
  'mailshell.com',
  'mailzilla.com',
  'nomail.xl.cx',
  'nospam.ze.tc',
  'pookmail.com',
  'shortmail.me',
  'spambox.us',
  'spamfree24.org',
  'spamgourmet.com',
  'temporaryemail.net',
  'temporaryforwarding.com',
  'throwawaymail.com',
  'trashymail.com',
  'trashymail.net',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wh4f.org',
  'willselfdestruct.com',
  'mailnator.com',
  'mintemail.com',
  'tempinbox.com',
  'getairmail.com',
  'crazymailing.com',
  'tmail.ws',
  'dropmail.me',
  'mohmal.com',
  'burnermail.io',
  'guerrillamail.info',
  'grr.la',
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'emailondeck.com',
  'mailtemp.info',
]);

/**
 * Optional allowlist: if set, ONLY these domains are accepted.
 * Leave empty to accept all non-blocked domains.
 * Populate via ALLOWED_EMAIL_DOMAINS env var (comma-separated).
 */
function getAllowedDomains(): Set<string> {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS || '';
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Additional blocked domains from env var (comma-separated).
 */
function getExtraBlockedDomains(): Set<string> {
  const raw = process.env.BLOCKED_EMAIL_DOMAINS || '';
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Extract domain from an email address.
 */
function extractDomain(email: string): string {
  return email.split('@').pop()?.toLowerCase() || '';
}

/**
 * Check if an email domain is disposable / blocked.
 * Returns { allowed: boolean; reason?: string }
 */
export function checkEmailDomain(email: string): { allowed: boolean; reason?: string } {
  const domain = extractDomain(email);
  if (!domain) {
    return { allowed: false, reason: 'INVALID_EMAIL' };
  }

  // Allowlist takes priority when configured
  const allowedDomains = getAllowedDomains();
  if (allowedDomains.size > 0) {
    if (!allowedDomains.has(domain)) {
      return { allowed: false, reason: 'DOMAIN_NOT_ALLOWED' };
    }
    return { allowed: true };
  }

  // Check blocklist (built-in + env)
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { allowed: false, reason: 'DISPOSABLE_DOMAIN' };
  }

  const extraBlocked = getExtraBlockedDomains();
  if (extraBlocked.has(domain)) {
    return { allowed: false, reason: 'BLOCKED_DOMAIN' };
  }

  return { allowed: true };
}

/**
 * Check if an email is eligible to receive invites.
 * Combines domain check with verified email requirement.
 */
export function isEmailEligibleForInvite(
  email: string,
  emailVerified: Date | null
): { eligible: boolean; reason?: string } {
  // Must have verified email
  if (!emailVerified) {
    return { eligible: false, reason: 'EMAIL_NOT_VERIFIED' };
  }

  // Must not be a disposable domain
  const domainCheck = checkEmailDomain(email);
  if (!domainCheck.allowed) {
    return { eligible: false, reason: domainCheck.reason };
  }

  return { eligible: true };
}
