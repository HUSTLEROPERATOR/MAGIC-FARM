import { describe, it, expect } from 'vitest';
import { syncedCardThought } from '@/lib/modules/modules/synced-card-thought';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, targetCard: '7 di Cuori' };

describe('SYNCED_CARD_THOUGHT', () => {
  it('has correct key and meta', () => {
    expect(syncedCardThought.key).toBe('SYNCED_CARD_THOUGHT');
    expect(syncedCardThought.meta.scope).toBe('global');
    expect(syncedCardThought.meta.difficulty).toBe('base');
  });

  it('accepts valid config', () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    expect(config.targetCard).toBe('7 di Cuori');
  });

  it('rejects empty targetCard', () => {
    expect(() => syncedCardThought.validateConfig({ ...BASE_CONFIG, targetCard: '' })).toThrow();
  });

  it('is always available', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    expect(await syncedCardThought.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: think of a number', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
    expect(result.data!.synchronizedMessage).toBeTruthy();
  });

  it('step 1: multiply instruction', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 1 });
    expect(result.data!.nextStep).toBe(2);
  });

  it('step 2: add 54 instruction', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 2 });
    expect(result.data!.nextStep).toBe(3);
  });

  it('step 3: divide instruction', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 3 });
    expect(result.data!.nextStep).toBe(4);
  });

  it('step 4: subtract original number', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 4 });
    expect(result.data!.nextStep).toBe(5);
  });

  it('step 5: final reveal with result 27 and targetCard', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 5 });
    expect(result.success).toBe(true);
    expect(result.data!.result).toBe(27);
    expect(result.data!.targetCard).toBe('7 di Cuori');
    expect(result.data!.reveal).toBe(true);
    expect(result.data!.isLastStep).toBe(true);
    expect(result.data!.synchronizedReveal).toBe(true);
  });

  it('audit includes step and targetCard at final step', async () => {
    const config = syncedCardThought.validateConfig(BASE_CONFIG);
    const result = await syncedCardThought.run(CTX, config, { step: 5 });
    expect(result.audit?.targetCard).toBe('7 di Cuori');
    expect(result.audit?.step).toBe(5);
  });
});
