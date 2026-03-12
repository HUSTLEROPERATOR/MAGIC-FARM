import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  targetSeme: z.string().min(1),
  targetValore: z.string().min(1),
  targetColore: z.string().min(1),
  targetPosizione: z.number().int().min(1).max(52),
});
type MultilevelConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(4),
  chosenSeme: z.string().optional(),
  chosenValore: z.string().optional(),
  chosenColore: z.string().optional(),
  chosenPosizione: z.number().int().min(1).max(52).optional(),
});
type MultilevelInput = z.infer<typeof inputSchema>;

export const multilevelPrediction: MagicModuleHandler<MultilevelConfig, MultilevelInput> = {
  key: 'MULTILEVEL_PREDICTION',
  meta: {
    name: 'Previsione Multilivello',
    playerLabel: 'Quattro Previsioni',
    description:
      '4 previsioni progressive: seme, valore, colore, posizione. Crescendo teatrale.',
    icon: 'Layers3',
    difficulty: 'avanzato',
    scope: 'user',
    priority: 52,
    magicianControlled: true,
  },
  ui: {
    fields: {
      targetSeme: { label: 'Seme previsto', kind: 'text' },
      targetValore: { label: 'Valore previsto', kind: 'text' },
      targetColore: { label: 'Colore previsto', kind: 'text' },
      targetPosizione: {
        label: 'Posizione prevista (1-52)',
        kind: 'number',
        min: 1,
        max: 52,
      },
    },
  },
  defaultConfig: {
    configVersion: 1,
    targetSeme: 'Cuori',
    targetValore: '7',
    targetColore: 'rosso',
    targetPosizione: 27,
  },
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
          instruction: 'Pensa a un seme: Picche, Cuori, Quadri o Fiori.',
          nextStep: 1,
          isLastStep: false,
        },
      };
    }

    if (step === 1) {
      const match1 =
        (input.chosenSeme ?? '').toLowerCase() === config.targetSeme.toLowerCase();
      return {
        success: true,
        data: {
          step: 1,
          prediction1: 'Seme: ' + config.targetSeme,
          match1,
          chosenSeme: input.chosenSeme,
          instruction:
            'Previsione 1 rivelata: ' +
            config.targetSeme +
            '. Ora pensa a un valore da Asso a Re.',
          nextStep: 2,
          isLastStep: false,
        },
      };
    }

    if (step === 2) {
      const match2 =
        (input.chosenValore ?? '').toLowerCase() === config.targetValore.toLowerCase();
      return {
        success: true,
        data: {
          step: 2,
          prediction2: 'Valore: ' + config.targetValore,
          match2,
          chosenValore: input.chosenValore,
          instruction:
            'Previsione 2 rivelata: ' + config.targetValore + '. Rosso o nero?',
          nextStep: 3,
          isLastStep: false,
        },
      };
    }

    if (step === 3) {
      const match3 =
        (input.chosenColore ?? '').toLowerCase() === config.targetColore.toLowerCase();
      return {
        success: true,
        data: {
          step: 3,
          prediction3: 'Colore: ' + config.targetColore,
          match3,
          chosenColore: input.chosenColore,
          instruction:
            'Previsione 3 rivelata: ' +
            config.targetColore +
            '. Ora scegli un numero da 1 a 52.',
          nextStep: 4,
          isLastStep: false,
        },
      };
    }

    // step === 4: final reveal
    const match1 =
      (input.chosenSeme ?? '').toLowerCase() === config.targetSeme.toLowerCase();
    const match2 =
      (input.chosenValore ?? '').toLowerCase() === config.targetValore.toLowerCase();
    const match3 =
      (input.chosenColore ?? '').toLowerCase() === config.targetColore.toLowerCase();
    const match4 = input.chosenPosizione === config.targetPosizione;
    const totalMatches = [match1, match2, match3, match4].filter(Boolean).length;

    return {
      success: true,
      data: {
        step: 4,
        reveal: true,
        allPredictions: {
          seme: config.targetSeme,
          valore: config.targetValore,
          colore: config.targetColore,
          posizione: config.targetPosizione,
        },
        userChoices: {
          chosenSeme: input.chosenSeme,
          chosenValore: input.chosenValore,
          chosenColore: input.chosenColore,
          chosenPosizione: input.chosenPosizione,
        },
        totalMatches,
        isLastStep: true,
        message:
          'La previsione in quattro parti è completata.' +
          ' Ogni livello era già scritto prima delle vostre scelte.',
      },
      audit: {
        step,
        totalMatches,
        targetSeme: config.targetSeme,
        targetValore: config.targetValore,
        targetColore: config.targetColore,
        targetPosizione: config.targetPosizione,
      },
    };
  },
};
