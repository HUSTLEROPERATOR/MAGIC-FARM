/**
 * Haptic feedback via the Vibration API.
 *
 * Patterns are intentionally short and low-intensity to remain non-intrusive
 * on mobile. All calls are silent no-ops on desktop or when the API is
 * unavailable/blocked.
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when vibration is not permitted.
  }
}

/** Short tick when a card interaction begins (tap/drag start). */
export function hapticDragStart(): void {
  vibrate(8);
}

/** Double pulse on a valid card selection or successful drop. */
export function hapticDropValid(): void {
  vibrate([10, 30, 10]);
}

/** Brief buzz on an invalid drop or mismatch. */
export function hapticDropInvalid(): void {
  vibrate(25);
}

/** Gentle pulse when a reveal sequence starts. */
export function hapticRevealStart(): void {
  vibrate([15, 40, 15]);
}

/** Celebratory pattern at the final reveal. */
export function hapticRevealComplete(): void {
  vibrate([20, 40, 20, 40, 40]);
}
