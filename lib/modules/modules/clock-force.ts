import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  targetCard: z.string().min(1),
  clockSize: z.number().int().min(8).max(13),
});
type ClockForceConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  position: z.number().int().min(1),
});
type ClockForceInput = z.infer<typeof inputSchema>;

const FILLER_CARDS = [
  '2 di Picche',
  '3 di Cuori',
  '5 di Quadri',
  '7 di Fiori',
  '9 di Picche',
  'Fante di Cuori',
  'Regina di Quadri',
  '4 di Fiori',
  '6 di Picche',
  '8 di Cuori',
  '10 di Quadri',
  'Asso di Fiori',
];

export const clockForce: MagicModuleHandler<ClockForceConfig, ClockForceInput> = {
  key: 'CLOCK_FORCE',
  meta: {
    name: 'Forzatura a Orologio',
    description: "Conteggio circolare su 12 posizioni. L'utente arriva sempre alla carta prevista.",
    icon: 'Clock',
    difficulty: 'base',
    scope: 'user',
    priority: 35,
  },
  ui: {
    fields: {
      targetCard: { label: 'Carta bersaglio', kind: 'text' },
      clockSize: { label: 'Dimensione orologio (posizioni)', kind: 'number', min: 8, max: 13, step: 1 },
    },
  },
  defaultConfig: { configVersion: 1, targetCard: 'Re di Cuori', clockSize: 12 },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    const { position } = input;
    const { targetCard, clockSize } = config;

    const clampedPosition = Math.max(1, Math.min(position, clockSize));

    const fillers = FILLER_CARDS.filter((c) => c !== targetCard).slice(0, clockSize - 1);
    const clockLayout: string[] = new Array(clockSize).fill('');

    clockLayout[clampedPosition - 1] = targetCard;

    let fillerIdx = 0;
    for (let i = 0; i < clockSize; i++) {
      if (clockLayout[i] === '') {
        clockLayout[i] = fillers[fillerIdx] ?? '2 di Cuori';
        fillerIdx++;
      }
    }

    return {
      success: true,
      data: {
        position: clampedPosition,
        targetCard,
        clockLayout,
        reveal: true,
        message: 'Hai scelto la posizione ' + clampedPosition + '. La carta in quella posizione è... ' + targetCard + '!',
      },
      audit: { position: clampedPosition, targetCard },
    };
  },
};
