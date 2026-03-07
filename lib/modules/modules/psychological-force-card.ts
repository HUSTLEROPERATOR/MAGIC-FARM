import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  primaryTarget: z.string().min(1),
  alternativeTargets: z.array(z.string()),
});
type PsychForceConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(1),
  chosenCard: z.string().optional(),
});
type PsychForceInput = z.infer<typeof inputSchema>;

export const psychologicalForceCard: MagicModuleHandler<PsychForceConfig, PsychForceInput> = {
  key: 'PSYCHOLOGICAL_FORCE_CARD',
  meta: {
    name: 'Forzatura Psicologica Carta',
    playerLabel: 'Leggi il Pensiero',
    description: 'Guida psicologica verso 7 di Cuori o Asso di Picche. Con uscite alternative integrate.',
    icon: 'Brain',
    difficulty: 'intermedio',
    scope: 'user',
    priority: 40,
    magicianControlled: true,
  },
  ui: {
    fields: {
      primaryTarget: { label: 'Carta primaria', kind: 'text' },
    },
  },
  defaultConfig: {
    configVersion: 1,
    primaryTarget: '7 di Cuori',
    alternativeTargets: ['Asso di Picche', 'Regina di Cuori'],
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    const { step, chosenCard } = input;

    if (step === 0) {
      return {
        success: true,
        data: {
          step: 0,
          phrases: [
            'Pensa a una carta... qualsiasi carta del mazzo.',
            'Non scegliere una figura.',
            "Non scegliere una carta troppo ovvia come l'Asso.",
            'Pensa a un numero basso... tra 2 e 10.',
            "E ora... scegli un seme rosso.",
            'Hai la carta in mente?',
          ],
          nextStep: 1,
          isLastStep: false,
        },
      };
    }

    // step === 1: user reveals their card
    const chosen = chosenCard ?? '';
    const chosenLower = chosen.toLowerCase();
    const isPrimary = chosenLower === config.primaryTarget.toLowerCase();
    const isAlternative = config.alternativeTargets.some(
      (t) => chosenLower === t.toLowerCase(),
    );

    let matchLevel: string;

    if (isPrimary) {
      matchLevel = 'primary';
      return {
        success: true,
        data: {
          step: 1,
          success: true,
          matchLevel,
          reveal: true,
          isLastStep: true,
          message: 'La previsione era esatta! Avevi pensato proprio questa carta!',
          chosenCard: chosen,
        },
        audit: { chosenCard: chosen, isTarget: true, matchLevel },
      };
    }

    if (isAlternative) {
      matchLevel = 'alternative';
      return {
        success: true,
        data: {
          step: 1,
          success: true,
          matchLevel,
          reveal: true,
          isLastStep: true,
          message: 'La previsione era esatta! Avevi pensato proprio questa carta!',
          chosenCard: chosen,
        },
        audit: { chosenCard: chosen, isTarget: true, matchLevel },
      };
    }

    matchLevel = 'fallback';
    return {
      success: true,
      data: {
        step: 1,
        success: true,
        matchLevel,
        reveal: true,
        isLastStep: true,
        message: 'Interessante! Il mago aveva già preparato anche questa alternativa.',
        chosenCard: chosen,
        primaryTarget: config.primaryTarget,
        hint: "Le statistiche mostrano che l'80% pensa al 7 di Cuori o all'Asso di Picche.",
      },
      audit: { chosenCard: chosen, isTarget: false, matchLevel },
    };
  },
};
