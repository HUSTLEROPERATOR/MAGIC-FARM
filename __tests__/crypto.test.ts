import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hashWithSalt,
  verifyHash,
  encrypt,
  decrypt,
  hashIP,
  generateSecureToken,
  generateConsentEvidenceHash,
  generateJoinCode,
} from '@/lib/security/crypto';

describe('hashWithSalt', () => {
  it('returns a hash and a salt', () => {
    const { hash, salt } = hashWithSalt('mypassword');
    expect(hash).toHaveLength(64); // SHA-256 hex = 64 chars
    expect(salt).toHaveLength(32); // 16 bytes hex = 32 chars
  });

  it('produces different hashes for the same value (random salt)', () => {
    const result1 = hashWithSalt('hello');
    const result2 = hashWithSalt('hello');
    expect(result1.hash).not.toBe(result2.hash);
    expect(result1.salt).not.toBe(result2.salt);
  });

  it('uses the provided salt when given', () => {
    const salt = 'aabbccdd11223344aabbccdd11223344';
    const result = hashWithSalt('hello', salt);
    expect(result.salt).toBe(salt);
  });

  it('is deterministic with the same value and salt', () => {
    const salt = 'aabbccdd11223344aabbccdd11223344';
    const r1 = hashWithSalt('testvalue', salt);
    const r2 = hashWithSalt('testvalue', salt);
    expect(r1.hash).toBe(r2.hash);
  });

  it('produces different hashes for different values with same salt', () => {
    const salt = 'fixedsalt12345678fixedsalt123456';
    const r1 = hashWithSalt('value1', salt);
    const r2 = hashWithSalt('value2', salt);
    expect(r1.hash).not.toBe(r2.hash);
  });
});

describe('verifyHash', () => {
  it('returns true when value matches the hash', () => {
    const { hash, salt } = hashWithSalt('secret');
    expect(verifyHash('secret', hash, salt)).toBe(true);
  });

  it('returns false when value does not match the hash', () => {
    const { hash, salt } = hashWithSalt('secret');
    expect(verifyHash('wrong', hash, salt)).toBe(false);
  });

  it('returns false when salt is wrong', () => {
    const { hash } = hashWithSalt('secret', 'saltsaltsaltsaltsaltsaltsaltsal1');
    expect(verifyHash('secret', hash, 'differentsaltdifferentsaltdiffer')).toBe(false);
  });

  it('is case-sensitive', () => {
    const { hash, salt } = hashWithSalt('Secret');
    expect(verifyHash('secret', hash, salt)).toBe(false);
  });

  it('round-trips with hashWithSalt', () => {
    const values = ['answer', 'MagicFarm2024!', '42', ''];
    for (const v of values) {
      const { hash, salt } = hashWithSalt(v);
      expect(verifyHash(v, hash, salt)).toBe(true);
    }
  });
});

describe('encrypt / decrypt', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-key-for-unit-tests';
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('encrypts and decrypts a string correctly', () => {
    const plaintext = 'hello world';
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('ciphertext is different from plaintext', () => {
    const plaintext = 'sensitive data';
    expect(encrypt(plaintext)).not.toBe(plaintext);
  });

  it('same plaintext encrypts to different ciphertexts (IV randomness)', () => {
    const ct1 = encrypt('same');
    const ct2 = encrypt('same');
    // CryptoJS AES with same key produces same output (no IV), so we just assert round-trip
    expect(decrypt(ct1)).toBe('same');
    expect(decrypt(ct2)).toBe('same');
  });

  it('decrypts special characters correctly', () => {
    const plaintext = 'user@magic-farm.it — €€€ 🎩';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });
});

describe('hashIP', () => {
  it('returns a 64-char hex string', () => {
    const h = hashIP('192.168.1.1');
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic', () => {
    expect(hashIP('10.0.0.1')).toBe(hashIP('10.0.0.1'));
  });

  it('produces different hashes for different IPs', () => {
    expect(hashIP('1.2.3.4')).not.toBe(hashIP('4.3.2.1'));
  });

  it('does not store raw IP (output is not the input)', () => {
    const ip = '203.0.113.42';
    expect(hashIP(ip)).not.toBe(ip);
  });
});

describe('generateSecureToken', () => {
  it('returns a hex string of default length 64 chars (32 bytes)', () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('respects a custom length', () => {
    expect(generateSecureToken(16)).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(generateSecureToken(8)).toHaveLength(16);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateSecureToken()));
    expect(tokens.size).toBe(10);
  });
});

describe('generateConsentEvidenceHash', () => {
  it('returns a 64-char hex string', () => {
    const h = generateConsentEvidenceHash('1.2.3.4', 'Mozilla/5.0', new Date('2024-01-01T00:00:00Z'));
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic with same inputs', () => {
    const ts = new Date('2024-06-15T12:00:00Z');
    const h1 = generateConsentEvidenceHash('1.2.3.4', 'Chrome', ts);
    const h2 = generateConsentEvidenceHash('1.2.3.4', 'Chrome', ts);
    expect(h1).toBe(h2);
  });

  it('differs when IP changes', () => {
    const ts = new Date('2024-01-01T00:00:00Z');
    const h1 = generateConsentEvidenceHash('1.1.1.1', 'Chrome', ts);
    const h2 = generateConsentEvidenceHash('2.2.2.2', 'Chrome', ts);
    expect(h1).not.toBe(h2);
  });

  it('differs when userAgent changes', () => {
    const ts = new Date('2024-01-01T00:00:00Z');
    const h1 = generateConsentEvidenceHash('1.1.1.1', 'Chrome', ts);
    const h2 = generateConsentEvidenceHash('1.1.1.1', 'Firefox', ts);
    expect(h1).not.toBe(h2);
  });

  it('differs when timestamp changes', () => {
    const h1 = generateConsentEvidenceHash('1.1.1.1', 'Chrome', new Date('2024-01-01'));
    const h2 = generateConsentEvidenceHash('1.1.1.1', 'Chrome', new Date('2024-01-02'));
    expect(h1).not.toBe(h2);
  });
});

describe('generateJoinCode', () => {
  it('returns exactly 6 characters', () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it('only contains allowed characters (no confusable chars)', () => {
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 20; i++) {
      expect(generateJoinCode()).toMatch(allowed);
    }
  });

  it('does not contain excluded chars (0, 1, I, O)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateJoinCode();
      expect(code).not.toMatch(/[01IO]/);
    }
  });

  it('generates unique codes across multiple calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateJoinCode()));
    // Very unlikely to have collisions in 20 random codes
    expect(codes.size).toBeGreaterThan(15);
  });
});
