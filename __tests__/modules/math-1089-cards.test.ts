import { describe, it, expect } from 'vitest';
import { math1089Cards } from '@/lib/modules/modules/math-1089-cards';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, targetCard: '9 di Cuori' };

describe('MATH_1089_CARDS', () => {
  it('has correct key and meta', () => {
    expect(math1089Cards.key).toBe('MATH_1089_CARDS');
    expect(math1089Cards.meta.scope).toBe('user');
    expect(math1089Cards.meta.difficulty).toBe('base');
  });

  it('accepts valid config', () => {
    const config = math1089Cards.validateConfig(BASE_CONFIG);
    expect(config.targetCard).toBe('9 di Cuori');
  });

  it('rejects empty targetCard', () => {
    expect(() => math1089Cards.validateConfig({ ...BASE_CONFIG, targetCard: '' })).toThrow();
  });

  it('validates step input', () => {
    expect(math1089Cards.validateInput!({ step: 0 }).step).toBe(0);
    expect(math1089Cards.validateInput!({ step: 3 }).step).toBe(3);
  });

  it('is always available', async () => {
    const config = math1089Cards.validateConfig(BASE_CONFIG);
    expect(await math1089Cards.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: returns instruction for first step', async () => {
    const config = math1089Cards.validateConfig(BASE_CONFIG);
    const result = await math1089Cards.run(CTX, config, { step: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
    expect(typeof result.data!.instruction).toBe('string');
  });

  it('step 1: subtraction instruction', async () => {
    const config = math1089Cards.validateConfig(BASE_CONFIG);
    const result = await math1089Cards.run(CTX, config, { step: 1 });
    expect(result.data!.nextStep).toBe(2);
  });

  it('step 2: addition instruction', async () => {
    const config = math1089Cards.validateConfig(BASE_CONFIG);
    const result = await math1089Cards.run(CTX, config, { step: 2 });
    expect(result.data!.nextStep).toBe(3);
  });

  it('step 3: reveals 1089 and targetCard', async () => {
    const config = math1089Cards.validateConfig(BASE_CONFIG);
    const result = await math1089Cards.run(CTX, config, { step: 3 });
    expect(result.success).toBe(true);
    expect(result.data!.result).toBe(1089);
    expect(result.data!.targetCard).toBe('9 di Cuori');
    expect(result.data!.reveal).toBe(true);
    expect(result.data!.isLastStep).toBe(true);
  });
});
