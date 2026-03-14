import { describe, it, expect } from 'vitest';
import { invisibleDeckDigital } from '@/lib/modules/modules/invisible-deck-digital';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, deckStyle: 'standard' as const };

describe('INVISIBLE_DECK_DIGITAL', () => {
  it('has correct key and meta', () => {
    expect(invisibleDeckDigital.key).toBe('INVISIBLE_DECK_DIGITAL');
    expect(invisibleDeckDigital.meta.scope).toBe('user');
    expect(invisibleDeckDigital.meta.difficulty).toBe('avanzato');
  });

  it('accepts standard deckStyle', () => {
    const config = invisibleDeckDigital.validateConfig(BASE_CONFIG);
    expect(config.deckStyle).toBe('standard');
  });

  it('accepts fantasy deckStyle', () => {
    const config = invisibleDeckDigital.validateConfig({ configVersion: 1, deckStyle: 'fantasy' });
    expect(config.deckStyle).toBe('fantasy');
  });

  it('rejects invalid deckStyle', () => {
    expect(() => invisibleDeckDigital.validateConfig({ configVersion: 1, deckStyle: 'other' })).toThrow();
  });

  it('validates input with a card name', () => {
    const input = invisibleDeckDigital.validateInput!({ namedCard: 'Re di Cuori' });
    expect(input.namedCard).toBe('Re di Cuori');
  });

  it('rejects empty namedCard', () => {
    expect(() => invisibleDeckDigital.validateInput!({ namedCard: '' })).toThrow();
  });

  it('is always available', async () => {
    const config = invisibleDeckDigital.validateConfig(BASE_CONFIG);
    expect(await invisibleDeckDigital.isAvailable(CTX, config)).toBe(true);
  });

  it('run returns success with card position', async () => {
    const config = invisibleDeckDigital.validateConfig(BASE_CONFIG);
    const result = await invisibleDeckDigital.run(CTX, config, { namedCard: 'Asso di Picche' });
    expect(result.success).toBe(true);
    expect(result.data!.namedCard).toBe('Asso di Picche');
    expect(typeof result.data!.cardPosition).toBe('number');
    expect(result.data!.cardPosition).toBeGreaterThanOrEqual(0);
    expect(result.data!.cardPosition).toBeLessThan(52);
  });

  it('run fails when card name is blank (whitespace only)', async () => {
    const config = invisibleDeckDigital.validateConfig(BASE_CONFIG);
    const result = await invisibleDeckDigital.run(CTX, config, { namedCard: '   ' });
    expect(result.success).toBe(false);
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('same card name always produces same position (deterministic)', async () => {
    const config = invisibleDeckDigital.validateConfig(BASE_CONFIG);
    const r1 = await invisibleDeckDigital.run(CTX, config, { namedCard: '7 di Cuori' });
    const r2 = await invisibleDeckDigital.run(CTX, config, { namedCard: '7 di Cuori' });
    expect(r1.data!.cardPosition).toBe(r2.data!.cardPosition);
  });

  it('audit includes namedCard and cardPosition', async () => {
    const config = invisibleDeckDigital.validateConfig(BASE_CONFIG);
    const result = await invisibleDeckDigital.run(CTX, config, { namedCard: 'Re di Fiori' });
    expect(result.audit?.namedCard).toBe('Re di Fiori');
    expect(typeof result.audit?.cardPosition).toBe('number');
  });
});
