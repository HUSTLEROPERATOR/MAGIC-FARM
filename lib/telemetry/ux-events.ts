/**
 * Minimal UX telemetry layer.
 *
 * Tracks user interactions with the card engine and reveal flows. Fully
 * isolated from business logic and persistence layers — no API calls, no
 * Prisma, no auth.
 *
 * Default behaviour:
 * - development: logs to `console.debug`
 * - production (no provider wired): silent no-op
 *
 * To integrate a real analytics provider, call `setTelemetryProvider()` once
 * at app init (e.g. in a root layout or provider component).
 *
 * @example
 * ```ts
 * // app/providers.tsx
 * import { setTelemetryProvider } from '@/lib/telemetry/ux-events';
 * setTelemetryProvider((event, payload) => posthog.capture(event, payload));
 * ```
 */

export type UxEventName =
  | 'card_drag_started'
  | 'card_drop_success'
  | 'card_drop_failed'
  | 'reveal_started'
  | 'reveal_skipped'
  | 'reveal_completed'
  | 'module_abandoned';

export interface UxEventPayload {
  /** The module key that triggered the event, if applicable. */
  moduleKey?: string;
  /** The card ID involved, if applicable. */
  cardId?: string;
  /** Elapsed time in ms since the module was opened. */
  elapsedMs?: number;
  [key: string]: unknown;
}

export type TelemetryProvider = (
  event: UxEventName,
  payload: UxEventPayload,
) => void;

let _provider: TelemetryProvider | null = null;

/**
 * Wire in an external analytics provider.
 * Call once at app init; subsequent calls replace the previous provider.
 */
export function setTelemetryProvider(provider: TelemetryProvider): void {
  _provider = provider;
}

/**
 * Emit a UX event.
 *
 * - Delegates to the registered provider if one is set.
 * - Logs to `console.debug` in development when no provider is set.
 * - Silent no-op in production when no provider is set.
 * - Never throws — telemetry failures must not affect the user experience.
 */
export function trackUxEvent(
  event: UxEventName,
  payload: UxEventPayload = {},
): void {
  if (_provider) {
    try {
      _provider(event, payload);
    } catch {
      // Telemetry must never throw.
    }
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[ux-telemetry]', event, payload);
  }
}
