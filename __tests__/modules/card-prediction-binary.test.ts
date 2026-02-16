import { describe, it, expect } from 'vitest';
import { cardPredictionBinary } from '@/lib/modules/modules/card-prediction-binary';

describe('CARD_PREDICTION_BINARY', () => {
  it('has correct key and meta', () => {
    expect(cardPredictionBinary.key).toBe('CARD_PREDICTION_BINARY');
    expect(cardPredictionBinary.meta.scope).toBe('user');
    expect(cardPredictionBinary.meta.difficulty).toBe('base');
  });

  it('validates config', () => {
    const config = cardPredictionBinary.validateConfig({
      configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60,
    });
    expect(config.configVersion).toBe(1);
    expect(config.roundId).toBe('r1');
  });

  it('rejects invalid config', () => {
    expect(() => cardPredictionBinary.validateConfig({ configVersion: 1 })).toThrow();
  });

  it('isAvailable when roundId matches', async () => {
    const config = cardPredictionBinary.validateConfig({
      configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60,
    });
    expect(await cardPredictionBinary.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await cardPredictionBinary.isAvailable({ eventNightId: 'e1', roundId: 'r2' }, config)).toBe(false);
  });

  it('validates input', () => {
    const input = cardPredictionBinary.validateInput!({ choice: 'rosso' });
    expect(input.choice).toBe('rosso');
  });

  it('run returns success with scoreDelta', async () => {
    const config = cardPredictionBinary.validateConfig({
      configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60,
    });
    const result = await cardPredictionBinary.run(
      { eventNightId: 'e1', roundId: 'r1', userId: 'u1' }, config, { choice: 'rosso' },
    );
    expect(result.success).toBe(true);
    expect(result.audit?.scoreDelta).toBeDefined();
  });
});
