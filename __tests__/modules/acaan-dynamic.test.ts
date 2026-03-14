import { describe, it, expect } from 'vitest';
import { acaanDynamic } from '@/lib/modules/modules/acaan-dynamic';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };

describe('ACAAN_DYNAMIC', () => {
  it('has correct key and meta', () => {
    expect(acaanDynamic.key).toBe('ACAAN_DYNAMIC');
    expect(acaanDynamic.meta.scope).toBe('user');
    expect(acaanDynamic.meta.difficulty).toBe('avanzato');
    expect(acaanDynamic.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config (configVersion only)', () => {
    const config = acaanDynamic.validateConfig({ configVersion: 1 });
    expect(config.configVersion).toBe(1);
  });

  it('rejects invalid config', () => {
    expect(() => acaanDynamic.validateConfig({})).toThrow();
    expect(() => acaanDynamic.validateConfig({ configVersion: 2 })).toThrow();
  });

  it('validates input correctly', () => {
    const input = acaanDynamic.validateInput!({ namedCard: 'Asso di Picche', namedPosition: 1 });
    expect(input.namedCard).toBe('Asso di Picche');
    expect(input.namedPosition).toBe(1);
  });

  it('rejects input with position out of bounds', () => {
    expect(() => acaanDynamic.validateInput!({ namedCard: 'Asso', namedPosition: 0 })).toThrow();
    expect(() => acaanDynamic.validateInput!({ namedCard: 'Asso', namedPosition: 53 })).toThrow();
  });

  it('rejects input with empty card name', () => {
    expect(() => acaanDynamic.validateInput!({ namedCard: '', namedPosition: 5 })).toThrow();
  });

  it('is always available', async () => {
    const config = acaanDynamic.validateConfig({ configVersion: 1 });
    expect(await acaanDynamic.isAvailable(CTX, config)).toBe(true);
  });

  it('run places named card at named position in the deck', async () => {
    const config = acaanDynamic.validateConfig({ configVersion: 1 });
    const result = await acaanDynamic.run(CTX, config, { namedCard: 'Re di Cuori', namedPosition: 10 });
    expect(result.success).toBe(true);
    expect(result.data!.deck[9]).toBe('Re di Cuori');
    expect(result.data!.deck).toHaveLength(52);
  });

  it('run places card at position 1 (first slot)', async () => {
    const config = acaanDynamic.validateConfig({ configVersion: 1 });
    const result = await acaanDynamic.run(CTX, config, { namedCard: 'Asso di Picche', namedPosition: 1 });
    expect(result.success).toBe(true);
    expect(result.data!.deck[0]).toBe('Asso di Picche');
  });

  it('run places card at position 52 (last slot)', async () => {
    const config = acaanDynamic.validateConfig({ configVersion: 1 });
    const result = await acaanDynamic.run(CTX, config, { namedCard: '2 di Cuori', namedPosition: 52 });
    expect(result.success).toBe(true);
    expect(result.data!.deck[51]).toBe('2 di Cuori');
  });

  it('run includes audit data', async () => {
    const config = acaanDynamic.validateConfig({ configVersion: 1 });
    const result = await acaanDynamic.run(CTX, config, { namedCard: '7 di Fiori', namedPosition: 25 });
    expect(result.audit?.namedCard).toBe('7 di Fiori');
    expect(result.audit?.namedPosition).toBe(25);
  });
});
