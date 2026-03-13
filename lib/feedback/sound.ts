/**
 * Sound feedback integration layer.
 *
 * Provides the plumbing for subtle audio cues without requiring production
 * audio assets up front. All asset paths start as `null` (no-op). Replace with
 * real paths once assets are available.
 *
 * Design constraints:
 * - All sounds are opt-in: no audio fires until an asset path is configured.
 * - Volume is capped at 0.5 to avoid startling mobile users.
 * - Uses the Web Audio API for low-latency playback with a shared AudioContext.
 * - Every call is a silent no-op if the API is unavailable or an error occurs.
 */

export type SoundEvent =
  | 'drag_start'
  | 'drop_valid'
  | 'drop_invalid'
  | 'reveal_start'
  | 'reveal_complete';

/**
 * Asset map: event → URL path, or `null` when no asset is assigned yet.
 *
 * TODO: add audio assets and update paths:
 *   drag_start      → /sounds/whoosh-soft.mp3
 *   drop_valid      → /sounds/chime-short.mp3
 *   drop_invalid    → /sounds/thud-soft.mp3
 *   reveal_start    → /sounds/magic-shimmer.mp3
 *   reveal_complete → /sounds/reveal-sting.mp3
 */
const SOUND_ASSETS: Record<SoundEvent, string | null> = {
  drag_start: null,
  drop_valid: null,
  drop_invalid: null,
  reveal_start: null,
  reveal_complete: null,
};

let audioCtx: AudioContext | null = null;
const bufferCache = new Map<SoundEvent, AudioBuffer>();

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

async function loadBuffer(
  event: SoundEvent,
  path: string,
): Promise<AudioBuffer | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const cached = bufferCache.get(event);
  if (cached) return cached;

  try {
    const res = await fetch(path);
    const raw = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(raw);
    bufferCache.set(event, buf);
    return buf;
  } catch {
    return null;
  }
}

/**
 * Play a sound cue for the given event.
 *
 * Silent no-op when:
 * - no asset path is configured for the event
 * - the Web Audio API is unavailable
 * - any error occurs during decode or playback
 */
export async function playSound(
  event: SoundEvent,
  volume = 0.4,
): Promise<void> {
  const path = SOUND_ASSETS[event];
  if (!path) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const buf = await loadBuffer(event, path);
  if (!buf) return;

  try {
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = buf;

    const gain = ctx.createGain();
    // Cap at 0.5 to avoid startling mobile users even if caller passes a higher value.
    gain.gain.value = Math.min(0.5, Math.max(0, volume));

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Sound is non-critical — swallow silently.
  }
}
