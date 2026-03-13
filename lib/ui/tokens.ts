/**
 * Shared visual-design tokens for the card engine.
 *
 * Card sizes follow the canonical 2:3 aspect ratio used by all SVG assets
 * in /public/cards/ (200×300 viewBox).
 */

/* ── Card sizing ──────────────────────────────────────────────── */

export type CardSize = 'sm' | 'md' | 'lg';

/** Width-first card sizes — height derived from 2:3 ratio */
export const CARD_SIZES: Record<CardSize, { width: number; height: number }> = {
  sm: { width: 56, height: 84 },
  md: { width: 80, height: 120 },
  lg: { width: 112, height: 168 },
} as const;

export const CARD_ASPECT_RATIO = '2 / 3' as const;

/* ── 3D / transform constants ─────────────────────────────────── */

/** CSS perspective for the card flip container */
export const CARD_PERSPECTIVE = 1000;

/** Hover lift (negative Y = upward) */
export const CARD_HOVER_LIFT_PX = -8;

/** Scale applied on gold / reveal emphasis */
export const CARD_REVEAL_SCALE = 1.05;

/** Opacity when a card is eliminated / dimmed */
export const CARD_ELIMINATED_OPACITY = 0.35;
