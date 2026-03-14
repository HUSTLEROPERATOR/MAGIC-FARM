import { describe, it, expect } from 'vitest';
import { mathematicalForce27 } from '@/lib/modules/modules/mathematical-force-27';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, targetCard: 'Asso di Quadri' };

describe('MATHEMATICAL_FORCE_27', () => {
  it('has correct key and meta', () => {
    expect(mathematicalForce27.key).toBe('MATHEMATICAL_FORCE_27');
    expect(mathematicalForce27.meta.scope).toBe('user');
    expect(mathematicalForce27.meta.difficulty).toBe('base');
  });

  it('accepts valid config', () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    expect(config.targetCard).toBe('Asso di Quadri');
  });

  it('rejects empty targetCard', () => {
    expect(() => mathematicalForce27.validateConfig({ ...BASE_CONFIG, targetCard: '' })).toThrow();
  });

  it('validates input step and value', () => {
    const input = mathematicalForce27.validateInput!({ step: 0, value: 5 });
    expect(input.step).toBe(0);
    expect(input.value).toBe(5);
  });

  it('is always available', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    expect(await mathematicalForce27.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: think of a number instruction', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    const result = await mathematicalForce27.run(CTX, config, { step: 0, value: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 1: multiply instruction', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    const result = await mathematicalForce27.run(CTX, config, { step: 1, value: 0 });
    expect(result.data!.nextStep).toBe(2);
  });

  it('step 2: add 54 instruction', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    const result = await mathematicalForce27.run(CTX, config, { step: 2, value: 0 });
    expect(result.data!.nextStep).toBe(3);
  });

  it('step 3: divide instruction', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    const result = await mathematicalForce27.run(CTX, config, { step: 3, value: 0 });
    expect(result.data!.nextStep).toBe(4);
  });

  it('step 4: subtract original number instruction', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    const result = await mathematicalForce27.run(CTX, config, { step: 4, value: 0 });
    expect(result.data!.nextStep).toBe(5);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 5: reveals 27 and targetCard', async () => {
    const config = mathematicalForce27.validateConfig(BASE_CONFIG);
    const result = await mathematicalForce27.run(CTX, config, { step: 5, value: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.result).toBe(27);
    expect(result.data!.targetCard).toBe('Asso di Quadri');
    expect(result.data!.isLastStep).toBe(true);
  });
});
