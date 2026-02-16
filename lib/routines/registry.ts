import { z } from 'zod';
import type { RoutineDefinition, RoutineId } from './types';

// ============================================================================
// CONFIG SCHEMAS (Zod)
// ============================================================================

export const sealedEnvelopeConfigSchema = z.object({
  predictionText: z.string().min(1, 'Il testo della predizione è obbligatorio').max(1000),
  revealMode: z.enum(['end', 'manual']).default('end'),
});
export type SealedEnvelopeConfig = z.infer<typeof sealedEnvelopeConfigSchema>;

export const darknessRoundConfigSchema = z.object({
  enabledRoundIndexes: z.array(z.number().int().min(0)).min(1, 'Seleziona almeno un round'),
  darknessLevel: z.number().min(0.6).max(0.9).default(0.8),
  disableHints: z.boolean().default(true),
});
export type DarknessRoundConfig = z.infer<typeof darknessRoundConfigSchema>;

export const mysteryTicketConfigSchema = z.object({
  percentage: z.number().int().min(1).max(50).default(10),
  roles: z
    .array(z.string().min(1).max(50))
    .min(1, 'Almeno un ruolo')
    .max(10)
    .default(['Il Custode', 'Il Messaggero', 'Il Testimone']),
  revealMode: z.enum(['never', 'end', 'manual']).default('end'),
});
export type MysteryTicketConfig = z.infer<typeof mysteryTicketConfigSchema>;

// Placeholder schemas for future routines
const placeholderConfigSchema = z.object({});

// ============================================================================
// ROUTINE DEFINITIONS
// ============================================================================

const ROUTINE_LIST: RoutineDefinition[] = [
  // ── MVP 1: Busta Sigillata ────────────────────────────────────
  {
    id: 'sealed_envelope',
    name: 'Busta Sigillata',
    icon: '✉️',
    tagline: 'Una predizione sigillata, rivelata alla fine',
    description:
      'Il mago scrive una predizione prima della serata e la "sigilla" digitalmente. ' +
      'Alla fine della serata (o su trigger manuale) la predizione viene rivelata a tutti i partecipanti ' +
      'con verifica hash crittografica di integrità.',
    whereItShows: ['dashboard', 'game', 'end-of-night', 'admin-panel'],
    configSchema: sealedEnvelopeConfigSchema,
    defaults: { predictionText: '', revealMode: 'end' as const },
    docs: {
      player:
        'All\'inizio della serata è stata sigillata una busta con una predizione. ' +
        'A fine serata scoprirai cosa conteneva!',
      staff:
        '1. Prima della serata, scrivi la predizione nella sezione Routines dell\'admin.\n' +
        '2. Attiva la routine e salva.\n' +
        '3. A fine serata, se revealMode è "manual", premi "Rivela" dal pannello admin.\n' +
        '4. Se revealMode è "end", la predizione compare automaticamente quando l\'evento passa a ENDED.',
      admin:
        'Scrivi il testo della predizione. Scegli se rivelarla automaticamente a fine serata o manualmente.',
    },
    implemented: true,
  },

  // ── MVP 2: Luce Spenta ────────────────────────────────────────
  {
    id: 'darkness_round',
    name: 'Luce Spenta',
    icon: '🌑',
    tagline: 'Round al buio: overlay scuro, niente suggerimenti',
    description:
      'Durante i round selezionati, un overlay scuro copre lo schermo dei giocatori simulando un blackout. ' +
      'I suggerimenti vengono disattivati. Aumenta la difficoltà e l\'atmosfera.',
    whereItShows: ['game-overlay', 'game-puzzle', 'admin-panel'],
    configSchema: darknessRoundConfigSchema,
    defaults: { enabledRoundIndexes: [], darknessLevel: 0.8, disableHints: true },
    docs: {
      player:
        'Attenzione: alcuni round si svolgeranno al buio! Lo schermo si oscurerà e i suggerimenti saranno bloccati.',
      staff:
        '1. Nella sezione Routines, attiva "Luce Spenta".\n' +
        '2. Seleziona i round in cui applicare l\'effetto (per indice, partendo da 0).\n' +
        '3. Regola il livello di oscurità (0.6 = leggero, 0.9 = quasi nero).\n' +
        '4. Decidi se disabilitare anche i suggerimenti durante quei round.',
      admin:
        'Seleziona quali round saranno "al buio". Livello oscurità e disabilitazione hint configurabili.',
    },
    implemented: true,
  },

  // ── MVP 3: Biglietto Misterioso ──────────────────────────────
  {
    id: 'mystery_ticket',
    name: 'Biglietto Misterioso',
    icon: '🎫',
    tagline: 'Ruoli segreti assegnati a sorpresa',
    description:
      'Una percentuale di giocatori riceve un "biglietto misterioso" con un ruolo segreto. ' +
      'Il ruolo viene mostrato come badge nel loro profilo di gioco. ' +
      'A fine serata (o mai, o su trigger manuale) i ruoli vengono rivelati a tutti.',
    whereItShows: ['game', 'sidebar', 'end-of-night', 'admin-panel'],
    configSchema: mysteryTicketConfigSchema,
    defaults: { percentage: 10, roles: ['Il Custode', 'Il Messaggero', 'Il Testimone'], revealMode: 'end' as const },
    docs: {
      player:
        'Alcuni di voi hanno ricevuto un biglietto misterioso con un ruolo segreto. ' +
        'Scoprirai chi è chi alla fine della serata... forse.',
      staff:
        '1. Attiva "Biglietto Misterioso" e scegli la percentuale di giocatori.\n' +
        '2. Personalizza i ruoli o usa quelli predefiniti.\n' +
        '3. I ruoli vengono assegnati automaticamente quando i giocatori si uniscono ai tavoli.\n' +
        '4. La rivelazione dipende dal revealMode.',
      admin:
        'Imposta percentuale di giocatori, lista ruoli e modalità di rivelazione.',
    },
    implemented: true,
  },

  // ── FUTURE: Time Warp ─────────────────────────────────────────
  {
    id: 'time_warp',
    name: 'Distorsione Temporale',
    icon: '⏰',
    tagline: 'Modifica il tempo di alcuni round',
    description:
      'Altera il timer di round selezionati: accelera, rallenta o inverte il conteggio.',
    whereItShows: ['game', 'admin-panel'],
    configSchema: placeholderConfigSchema,
    defaults: {},
    docs: {
      player: 'Il tempo potrebbe non essere ciò che sembra...',
      staff: 'Routine in arrivo. Non ancora disponibile.',
      admin: 'Coming soon.',
    },
    implemented: false,
  },

  // ── FUTURE: Double or Nothing ─────────────────────────────────
  {
    id: 'double_or_nothing',
    name: 'Doppio o Niente',
    icon: '🎲',
    tagline: 'Raddoppia i punti... o perdili tutti',
    description:
      'I giocatori possono scommettere i propri punti su un enigma: se rispondono correttamente raddoppiano, altrimenti perdono tutto.',
    whereItShows: ['game-puzzle', 'admin-panel'],
    configSchema: placeholderConfigSchema,
    defaults: {},
    docs: {
      player: 'Vuoi rischiare? Raddoppia i punti o perdi tutto!',
      staff: 'Routine in arrivo. Non ancora disponibile.',
      admin: 'Coming soon.',
    },
    implemented: false,
  },

  // ── FUTURE: Phantom Table ─────────────────────────────────────
  {
    id: 'phantom_table',
    name: 'Tavolo Fantasma',
    icon: '👻',
    tagline: 'Un tavolo misterioso appare e scompare',
    description:
      'Un tavolo virtuale "fantasma" appare nella classifica con punteggi generati dal sistema, sfidando i giocatori reali.',
    whereItShows: ['sidebar', 'admin-panel'],
    configSchema: placeholderConfigSchema,
    defaults: {},
    docs: {
      player: 'Chi è il Tavolo Fantasma? Nessuno lo sa...',
      staff: 'Routine in arrivo. Non ancora disponibile.',
      admin: 'Coming soon.',
    },
    implemented: false,
  },
];

// ============================================================================
// REGISTRY API
// ============================================================================

/** All registered routines. */
export const ROUTINES: readonly RoutineDefinition[] = ROUTINE_LIST;

/** Get a routine definition by id, or undefined. */
export function getRoutine(id: RoutineId): RoutineDefinition | undefined {
  return ROUTINE_LIST.find((r) => r.id === id);
}

/** Get only implemented (MVP) routines. */
export function getImplementedRoutines(): RoutineDefinition[] {
  return ROUTINE_LIST.filter((r) => r.implemented);
}

/** Check if a routine id is valid (registered). */
export function isValidRoutineId(id: string): id is RoutineId {
  return ROUTINE_LIST.some((r) => r.id === id);
}

/** Validate config against the routine's schema. Returns parsed config or throws ZodError. */
export function validateRoutineConfig(id: RoutineId, config: unknown): unknown {
  const routine = getRoutine(id);
  if (!routine) throw new Error(`Unknown routine: ${id}`);
  return routine.configSchema.parse(config);
}
