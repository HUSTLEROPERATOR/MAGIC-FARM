import { describe, it, expect } from 'vitest';
import { birthdayCardForce } from '@/lib/modules/modules/birthday-card-force';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };

describe('BIRTHDAY_CARD_FORCE', () => {
  it('has correct key and meta', () => {
    expect(birthdayCardForce.key).toBe('BIRTHDAY_CARD_FORCE');
    expect(birthdayCardForce.meta.scope).toBe('user');
    expect(birthdayCardForce.meta.difficulty).toBe('base');
  });

  it('accepts valid config', () => {
    const config = birthdayCardForce.validateConfig({ configVersion: 1 });
    expect(config.configVersion).toBe(1);
  });

  it('rejects invalid config', () => {
    expect(() => birthdayCardForce.validateConfig({})).toThrow();
  });

  it('validates valid input', () => {
    const input = birthdayCardForce.validateInput!({ day: 15, month: 6 });
    expect(input.day).toBe(15);
    expect(input.month).toBe(6);
  });

  it('rejects out-of-range day/month', () => {
    expect(() => birthdayCardForce.validateInput!({ day: 0, month: 1 })).toThrow();
    expect(() => birthdayCardForce.validateInput!({ day: 1, month: 0 })).toThrow();
    expect(() => birthdayCardForce.validateInput!({ day: 32, month: 1 })).toThrow();
    expect(() => birthdayCardForce.validateInput!({ day: 1, month: 13 })).toThrow();
  });

  it('is always available', async () => {
    const config = birthdayCardForce.validateConfig({ configVersion: 1 });
    expect(await birthdayCardForce.isAvailable(CTX, config)).toBe(true);
  });

  it('run returns a card name', async () => {
    const config = birthdayCardForce.validateConfig({ configVersion: 1 });
    const result = await birthdayCardForce.run(CTX, config, { day: 1, month: 1 });
    expect(result.success).toBe(true);
    expect(typeof result.data!.card).toBe('string');
    expect(result.data!.card.length).toBeGreaterThan(0);
  });

  it('day 1 month 1 → Asso di Picche (day%13=0 → index 0=Asso, month%4=0 → index 0=Picche)', async () => {
    const config = birthdayCardForce.validateConfig({ configVersion: 1 });
    const result = await birthdayCardForce.run(CTX, config, { day: 1, month: 1 });
    expect(result.data!.card).toBe('Asso di Picche');
  });

  it('day 14 wraps around correctly (14-1)%13=0 → Asso', async () => {
    const config = birthdayCardForce.validateConfig({ configVersion: 1 });
    const result = await birthdayCardForce.run(CTX, config, { day: 14, month: 1 });
    expect(result.data!.valore).toBe('Asso');
  });

  it('audit includes day, month and card', async () => {
    const config = birthdayCardForce.validateConfig({ configVersion: 1 });
    const result = await birthdayCardForce.run(CTX, config, { day: 7, month: 3 });
    expect(result.audit?.day).toBe(7);
    expect(result.audit?.month).toBe(3);
    expect(result.audit?.card).toBeTruthy();
  });
});
