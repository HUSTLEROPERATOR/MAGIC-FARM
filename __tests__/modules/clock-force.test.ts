import { describe, it, expect } from 'vitest';
import { clockForce } from '@/lib/modules/modules/clock-force';

const CTX = { eventNightId: 'e1', roundId: 'r1', userId: 'u1' };
const BASE_CONFIG = { configVersion: 1 as const, targetCard: 'Re di Cuori', clockSize: 12 };

describe('CLOCK_FORCE', () => {
  it('has correct key and meta', () => {
    expect(clockForce.key).toBe('CLOCK_FORCE');
    expect(clockForce.meta.scope).toBe('user');
    expect(clockForce.meta.magicianControlled).toBe(true);
  });

  it('accepts valid config', () => {
    const config = clockForce.validateConfig(BASE_CONFIG);
    expect(config.targetCard).toBe('Re di Cuori');
    expect(config.clockSize).toBe(12);
  });

  it('rejects clockSize out of range', () => {
    expect(() => clockForce.validateConfig({ ...BASE_CONFIG, clockSize: 7 })).toThrow();
    expect(() => clockForce.validateConfig({ ...BASE_CONFIG, clockSize: 14 })).toThrow();
  });

  it('rejects empty targetCard', () => {
    expect(() => clockForce.validateConfig({ ...BASE_CONFIG, targetCard: '' })).toThrow();
  });

  it('validates input', () => {
    const input = clockForce.validateInput!({ position: 6 });
    expect(input.position).toBe(6);
  });

  it('is always available', async () => {
    const config = clockForce.validateConfig(BASE_CONFIG);
    expect(await clockForce.isAvailable(CTX, config)).toBe(true);
  });

  it('run places targetCard at the chosen position', async () => {
    const config = clockForce.validateConfig(BASE_CONFIG);
    const result = await clockForce.run(CTX, config, { position: 3 });
    expect(result.success).toBe(true);
    expect(result.data!.clockLayout[2]).toBe('Re di Cuori');
  });

  it('clockLayout has clockSize entries', async () => {
    const config = clockForce.validateConfig(BASE_CONFIG);
    const result = await clockForce.run(CTX, config, { position: 1 });
    expect(result.data!.clockLayout).toHaveLength(12);
  });

  it('clamps position to valid range', async () => {
    const config = clockForce.validateConfig(BASE_CONFIG);
    const result = await clockForce.run(CTX, config, { position: 100 });
    expect(result.success).toBe(true);
    expect(result.data!.position).toBeLessThanOrEqual(12);
  });

  it('audit includes position and targetCard', async () => {
    const config = clockForce.validateConfig(BASE_CONFIG);
    const result = await clockForce.run(CTX, config, { position: 7 });
    expect(result.audit?.targetCard).toBe('Re di Cuori');
    expect(result.audit?.position).toBe(7);
  });
});
