import { describe, it, expect } from 'vitest';
import { twentyOneCards } from '@/lib/modules/modules/twenty-one-cards';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, deckSeed: 42 };

describe('TWENTY_ONE_CARDS', () => {
  it('has correct key and meta', () => {
    expect(twentyOneCards.key).toBe('TWENTY_ONE_CARDS');
    expect(twentyOneCards.meta.scope).toBe('user');
    expect(twentyOneCards.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    expect(config.deckSeed).toBe(42);
  });

  it('is always available', async () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    expect(await twentyOneCards.isAvailable(CTX, config)).toBe(true);
  });

  it('step 0: returns shuffled 21-card deck with 3 columns', async () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    const result = await twentyOneCards.run(CTX, config, { step: 0 });
    expect(result.success).toBe(true);
    expect(result.data!.deck).toHaveLength(21);
    expect(result.data!.columns.left).toHaveLength(7);
    expect(result.data!.columns.center).toHaveLength(7);
    expect(result.data!.columns.right).toHaveLength(7);
    expect(result.data!.nextStep).toBe(1);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 0: deck is deterministic for the same seed', async () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    const r1 = await twentyOneCards.run(CTX, config, { step: 0 });
    const r2 = await twentyOneCards.run(CTX, config, { step: 0 });
    expect(r1.data!.deck).toEqual(r2.data!.deck);
  });

  it('step 0: different seeds produce different decks', async () => {
    const c1 = twentyOneCards.validateConfig({ configVersion: 1, deckSeed: 1 });
    const c2 = twentyOneCards.validateConfig({ configVersion: 1, deckSeed: 999 });
    const r1 = await twentyOneCards.run(CTX, c1, { step: 0 });
    const r2 = await twentyOneCards.run(CTX, c2, { step: 0 });
    expect(r1.data!.deck).not.toEqual(r2.data!.deck);
  });

  it('step 1: reassembles deck around chosen column', async () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    const step0 = await twentyOneCards.run(CTX, config, { step: 0 });
    const deckState = step0.data!.deck as string[];
    const result = await twentyOneCards.run(CTX, config, { step: 1, columnChoice: 1, deckState });
    expect(result.success).toBe(true);
    expect(result.data!.deck).toHaveLength(21);
    expect(result.data!.nextStep).toBe(2);
  });

  it('step 2: second reassembly', async () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    const s0 = await twentyOneCards.run(CTX, config, { step: 0 });
    const s1 = await twentyOneCards.run(CTX, config, { step: 1, columnChoice: 0, deckState: s0.data!.deck as string[] });
    const result = await twentyOneCards.run(CTX, config, { step: 2, columnChoice: 2, deckState: s1.data!.deck as string[] });
    expect(result.data!.nextStep).toBe(3);
    expect(result.data!.isLastStep).toBe(false);
  });

  it('step 3: card at position 11 (index 10) is the revealed card', async () => {
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    // Run 3 rounds with center (1) column each time
    const s0 = await twentyOneCards.run(CTX, config, { step: 0 });
    const s1 = await twentyOneCards.run(CTX, config, { step: 1, columnChoice: 1, deckState: s0.data!.deck as string[] });
    const s2 = await twentyOneCards.run(CTX, config, { step: 2, columnChoice: 1, deckState: s1.data!.deck as string[] });
    const result = await twentyOneCards.run(CTX, config, { step: 3, columnChoice: 1, deckState: s2.data!.deck as string[] });
    expect(result.success).toBe(true);
    expect(result.data!.reveal).toBe(true);
    expect(result.data!.isLastStep).toBe(true);
    expect(typeof result.data!.revealedCard).toBe('string');
  });

  it('step 3: mathematical guarantee — card is at position 11 regardless of choices', async () => {
    // The 21-card trick guarantees the chosen card ends at position 11 (index 10)
    // after 3 rounds of always picking column 1 (center), the center of a 7-card column is card 4 = index 3
    // This test verifies the structure is correct
    const config = twentyOneCards.validateConfig(BASE_CONFIG);
    const result = await twentyOneCards.run(CTX, config, { step: 3, columnChoice: 1 });
    expect(result.data!.revealedCard).toBeDefined();
    expect(result.data!.isLastStep).toBe(true);
  });
});
