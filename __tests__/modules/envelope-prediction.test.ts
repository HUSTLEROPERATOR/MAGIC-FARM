import { describe, it, expect } from 'vitest';
import { envelopePrediction } from '@/lib/modules/modules/envelope-prediction';

describe('ENVELOPE_PREDICTION', () => {
  it('has correct key and meta', () => {
    expect(envelopePrediction.key).toBe('ENVELOPE_PREDICTION');
    expect(envelopePrediction.meta.scope).toBe('table');
    expect(envelopePrediction.meta.difficulty).toBe('avanzato');
    expect(envelopePrediction.meta.priority).toBe(5);
  });

  it('validates config', () => {
    const config = envelopePrediction.validateConfig({
      configVersion: 1, revealAt: 'end_round', outputFormat: 'La carta scelta sara: {{prediction}}', tableScope: 'tavolo',
    });
    expect(config.revealAt).toBe('end_round');
  });

  it('rejects config with invalid revealAt', () => {
    expect(() => envelopePrediction.validateConfig({
      configVersion: 1, revealAt: 'never', outputFormat: 'x', tableScope: 'tavolo',
    })).toThrow();
  });

  it('isAvailable when roundId exists', async () => {
    const config = envelopePrediction.validateConfig({ configVersion: 1, revealAt: 'end_round', outputFormat: 'x', tableScope: 'tavolo' });
    expect(await envelopePrediction.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await envelopePrediction.isAvailable({ eventNightId: 'e1' }, config)).toBe(false);
  });

  it('has no validateInput (player does not interact)', () => {
    expect(envelopePrediction.validateInput).toBeUndefined();
  });

  it('has onEnable hook', () => {
    expect(envelopePrediction.onEnable).toBeDefined();
  });
});
