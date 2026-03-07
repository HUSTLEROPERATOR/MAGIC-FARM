import crypto from 'crypto';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = (() => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key === 'default-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY env var must be set in production');
    }
    return 'default-key-change-in-production';
  }
  return key;
})();

/**
 * Hash a value with salt using SHA-256
 */
export function hashWithSalt(value: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(value + usedSalt)
    .digest('hex');
  return { hash, salt: usedSalt };
}

/**
 * Verify a value against a hash and salt
 */
export function verifyHash(value: string, hash: string, salt: string): boolean {
  const computed = crypto
    .createHash('sha256')
    .update(value + salt)
    .digest('hex');
  return computed === hash;
}

/**
 * Encrypt sensitive data (e.g., email addresses if needed)
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive data
 */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Hash IP address for privacy compliance
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate evidence hash for consent tracking
 */
export function generateConsentEvidenceHash(
  ip: string,
  userAgent: string,
  timestamp: Date
): string {
  const data = `${ip}|${userAgent}|${timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate short join code for tables (6 characters, alphanumeric)
 */
export function generateJoinCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars
  const randomBytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(randomBytes[i] % characters.length);
  }
  return code;
}
