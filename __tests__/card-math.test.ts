import { describe, it, expect } from 'vitest';
import { fanPosition, zIndexCalculation } from '@/lib/cards/cardMath';

// ---------------------------------------------------------------------------
// fanPosition
// ---------------------------------------------------------------------------
describe('fanPosition', () => {
  describe('caso con carta singola', () => {
    it('ritorna x=0, y=0, rotate=0 per una sola carta', () => {
      expect(fanPosition(0, 1)).toEqual({ x: 0, y: 0, rotate: 0 });
    });
  });

  describe('caso con due carte', () => {
    it('prima carta ha rotazione negativa', () => {
      const pos = fanPosition(0, 2);
      expect(pos.rotate).toBeLessThan(0);
    });

    it('seconda carta ha rotazione positiva', () => {
      const pos = fanPosition(1, 2);
      expect(pos.rotate).toBeGreaterThan(0);
    });

    it('le due carte sono simmetriche rispetto alla rotazione', () => {
      const first = fanPosition(0, 2);
      const last = fanPosition(1, 2);
      expect(Math.abs(first.rotate)).toBeCloseTo(Math.abs(last.rotate), 5);
    });
  });

  describe('simmetria della mano', () => {
    it('con 5 carte, la carta centrale ha rotazione ~0', () => {
      const center = fanPosition(2, 5);
      expect(center.rotate).toBeCloseTo(0, 5);
    });

    it('le carte agli estremi sono simmetriche (rotazione opposta)', () => {
      const first = fanPosition(0, 5);
      const last = fanPosition(4, 5);
      expect(first.rotate + last.rotate).toBeCloseTo(0, 5);
    });

    it('la carta centrale ha y minimo (arco minimo)', () => {
      const center = fanPosition(2, 5);
      const first = fanPosition(0, 5);
      expect(center.y).toBeLessThanOrEqual(first.y);
    });
  });

  describe("cap dell'angolo totale", () => {
    it('con 10 carte l angolo totale non supera 64 gradi', () => {
      const first = fanPosition(0, 10);
      const last = fanPosition(9, 10);
      const totalAngle = Math.abs(last.rotate - first.rotate);
      expect(totalAngle).toBeLessThanOrEqual(64);
    });

    it('con 3 carte l angolo totale è 3*14=42 gradi', () => {
      const first = fanPosition(0, 3);
      const last = fanPosition(2, 3);
      const totalAngle = Math.abs(last.rotate - first.rotate);
      expect(totalAngle).toBeCloseTo(42, 5);
    });
  });

  describe('diffusione orizzontale (x)', () => {
    it('con 5 carte, carta centrale ha x ≈ 0', () => {
      const center = fanPosition(2, 5);
      expect(center.x).toBeCloseTo(0, 5);
    });

    it('la prima carta ha x negativo', () => {
      expect(fanPosition(0, 5).x).toBeLessThan(0);
    });

    it("l'ultima carta ha x positivo", () => {
      expect(fanPosition(4, 5).x).toBeGreaterThan(0);
    });

    it('con molte carte, x non supera 60 (cap a 120/2)', () => {
      const last = fanPosition(49, 50);
      expect(last.x).toBeLessThanOrEqual(60);
    });
  });

  describe('y è sempre >= 0 (arco discendente)', () => {
    it('y è >= 0 per tutte le posizioni con 5 carte', () => {
      for (let i = 0; i < 5; i++) {
        expect(fanPosition(i, 5).y).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// zIndexCalculation
// ---------------------------------------------------------------------------
describe('zIndexCalculation', () => {
  it('carta non selezionata ha z-index pari all indice', () => {
    expect(zIndexCalculation(3, false)).toBe(3);
  });

  it('carta selezionata ha z-index 100 + indice', () => {
    expect(zIndexCalculation(3, true)).toBe(103);
  });

  it('indice 0 non selezionato ha z-index 0', () => {
    expect(zIndexCalculation(0, false)).toBe(0);
  });

  it('indice 0 selezionato ha z-index 100', () => {
    expect(zIndexCalculation(0, true)).toBe(100);
  });

  it('carta selezionata ha sempre z-index maggiore della stessa non selezionata', () => {
    for (let i = 0; i < 10; i++) {
      expect(zIndexCalculation(i, true)).toBeGreaterThan(zIndexCalculation(i, false));
    }
  });

  it('indici alti selezionati mantengono l ordine relativo', () => {
    expect(zIndexCalculation(5, true)).toBe(105);
    expect(zIndexCalculation(10, true)).toBe(110);
  });
});
