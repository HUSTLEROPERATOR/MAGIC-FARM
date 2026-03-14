import { describe, it, expect } from 'vitest';
import { sharedImpossibleCard } from '@/lib/modules/modules/shared-impossible-card';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = {
  configVersion: 1 as const,
  targetCombination: ['Asso di Picche', 'Re di Cuori', 'Regina di Quadri'],
  revealMessage: 'Le carte dei vostri tavoli formano la combinazione impossibile!',
};

describe('SHARED_IMPOSSIBLE_CARD', () => {
  it('has correct key and meta', () => {
    expect(sharedImpossibleCard.key).toBe('SHARED_IMPOSSIBLE_CARD');
    expect(sharedImpossibleCard.meta.scope).toBe('table');
    expect(sharedImpossibleCard.meta.difficulty).toBe('avanzato');
  });

  it('accepts valid config', () => {
    const config = sharedImpossibleCard.validateConfig(BASE_CONFIG);
    expect(config.targetCombination).toHaveLength(3);
    expect(config.revealMessage).toBeTruthy();
  });

  it('rejects empty targetCombination', () => {
    expect(() => sharedImpossibleCard.validateConfig({ ...BASE_CONFIG, targetCombination: [] })).toThrow();
  });

  it('validates get_assignment action', () => {
    const input = sharedImpossibleCard.validateInput!({ tableIndex: 0, action: 'get_assignment' });
    expect(input.action).toBe('get_assignment');
    expect(input.tableIndex).toBe(0);
  });

  it('validates reveal_combination action', () => {
    const input = sharedImpossibleCard.validateInput!({ tableIndex: 0, action: 'reveal_combination' });
    expect(input.action).toBe('reveal_combination');
  });

  it('rejects unknown action', () => {
    expect(() => sharedImpossibleCard.validateInput!({ tableIndex: 0, action: 'other' })).toThrow();
  });

  it('is always available', async () => {
    const config = sharedImpossibleCard.validateConfig(BASE_CONFIG);
    expect(await sharedImpossibleCard.isAvailable(CTX, config)).toBe(true);
  });

  it('get_assignment: table 0 gets first card', async () => {
    const config = sharedImpossibleCard.validateConfig(BASE_CONFIG);
    const result = await sharedImpossibleCard.run(CTX, config, { tableIndex: 0, action: 'get_assignment' });
    expect(result.success).toBe(true);
    expect(result.data!.assignedCard).toBe('Asso di Picche');
    expect(result.data!.sealed).toBe(true);
  });

  it('get_assignment: wraps around using modulo', async () => {
    const config = sharedImpossibleCard.validateConfig(BASE_CONFIG);
    // tableIndex 3 → 3 % 3 = 0 → same as tableIndex 0
    const r0 = await sharedImpossibleCard.run(CTX, config, { tableIndex: 0, action: 'get_assignment' });
    const r3 = await sharedImpossibleCard.run(CTX, config, { tableIndex: 3, action: 'get_assignment' });
    expect(r0.data!.assignedCard).toBe(r3.data!.assignedCard);
  });

  it('reveal_combination: returns full combination and revealMessage', async () => {
    const config = sharedImpossibleCard.validateConfig(BASE_CONFIG);
    const result = await sharedImpossibleCard.run(CTX, config, { tableIndex: 0, action: 'reveal_combination' });
    expect(result.success).toBe(true);
    expect(result.data!.combination).toEqual(BASE_CONFIG.targetCombination);
    expect(result.data!.message).toBe(BASE_CONFIG.revealMessage);
    expect(result.data!.reveal).toBe(true);
  });

  it('audit includes action and tableIndex', async () => {
    const config = sharedImpossibleCard.validateConfig(BASE_CONFIG);
    const result = await sharedImpossibleCard.run(CTX, config, { tableIndex: 1, action: 'get_assignment' });
    expect(result.audit?.action).toBe('get_assignment');
    expect(result.audit?.tableIndex).toBe(1);
  });
});
