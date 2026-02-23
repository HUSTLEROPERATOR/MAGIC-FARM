import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  targetCard: z.string().min(1),
});
type MathForceConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(5),
  value: z.number(),
});
type MathForceInput = z.infer<typeof inputSchema>;

export const mathematicalForce27: MagicModuleHandler<MathForceConfig, MathForceInput> = {
  key: 'MATHEMATICAL_FORCE_27',
  meta: {
    name: 'Forzatura Matematica Carta 27',
    description: 'Percorso guidato con operazioni matematiche. Il risultato è sempre 27 → Asso di Quadri.',
    icon: 'Calculator',
    difficulty: 'base',
    scope: 'user',
    priority: 30,
  },
  ui: {
    fields: {
      targetCard: { label: 'Carta bersaglio', kind: 'text' },
    },
  },
  defaultConfig: { configVersion: 1, targetCard: 'Asso di Quadri' },
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
          instruction: 'Pensa un numero da 1 a 10. Tienilo segreto.',
          nextStep: 1,
        },
      };
    }

    if (step === 1) {
      return {
        success: true,
        data: {
          step: 1,
          instruction: 'Moltiplica il tuo numero per 2.',
          nextStep: 2,
        },
      };
    }

    if (step === 2) {
      return {
        success: true,
        data: {
          step: 2,
          instruction: 'Al risultato aggiungi 54.',
          nextStep: 3,
        },
      };
    }

    if (step === 3) {
      return {
        success: true,
        data: {
          step: 3,
          instruction: 'Dividi tutto per 2.',
          nextStep: 4,
        },
      };
    }

    if (step === 4) {
      return {
        success: true,
        data: {
          step: 4,
          instruction: "Sottrai il numero che avevi pensato all'inizio.",
          nextStep: 5,
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
        message: "Il risultato è sempre 27. La tua carta è l'Asso di Quadri!",
      },
    };
  },
};
