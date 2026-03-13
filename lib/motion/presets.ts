/**
 * Centralized motion presets for the card engine.
 *
 * Components pair these with framer-motion's useReducedMotion() hook:
 *
 *   const reduced = useReducedMotion();
 *   <motion.div transition={reduced ? INSTANT : SPRING_HOVER} />
 *
 * The INSTANT constant collapses every animation to zero-duration
 * so prefers-reduced-motion users see no motion at all.
 */

/* ── Spring presets ────────────────────────────────────────────── */

/** Hover lift on interactive cards */
export const SPRING_HOVER = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 22,
};

/** Fan-spread positioning */
export const SPRING_FAN = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
};

/** Stack offset positioning */
export const SPRING_STACK = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 26,
};

/* ── Flip presets ──────────────────────────────────────────────── */

/** Standard card flip (rotateY 0→180°) */
export const FLIP_NORMAL = {
  type: 'tween' as const,
  duration: 0.55,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/** Instant flip for skipped / preloaded states */
export const FLIP_INSTANT = {
  type: 'tween' as const,
  duration: 0,
};

/* ── Timing presets ────────────────────────────────────────────── */

/** Quick UI feedback (selection ring, opacity) */
export const TIMING_FAST = { duration: 0.15 } as const;

/** Default transition (frame overlays, state changes) */
export const TIMING_NORMAL = { duration: 0.3 } as const;

/** Dramatic reveal (stack flip in reveal sequence) */
export const TIMING_DRAMATIC = {
  type: 'tween' as const,
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/* ── Reduced-motion / low-power fallback ───────────────────────── */

/** Zero-duration fallback for prefers-reduced-motion */
export const INSTANT = { duration: 0 } as const;
