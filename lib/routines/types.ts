import { z } from 'zod';

// ============================================================================
// ROUTINE MODULE TYPES
// ============================================================================

/**
 * All known routine IDs. Only routines listed here are accepted by the system.
 * MVP: sealed_envelope, darkness_round, mystery_ticket
 * Future: add new IDs here and register them in registry.ts
 */
export type RoutineId =
  | 'sealed_envelope'
  | 'darkness_round'
  | 'mystery_ticket'
  | 'time_warp'
  | 'double_or_nothing'
  | 'phantom_table';

/**
 * Where in the UI a routine renders its components.
 */
export type RoutineHook =
  | 'dashboard'
  | 'game'
  | 'game-puzzle'     // inside puzzle card
  | 'game-overlay'    // fullscreen overlay during game
  | 'end-of-night'    // reveal phase at event end
  | 'admin-panel'     // admin-only controls
  | 'sidebar';        // sidebar widget in serate detail

/**
 * Documentation for players, staff, and admin.
 */
export interface RoutineDocs {
  /** Brief text shown to players when routine is active */
  player: string;
  /** SOP for staff/host running the event */
  staff: string;
  /** Setup instructions shown in admin panel */
  admin: string;
}

/**
 * Full definition of a routine module.
 */
export interface RoutineDefinition<TConfig = unknown> {
  id: RoutineId;
  name: string;
  icon: string;         // emoji
  tagline: string;
  description: string;
  whereItShows: RoutineHook[];
  configSchema: z.ZodType<TConfig>;
  defaults: TConfig;
  docs: RoutineDocs;
  /** true = fully implemented, false = coming soon placeholder */
  implemented: boolean;
}

/**
 * Runtime state: what the hooks return for a given event.
 */
export interface RoutineRuntimeState {
  enabled: Set<RoutineId>;
  config: Partial<Record<RoutineId, unknown>>;
}

/**
 * Serializable version (for API responses).
 */
export interface RoutineRuntimeDTO {
  enabled: RoutineId[];
  config: Record<string, unknown>;
}
