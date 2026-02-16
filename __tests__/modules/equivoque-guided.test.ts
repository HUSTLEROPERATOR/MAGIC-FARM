import { describe, it, expect } from 'vitest';
import { equivoqueGuided } from '@/lib/modules/modules/equivoque-guided';

describe('EQUIVOQUE_GUIDED', () => {
  it('has correct key and meta', () => {
    expect(equivoqueGuided.key).toBe('EQUIVOQUE_GUIDED');
    expect(equivoqueGuided.meta.scope).toBe('user');
    expect(equivoqueGuided.meta.difficulty).toBe('intermedio');
  });

  it('validates config', () => {
    const config = equivoqueGuided.validateConfig({
      configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic',
    });
    expect(config.revealStyle).toBe('dramatic');
  });

  it('rejects config without scriptVariant', () => {
    expect(() => equivoqueGuided.validateConfig({ configVersion: 1, revealStyle: 'dramatic' })).toThrow();
  });

  it('isAvailable when roundId exists', async () => {
    const config = equivoqueGuided.validateConfig({ configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic' });
    expect(await equivoqueGuided.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await equivoqueGuided.isAvailable({ eventNightId: 'e1' }, config)).toBe(false);
  });

  it('validates input with step and choice', () => {
    const input = equivoqueGuided.validateInput!({ step: 1, choice: 'left' });
    expect(input.step).toBe(1);
  });

  it('run returns success', async () => {
    const config = equivoqueGuided.validateConfig({ configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic' });
    const result = await equivoqueGuided.run({ eventNightId: 'e1', roundId: 'r1', userId: 'u1' }, config, { step: 0, choice: 'left' });
    expect(result.success).toBe(true);
  });
});
