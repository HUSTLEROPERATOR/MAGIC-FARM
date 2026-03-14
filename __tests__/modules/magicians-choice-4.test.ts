import { describe, it, expect } from 'vitest';
import { magiciansChoice4 } from '@/lib/modules/modules/magicians-choice-4';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, targetCard: '7 di Cuori' };

describe('MAGICIANS_CHOICE_4', () => {
  it('has correct key and meta', () => {
    expect(magiciansChoice4.key).toBe('MAGICIANS_CHOICE_4');
    expect(magiciansChoice4.meta.scope).toBe('user');
    expect(magiciansChoice4.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    expect(config.targetCard).toBe('7 di Cuori');
  });

  it('rejects empty targetCard', () => {
    expect(() => magiciansChoice4.validateConfig({ ...BASE_CONFIG, targetCard: '' })).toThrow();
  });

  it('validates step input', () => {
    const input = magiciansChoice4.validateInput!({ step: 0 });
    expect(input.step).toBe(0);
  });

  it('is always available', async () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    expect(await magiciansChoice4.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: returns 4 cards and instruction', async () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    const result = await magiciansChoice4.run(CTX, config, { step: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.cards).toHaveLength(4);
    expect(result.data!.cards[0]).toBe('7 di Cuori'); // target is always at index 0
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 1: target in chosen set → kept', async () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    // chosen = [0, 2], target is at 0 → kept
    const result = await magiciansChoice4.run(CTX, config, { step: 1, chosen: [0, 2] });
    expect(result.success).toBe(true);
    expect(result.data!.remaining).toContain(0);
  });

  it('step 1: target NOT in chosen set → unchosen kept (target survives)', async () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    // chosen = [1, 2], target (0) not in chosen → remaining = [0, 3]
    const result = await magiciansChoice4.run(CTX, config, { step: 1, chosen: [1, 2] });
    expect(result.success).toBe(true);
    expect(result.data!.remaining).toContain(0);
  });

  it('step 2: always reveals targetCard', async () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    const result = await magiciansChoice4.run(CTX, config, { step: 2, chosen: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.finalCard).toBe('7 di Cuori');
    expect(result.data!.reveal).toBe(true);
    expect(result.data!.isLastStep).toBe(true);
  });

  it('step 3: explicit reveal step also returns targetCard', async () => {
    const config = magiciansChoice4.validateConfig(BASE_CONFIG);
    const result = await magiciansChoice4.run(CTX, config, { step: 3 });
    expect(result.success).toBe(true);
    expect(result.data!.finalCard).toBe('7 di Cuori');
  });
});
