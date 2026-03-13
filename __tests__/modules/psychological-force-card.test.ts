import { describe, it, expect } from 'vitest';
import { psychologicalForceCard } from '@/lib/modules/modules/psychological-force-card';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = {
  configVersion: 1 as const,
  primaryTarget: '7 di Cuori',
  alternativeTargets: ['Asso di Picche', 'Regina di Cuori'],
};

describe('PSYCHOLOGICAL_FORCE_CARD', () => {
  it('has correct key and meta', () => {
    expect(psychologicalForceCard.key).toBe('PSYCHOLOGICAL_FORCE_CARD');
    expect(psychologicalForceCard.meta.scope).toBe('user');
    expect(psychologicalForceCard.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    expect(config.primaryTarget).toBe('7 di Cuori');
    expect(config.alternativeTargets).toHaveLength(2);
  });

  it('rejects empty primaryTarget', () => {
    expect(() => psychologicalForceCard.validateConfig({ ...BASE_CONFIG, primaryTarget: '' })).toThrow();
  });

  it('is always available', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    expect(await psychologicalForceCard.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: returns psychological phrasing', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    const result = await psychologicalForceCard.run(CTX, config, { step: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.phrases).toBeDefined();
    expect(Array.isArray(result.data!.phrases)).toBe(true);
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 1: primary target match returns primary matchLevel', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    const result = await psychologicalForceCard.run(CTX, config, {
      step: 1,
      chosenCard: '7 di Cuori',
    });
    expect(result.success).toBe(true);
    expect(result.data!.matchLevel).toBe('primary');
    expect(result.data!.isLastStep).toBe(true);
  });

  it('step 1: primary match is case-insensitive', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    const result = await psychologicalForceCard.run(CTX, config, {
      step: 1,
      chosenCard: '7 DI CUORI',
    });
    expect(result.data!.matchLevel).toBe('primary');
  });

  it('step 1: alternative target match returns alternative matchLevel', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    const result = await psychologicalForceCard.run(CTX, config, {
      step: 1,
      chosenCard: 'Asso di Picche',
    });
    expect(result.success).toBe(true);
    expect(result.data!.matchLevel).toBe('alternative');
    expect(result.data!.isLastStep).toBe(true);
  });

  it('step 1: unrecognized card returns fallback matchLevel', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    const result = await psychologicalForceCard.run(CTX, config, {
      step: 1,
      chosenCard: '3 di Fiori',
    });
    expect(result.success).toBe(true);
    expect(result.data!.matchLevel).toBe('fallback');
    expect(result.data!.isLastStep).toBe(true);
  });

  it('audit includes chosenCard and isTarget', async () => {
    const config = psychologicalForceCard.validateConfig(BASE_CONFIG);
    const result = await psychologicalForceCard.run(CTX, config, {
      step: 1,
      chosenCard: '7 di Cuori',
    });
    expect(result.audit?.chosenCard).toBe('7 di Cuori');
    expect(result.audit?.isTarget).toBe(true);
  });
});
