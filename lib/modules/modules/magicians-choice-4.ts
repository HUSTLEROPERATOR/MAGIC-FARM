import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  targetCard: z.string().min(1),
});
type MagiciansChoiceConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(3),
  chosen: z.union([z.number(), z.array(z.number())]).optional(),
});
type MagiciansChoiceInput = z.infer<typeof inputSchema>;

const TARGET_IDX = 0;

export const magiciansChoice4: MagicModuleHandler<MagiciansChoiceConfig, MagiciansChoiceInput> = {
  key: 'MAGICIANS_CHOICE_4',
  meta: {
    name: 'Equivoque a 4 Carte',
    playerLabel: 'Scegli una Carta',
    description: "Magician's Choice digitale: qualunque scelta porta sempre alla carta prevista.",
    icon: 'Layers',
    difficulty: 'intermedio',
    scope: 'user',
    priority: 45,
    magicianControlled: true,
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
    const { step, chosen } = input;
    const cards = [config.targetCard, 'Asso di Picche', 'Re di Fiori', '9 di Quadri'];

    if (step === 0) {
      return {
        success: true,
        data: {
          step: 0,
          cards,
          instruction: 'Tocca mentalmente due carte qualsiasi tra le quattro.',
          nextStep: 1,
          isLastStep: false,
        },
      };
    }

    if (step === 1) {
      const chosenIndices = Array.isArray(chosen) ? chosen : [];
      const targetInChosen = chosenIndices.includes(TARGET_IDX);

      let remaining: number[];
      let instruction: string;

      if (targetInChosen) {
        remaining = chosenIndices;
        instruction = 'Teniamo queste due, eliminiamo le altre.';
      } else {
        remaining = [0, 1, 2, 3].filter((i) => !chosenIndices.includes(i));
        instruction = 'Eliminiamo queste, teniamo le altre.';
      }

      return {
        success: true,
        data: {
          step: 1,
          remaining,
          instruction,
          nextStep: 2,
          isLastStep: false,
        },
      };
    }

    if (step === 2) {
      const pickedIdx = typeof chosen === 'number' ? chosen : -1;
      const isTarget = pickedIdx === TARGET_IDX;

      const message = isTarget
        ? 'Perfetto, questa è la tua carta!'
        : 'Eliminiamo questa, quindi la tua carta è...';

      return {
        success: true,
        data: {
          step: 2,
          finalCard: config.targetCard,
          reveal: true,
          isLastStep: true,
          message: message + ' Qualunque scelta tu abbia fatto, la previsione era sempre questa.',
        },
      };
    }

    // step === 3: explicit reveal step
    return {
      success: true,
      data: {
        step: 3,
        finalCard: config.targetCard,
        reveal: true,
        isLastStep: true,
        message: 'Qualunque scelta tu abbia fatto, la previsione era sempre questa.',
      },
    };
  },
};
