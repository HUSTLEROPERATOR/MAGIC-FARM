import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  predictionText: z.string().min(1),
  revealPhase: z.enum(['end_round', 'manual']),
});
type SealedEnvelopeConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  action: z.enum(['show_seal', 'reveal']),
  chosenCard: z.string().optional(),
});
type SealedEnvelopeInput = z.infer<typeof inputSchema>;

export const sealedEnvelopeDigital: MagicModuleHandler<SealedEnvelopeConfig, SealedEnvelopeInput> = {
  key: 'SEALED_ENVELOPE_DIGITAL',
  meta: {
    name: 'Busta Sigillata Digitale',
    description: "Busta virtuale sigillata dall'inizio. Dopo le scelte, coincide con la previsione.",
    icon: 'Mail',
    difficulty: 'intermedio',
    scope: 'table',
    priority: 50,
  },
  ui: {
    fields: {
      predictionText: { label: 'Testo della previsione', kind: 'text' },
      revealPhase: { label: 'Fase di rivelazione', kind: 'select', options: ['end_round', 'manual'] },
    },
  },
  defaultConfig: {
    configVersion: 1,
    predictionText: 'La carta prescelta sarà: 7 di Cuori',
    revealPhase: 'manual',
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    const { action, chosenCard } = input;

    if (action === 'show_seal') {
      return {
        success: true,
        data: {
          sealed: true,
          sealedAt: new Date().toISOString(),
          message: 'La previsione è sigillata. È stata registrata prima che iniziaste a scegliere.',
          hint: 'Fate le vostre scelte. Poi rivelate la busta.',
        },
      };
    }

    // action === 'reveal'
    return {
      success: true,
      data: {
        sealed: false,
        prediction: config.predictionText,
        chosenCard: chosenCard ?? 'non specificata',
        match: true,
        message: "La previsione recita: '" + config.predictionText + "'. Era già lì dall'inizio!",
      },
    };
  },
};
