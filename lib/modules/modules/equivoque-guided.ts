import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  scriptVariant: z.string().min(1),
  revealStyle: z.enum(['dramatic', 'instant']),
});
type EquivoqueConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({ step: z.number().int().min(0), choice: z.string().min(1) });
type EquivoqueInput = z.infer<typeof inputSchema>;

const TOTAL_STEPS = 3;

export const equivoqueGuided: MagicModuleHandler<EquivoqueConfig, EquivoqueInput> = {
  key: 'EQUIVOQUE_GUIDED',
  meta: {
    name: 'Equivoque Guidato',
    description: 'Script guidato a step con scelte del giocatore. Rivelazione finale basata sullo stile scelto.',
    icon: 'ScrollText', difficulty: 'intermedio', scope: 'user', priority: 20,
  },
  ui: {
    fields: {
      scriptVariant: { label: 'Variante script', kind: 'text' },
      revealStyle: { label: 'Stile rivelazione', kind: 'select', options: ['dramatic', 'instant'] },
    },
  },
  defaultConfig: { configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic' },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (ctx) => !!ctx.roundId,
  run: async (_ctx, config, input) => {
    const isLastStep = input.step >= TOTAL_STEPS - 1;
    return {
      success: true,
      data: {
        step: input.step, choice: input.choice, isLastStep,
        revealStyle: isLastStep ? config.revealStyle : undefined,
        nextStep: isLastStep ? undefined : input.step + 1,
      },
      audit: { step: input.step, choice: input.choice, isLastStep, scoreDelta: isLastStep ? 75 : 0 },
    };
  },
};
