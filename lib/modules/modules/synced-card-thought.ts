import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  targetCard: z.string().min(1),
});
type SyncedCardConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(5),
});
type SyncedCardInput = z.infer<typeof inputSchema>;

export const syncedCardThought: MagicModuleHandler<SyncedCardConfig, SyncedCardInput> = {
  key: 'SYNCED_CARD_THOUGHT',
  meta: {
    name: 'Carta Pensata in Sincronia',
    playerLabel: 'Telepatia Collettiva',
    description: 'Tutti i tavoli fanno le stesse operazioni matematiche e arrivano alla stessa carta.',
    icon: 'Zap',
    difficulty: 'base',
    scope: 'global',
    priority: 25,
  },
  ui: {
    fields: {
      targetCard: { label: 'Carta bersaglio', kind: 'text' },
    },
  },
  defaultConfig: { configVersion: 1, targetCard: '7 di Cuori' },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    const { step } = input;

    if (step === 0) {
      return {
        success: true,
        data: {
          step: 0,
          instruction:
            'TUTTI i tavoli insieme: pensate un numero da 1 a 10. Ognuno pensi in silenzio al proprio numero.',
          synchronizedMessage: 'Tutta la sala sta pensando...',
          nextStep: 1,
          isLastStep: false,
        },
      };
    }

    if (step === 1) {
      return {
        success: true,
        data: {
          step: 1,
          instruction: 'Moltiplicate per 2 il vostro numero.',
          nextStep: 2,
          isLastStep: false,
        },
      };
    }

    if (step === 2) {
      return {
        success: true,
        data: {
          step: 2,
          instruction: 'Aggiungete 54.',
          nextStep: 3,
          isLastStep: false,
        },
      };
    }

    if (step === 3) {
      return {
        success: true,
        data: {
          step: 3,
          instruction: 'Dividete per 2.',
          nextStep: 4,
          isLastStep: false,
        },
      };
    }

    if (step === 4) {
      return {
        success: true,
        data: {
          step: 4,
          instruction: 'Sottraete il vostro numero originale.',
          nextStep: 5,
          isLastStep: false,
        },
      };
    }

    // step === 5: final reveal
    return {
      success: true,
      data: {
        step: 5,
        result: 27,
        targetCard: config.targetCard,
        reveal: true,
        isLastStep: true,
        message:
          'OGNI tavolo ha ottenuto 27! E il numero 27 corrisponde a... ' + config.targetCard + '! La stessa carta per tutta la sala. IMPOSSIBILE.',
        synchronizedReveal: true,
      },
      audit: {
        step,
        targetCard: config.targetCard,
      },
    };
  },
};
