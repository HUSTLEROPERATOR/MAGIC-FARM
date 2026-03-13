/**
 * Adaptive performance mode.
 *
 * Detects constrained devices or narrow screens using simple heuristics and
 * returns a performance profile. Components use this to scale back particles,
 * glow intensity, simultaneous animations, and timing complexity — preserving
 * a premium feel while prioritising smoothness.
 *
 * Heuristics (client-side only):
 * - `navigator.hardwareConcurrency ≤ 2` → low-end CPU
 * - `navigator.deviceMemory ≤ 2` GB (Chrome) → low RAM
 * - `navigator.connection.saveData` → explicit data-save mode
 * - `navigator.connection.effectiveType` in ['slow-2g','2g'] → slow network
 * - `window.innerWidth ≤ 375` → narrow / small phone
 */

export type PerformanceProfile = 'full' | 'reduced' | 'minimal';

export interface AdaptiveConfig {
  /** Overall performance tier. */
  profile: PerformanceProfile;
  /** Whether particle effects (sparkles, glow loops) are rendered. */
  enableParticles: boolean;
  /** Glow opacity multiplier applied to decorative shadows (0–1). */
  glowIntensity: number;
  /** Maximum number of cards allowed to animate simultaneously. */
  maxSimultaneousAnimations: number;
  /** Whether stagger/delay timings should be shortened. */
  shortenTimings: boolean;
}

type NavigatorWithExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function detectProfile(): PerformanceProfile {
  if (typeof navigator === 'undefined') return 'full';

  const nav = navigator as NavigatorWithExtras;
  const cpus = navigator.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const saveData = nav.connection?.saveData ?? false;
  const slowNetwork = ['slow-2g', '2g'].includes(
    nav.connection?.effectiveType ?? '',
  );
  const narrowScreen =
    typeof window !== 'undefined' && window.innerWidth <= 375;

  // Both conditions must be met (AND not OR) for 'minimal': a slow CPU alone is
  // common on older but otherwise capable devices; low RAM alone is common on
  // budget phones with large cores. Only the combination reliably signals a
  // severely constrained environment.
  if (saveData || slowNetwork || (cpus <= 2 && memory <= 2)) return 'minimal';
  if (cpus <= 4 || memory <= 4 || narrowScreen) return 'reduced';
  return 'full';
}

const CONFIGS: Record<PerformanceProfile, AdaptiveConfig> = {
  full: {
    profile: 'full',
    enableParticles: true,
    glowIntensity: 1,
    maxSimultaneousAnimations: 8,
    shortenTimings: false,
  },
  reduced: {
    profile: 'reduced',
    enableParticles: true,
    glowIntensity: 0.6,
    maxSimultaneousAnimations: 4,
    shortenTimings: true,
  },
  minimal: {
    profile: 'minimal',
    enableParticles: false,
    glowIntensity: 0.3,
    maxSimultaneousAnimations: 2,
    shortenTimings: true,
  },
};

// Evaluated once at module load (client-side). SSR always returns 'full'.
const _profile: PerformanceProfile =
  typeof window !== 'undefined' ? detectProfile() : 'full';

/** Returns the adaptive performance config for the current device. */
export function getAdaptiveConfig(): AdaptiveConfig {
  return CONFIGS[_profile];
}

/**
 * Returns the adaptive config for use inside React components.
 *
 * Currently returns a module-level constant (fast, no re-renders).
 * Can be upgraded to use React state + ResizeObserver in a future pass.
 */
export function useAdaptiveConfig(): AdaptiveConfig {
  return CONFIGS[_profile];
}
