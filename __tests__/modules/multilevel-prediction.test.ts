import { describe, it, expect } from 'vitest';
import { multilevelPrediction } from '@/lib/modules/modules/multilevel-prediction';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = {
  configVersion: 1 as const,
  targetSeme: 'Cuori',
  targetValore: '7',
  targetColore: 'rosso',
  targetPosizione: 27,
};

describe('MULTILEVEL_PREDICTION', () => {
  it('has correct key and meta', () => {
    expect(multilevelPrediction.key).toBe('MULTILEVEL_PREDICTION');
    expect(multilevelPrediction.meta.scope).toBe('user');
    expect(multilevelPrediction.meta.difficulty).toBe('avanzato');
    expect(multilevelPrediction.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    expect(config.targetSeme).toBe('Cuori');
    expect(config.targetPosizione).toBe(27);
  });

  it('rejects posizione out of range', () => {
    expect(() => multilevelPrediction.validateConfig({ ...BASE_CONFIG, targetPosizione: 0 })).toThrow();
    expect(() => multilevelPrediction.validateConfig({ ...BASE_CONFIG, targetPosizione: 53 })).toThrow();
  });

  it('is always available', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    expect(await multilevelPrediction.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: returns seme prediction', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, { step: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 1: returns valore prediction', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, { step: 1, chosenSeme: 'Cuori' });
    expect(result.data!.nextStep).toBe(2);
  });

  it('step 2: returns colore prediction', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, {
      step: 2, chosenSeme: 'Cuori', chosenValore: '7',
    });
    expect(result.data!.nextStep).toBe(3);
  });

  it('step 3: returns colore reveal and posizione prompt', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, {
      step: 3, chosenSeme: 'Cuori', chosenValore: '7', chosenColore: 'rosso',
    });
    expect(result.data!.nextStep).toBe(4);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 4: final reveal with all predictions and match count', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, {
      step: 4,
      chosenSeme: 'Cuori',
      chosenValore: '7',
      chosenColore: 'rosso',
      chosenPosizione: 27,
    });
    expect(result.success).toBe(true);
    expect(result.data!.reveal).toBe(true);
    expect(result.data!.isLastStep).toBe(true);
    expect(result.data!.totalMatches).toBe(4);
  });

  it('step 4: partial match counts correctly', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, {
      step: 4,
      chosenSeme: 'Picche', // wrong
      chosenValore: '7',    // correct
      chosenColore: 'rosso',// correct
      chosenPosizione: 1,   // wrong
    });
    expect(result.data!.totalMatches).toBe(2);
  });

  it('audit includes all targets and step', async () => {
    const config = multilevelPrediction.validateConfig(BASE_CONFIG);
    const result = await multilevelPrediction.run(CTX, config, {
      step: 4, chosenSeme: 'Cuori', chosenValore: '7', chosenColore: 'rosso', chosenPosizione: 27,
    });
    expect(result.audit?.targetSeme).toBe('Cuori');
    expect(result.audit?.targetValore).toBe('7');
    expect(result.audit?.totalMatches).toBe(4);
  });
});
