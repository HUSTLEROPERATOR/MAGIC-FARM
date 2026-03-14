import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkEmailDomain, isEmailEligibleForInvite } from '@/lib/security/email-blocklist';

describe('checkEmailDomain', () => {
  describe('domini legittimi', () => {
    it('permette gmail.com', () => {
      expect(checkEmailDomain('utente@gmail.com')).toEqual({ allowed: true });
    });

    it('permette outlook.com', () => {
      expect(checkEmailDomain('utente@outlook.com')).toEqual({ allowed: true });
    });

    it('permette domini personalizzati', () => {
      expect(checkEmailDomain('info@miazienda.it')).toEqual({ allowed: true });
    });
  });

  describe('domini usa-e-getta (blocklist)', () => {
    it('blocca mailinator.com', () => {
      const result = checkEmailDomain('test@mailinator.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DISPOSABLE_DOMAIN');
    });

    it('blocca guerrillamail.com', () => {
      const result = checkEmailDomain('test@guerrillamail.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DISPOSABLE_DOMAIN');
    });

    it('blocca yopmail.com', () => {
      const result = checkEmailDomain('test@yopmail.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DISPOSABLE_DOMAIN');
    });

    it('blocca 10minutemail.com', () => {
      const result = checkEmailDomain('test@10minutemail.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DISPOSABLE_DOMAIN');
    });

    it('blocca tempmail.com', () => {
      const result = checkEmailDomain('test@tempmail.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DISPOSABLE_DOMAIN');
    });

    it('blocca trashmail.com', () => {
      const result = checkEmailDomain('test@trashmail.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DISPOSABLE_DOMAIN');
    });
  });

  describe('email non valida', () => {
    it('rifiuta stringa vuota (nessun dominio estraibile)', () => {
      const result = checkEmailDomain('');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('INVALID_EMAIL');
    });

    it('permette una stringa senza @ (il dominio viene estratto come tutta la stringa)', () => {
      // extractDomain('non-una-email') => 'non-una-email', non nella blocklist => allowed
      const result = checkEmailDomain('non-una-email');
      expect(result.allowed).toBe(true);
    });
  });

  describe('BLOCKED_EMAIL_DOMAINS via env var', () => {
    beforeEach(() => {
      vi.stubEnv('BLOCKED_EMAIL_DOMAINS', 'acme-competitor.com,spam-domain.net');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('blocca un dominio aggiunto tramite env var', () => {
      const result = checkEmailDomain('test@acme-competitor.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('BLOCKED_DOMAIN');
    });

    it('blocca il secondo dominio della lista env', () => {
      const result = checkEmailDomain('test@spam-domain.net');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('BLOCKED_DOMAIN');
    });

    it('permette ancora i domini legittimi', () => {
      expect(checkEmailDomain('utente@gmail.com')).toEqual({ allowed: true });
    });
  });

  describe('ALLOWED_EMAIL_DOMAINS via env var (allowlist)', () => {
    beforeEach(() => {
      vi.stubEnv('ALLOWED_EMAIL_DOMAINS', 'mycompany.com,partner.org');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('permette un dominio nella allowlist', () => {
      expect(checkEmailDomain('utente@mycompany.com')).toEqual({ allowed: true });
    });

    it('permette il secondo dominio nella allowlist', () => {
      expect(checkEmailDomain('utente@partner.org')).toEqual({ allowed: true });
    });

    it('blocca gmail.com quando la allowlist è attiva', () => {
      const result = checkEmailDomain('utente@gmail.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DOMAIN_NOT_ALLOWED');
    });

    it('blocca anche i domini della blocklist built-in quando la allowlist è attiva', () => {
      const result = checkEmailDomain('test@mailinator.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DOMAIN_NOT_ALLOWED');
    });
  });
});

// ---------------------------------------------------------------------------
// isEmailEligibleForInvite
// ---------------------------------------------------------------------------
describe('isEmailEligibleForInvite', () => {
  const verifiedDate = new Date('2026-01-01T00:00:00Z');

  it('ritorna eligible per un dominio legittimo con email verificata', () => {
    const result = isEmailEligibleForInvite('utente@gmail.com', verifiedDate);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rifiuta se email non è verificata (null)', () => {
    const result = isEmailEligibleForInvite('utente@gmail.com', null);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('EMAIL_NOT_VERIFIED');
  });

  it('rifiuta un dominio usa-e-getta anche con email verificata', () => {
    const result = isEmailEligibleForInvite('test@mailinator.com', verifiedDate);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('DISPOSABLE_DOMAIN');
  });

  it('permette email con formato non standard ma dominio non in blocklist', () => {
    // extractDomain('non-email') tratta la stringa come dominio => allowed
    const result = isEmailEligibleForInvite('non-email', verifiedDate);
    expect(result.eligible).toBe(true);
  });

  it('la verifica email ha precedenza sul dominio (controlla prima)', () => {
    // Anche con dominio valido, se non verificata => EMAIL_NOT_VERIFIED
    const result = isEmailEligibleForInvite('utente@gmail.com', null);
    expect(result.reason).toBe('EMAIL_NOT_VERIFIED');
  });
});
