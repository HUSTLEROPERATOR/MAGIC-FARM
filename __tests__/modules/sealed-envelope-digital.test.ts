import { describe, it, expect } from 'vitest';
import { sealedEnvelopeDigital } from '@/lib/modules/modules/sealed-envelope-digital';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = {
  configVersion: 1 as const,
  predictionText: 'La carta prescelta sarà: 7 di Cuori',
  revealPhase: 'manual' as const,
};

describe('SEALED_ENVELOPE_DIGITAL', () => {
  it('has correct key and meta', () => {
    expect(sealedEnvelopeDigital.key).toBe('SEALED_ENVELOPE_DIGITAL');
    expect(sealedEnvelopeDigital.meta.scope).toBe('table');
    expect(sealedEnvelopeDigital.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = sealedEnvelopeDigital.validateConfig(BASE_CONFIG);
    expect(config.predictionText).toBe(BASE_CONFIG.predictionText);
    expect(config.revealPhase).toBe('manual');
  });

  it('accepts end_round revealPhase', () => {
    const config = sealedEnvelopeDigital.validateConfig({ ...BASE_CONFIG, revealPhase: 'end_round' });
    expect(config.revealPhase).toBe('end_round');
  });

  it('rejects invalid revealPhase', () => {
    expect(() => sealedEnvelopeDigital.validateConfig({ ...BASE_CONFIG, revealPhase: 'now' })).toThrow();
  });

  it('rejects empty predictionText', () => {
    expect(() => sealedEnvelopeDigital.validateConfig({ ...BASE_CONFIG, predictionText: '' })).toThrow();
  });

  it('validates show_seal and reveal actions', () => {
    expect(sealedEnvelopeDigital.validateInput!({ action: 'show_seal' }).action).toBe('show_seal');
    expect(sealedEnvelopeDigital.validateInput!({ action: 'reveal' }).action).toBe('reveal');
  });

  it('rejects unknown action', () => {
    expect(() => sealedEnvelopeDigital.validateInput!({ action: 'open' })).toThrow();
  });

  it('is always available', async () => {
    const config = sealedEnvelopeDigital.validateConfig(BASE_CONFIG);
    expect(await sealedEnvelopeDigital.isAvailable(CTX, config)).toBe(true);
  });

  it('show_seal: returns sealed status', async () => {
    const config = sealedEnvelopeDigital.validateConfig(BASE_CONFIG);
    const result = await sealedEnvelopeDigital.run(CTX, config, { action: 'show_seal' });
    expect(result.success).toBe(true);
    expect(result.data!.sealed).toBe(true);
    expect(result.data!.sealedAt).toBeDefined();
  });

  it('reveal: shows predictionText', async () => {
    const config = sealedEnvelopeDigital.validateConfig(BASE_CONFIG);
    const result = await sealedEnvelopeDigital.run(CTX, config, { action: 'reveal', chosenCard: '7 di Cuori' });
    expect(result.success).toBe(true);
    expect(result.data!.sealed).toBe(false);
    expect(result.data!.prediction).toBe(BASE_CONFIG.predictionText);
    expect(result.data!.match).toBe(true);
  });

  it('reveal: uses "non specificata" when chosenCard omitted', async () => {
    const config = sealedEnvelopeDigital.validateConfig(BASE_CONFIG);
    const result = await sealedEnvelopeDigital.run(CTX, config, { action: 'reveal' });
    expect(result.data!.chosenCard).toBe('non specificata');
  });
});
