import { describe, it, expect } from 'vitest';
import { predictionHash } from '@/lib/modules/modules/prediction-hash';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = {
  configVersion: 1 as const,
  predictionText: "La carta scelta sarà l'Asso di Picche nel round finale.",
  showHashImmediately: true,
};

describe('PREDICTION_HASH', () => {
  it('has correct key and meta', () => {
    expect(predictionHash.key).toBe('PREDICTION_HASH');
    expect(predictionHash.meta.scope).toBe('global');
    expect(predictionHash.meta.difficulty).toBe('avanzato');
    expect(predictionHash.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = predictionHash.validateConfig(BASE_CONFIG);
    expect(config.predictionText).toBe(BASE_CONFIG.predictionText);
    expect(config.showHashImmediately).toBe(true);
  });

  it('rejects empty predictionText', () => {
    expect(() => predictionHash.validateConfig({ ...BASE_CONFIG, predictionText: '' })).toThrow();
  });

  it('validates get_hash input', () => {
    const input = predictionHash.validateInput!({ action: 'get_hash' });
    expect(input.action).toBe('get_hash');
  });

  it('validates reveal input', () => {
    const input = predictionHash.validateInput!({ action: 'reveal' });
    expect(input.action).toBe('reveal');
  });

  it('rejects unknown action', () => {
    expect(() => predictionHash.validateInput!({ action: 'unknown' })).toThrow();
  });

  it('is always available', async () => {
    const config = predictionHash.validateConfig(BASE_CONFIG);
    expect(await predictionHash.isAvailable(CTX, config)).toBe(true);
  });

  it('get_hash: returns a SHA-256 hash of the prediction text', async () => {
    const config = predictionHash.validateConfig(BASE_CONFIG);
    const result = await predictionHash.run(CTX, config, { action: 'get_hash' });
    expect(result.success).toBe(true);
    expect(result.data!.hash).toHaveLength(64);
    expect(result.data!.algorithm).toBe('SHA-256');
    expect(result.data!.hash).toMatch(/^[0-9a-f]+$/);
  });

  it('get_hash and reveal produce the same hash for same prediction text', async () => {
    const config = predictionHash.validateConfig(BASE_CONFIG);
    const r1 = await predictionHash.run(CTX, config, { action: 'get_hash' });
    const r2 = await predictionHash.run(CTX, config, { action: 'reveal' });
    expect(r1.data!.hash).toBe(r2.data!.hash);
  });

  it('reveal: returns predictionText and verified flag', async () => {
    const config = predictionHash.validateConfig(BASE_CONFIG);
    const result = await predictionHash.run(CTX, config, { action: 'reveal' });
    expect(result.success).toBe(true);
    expect(result.data!.predictionText).toBe(BASE_CONFIG.predictionText);
    expect(result.data!.verified).toBe(true);
  });

  it('different prediction texts produce different hashes', async () => {
    const config1 = predictionHash.validateConfig({ ...BASE_CONFIG, predictionText: 'Asso di Picche' });
    const config2 = predictionHash.validateConfig({ ...BASE_CONFIG, predictionText: 'Re di Cuori' });
    const r1 = await predictionHash.run(CTX, config1, { action: 'get_hash' });
    const r2 = await predictionHash.run(CTX, config2, { action: 'get_hash' });
    expect(r1.data!.hash).not.toBe(r2.data!.hash);
  });

  it('audit includes action and predictionText', async () => {
    const config = predictionHash.validateConfig(BASE_CONFIG);
    const result = await predictionHash.run(CTX, config, { action: 'get_hash' });
    expect(result.audit?.action).toBe('get_hash');
    expect(result.audit?.predictionText).toBe(BASE_CONFIG.predictionText);
  });
});
