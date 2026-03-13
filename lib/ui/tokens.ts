/**
 * Shared UI design tokens for the card engine and reveal overlays.
 *
 * Single source of truth for perspective, glow overlay z-index, hover lift,
 * Framer Motion transition presets, and reveal timing constants.
 *
 * Only pure TypeScript values are exported (no Tailwind class strings) so that
 * Tailwind's JIT scanner does not need to watch this file.
 */

// ─── 3-D card geometry ───────────────────────────────────────────────────────

/** CSS perspective depth for 3-D card flip (px). */
export const CARD_PERSPECTIVE = 1000;

/** Vertical hover-lift distance in px (negative = upward). */
export const CARD_HOVER_LIFT_PX = -8;

// ─── Z-index scale ───────────────────────────────────────────────────────────

/** z-index for the gold glow ring overlaid on a selected card. */
export const Z_CARD_GLOW_OVERLAY = 10;

// ─── Framer Motion transition presets ────────────────────────────────────────

/** Standard card flip tween (full-speed). */
export const TRANSITION_FLIP = {
  type: 'tween' as const,
  duration: 0.55,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/** Instant card flip — used when reduced motion or "skip" is active. */
export const TRANSITION_FLIP_INSTANT = {
  type: 'tween' as const,
  duration: 0,
};

/** Spring preset for card hover lift. */
export const TRANSITION_HOVER_SPRING = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 22,
};

/** Spring preset for fan card repositioning. */
export const TRANSITION_FAN_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
};

/** Spring preset for card stack repositioning. */
export const TRANSITION_STACK_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 26,
};

// ─── Reveal timing constants (full-speed, in seconds) ────────────────────────

/** Delay before the outer reveal container animates in. */
export const DELAY_REVEAL_CONTAINER_S = 0.2;

/** Delay before reveal text appears. */
export const DELAY_REVEAL_TEXT_S = 0.85;

/** Delay before the score badge pops in. */
export const DELAY_REVEAL_SCORE_S = 1.1;

/** Duration for the selection ring entry animation. */
export const DURATION_SELECTION_IN_S = 0.2;
