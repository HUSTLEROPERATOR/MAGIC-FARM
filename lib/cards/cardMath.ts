import type { CardPosition } from '@/types/card';

/**
 * Calculates position and rotation for a card in a smooth curved fan.
 * Cards spread evenly across a total angle of min(total*14, 64) degrees.
 */
export function fanPosition(index: number, total: number): CardPosition {
  if (total <= 1) return { x: 0, y: 0, rotate: 0 };

  const spreadAngle = Math.min(total * 14, 64);
  const step = spreadAngle / (total - 1);
  const rotate = -spreadAngle / 2 + index * step;
  // Arc: cards at the edges dip lower than the center
  const arc = (rotate * rotate) / 80;
  const horizontalSpread = Math.min(total * 28, 120);
  const x = ((index - (total - 1) / 2) / ((total - 1) / 2)) * (horizontalSpread / 2);

  return { x, y: arc, rotate };
}

/**
 * Returns a z-index so selected cards render on top of others.
 */
export function zIndexCalculation(index: number, isSelected: boolean): number {
  return isSelected ? 100 + index : index;
}
