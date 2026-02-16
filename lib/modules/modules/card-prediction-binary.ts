import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  roundId: z.string().min(1),
  difficulty: z.enum(['facile', 'medio', 'difficile']),
  timeLimit: z.number().int().min(10).max(300),
});
type CardConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({ choice: z.string().min(1) });
type CardInput = z.infer<typeof inputSchema>;

const SCORE_BY_DIFFICULTY: Record<string, number> = { facile: 25, medio: 50, difficile: 100 };

export const cardPredictionBinary: MagicModuleHandler<CardConfig, CardInput> = {
  key: 'CARD_PREDICTION_BINARY',
  meta: {
    name: 'Predizione Carta',
    description: 'Il giocatore predice il colore o il valore di una carta. Scelta binaria con timer.',
    icon: 'CrystalBall', difficulty: 'base', scope: 'user', priority: 10,
  },
  ui: {
    fields: {
      roundId: { label: 'Round', kind: 'text' },
      difficulty: { label: 'Difficolta', kind: 'select', options: ['facile', 'medio', 'difficile'] },
      timeLimit: { label: 'Tempo limite (secondi)', kind: 'number', min: 10, max: 300, step: 5 },
    },
  },
  defaultConfig: { configVersion: 1, roundId: '', difficulty: 'medio', timeLimit: 60 },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (ctx, config) => ctx.roundId === config.roundId,
  run: async (_ctx, config, input) => {
    const correct = Math.random() > 0.5;
    const scoreDelta = correct ? SCORE_BY_DIFFICULTY[config.difficulty] ?? 50 : 0;
    return {
      success: true,
      data: { choice: input.choice, correct, scoreDelta },
      audit: { scoreDelta, choice: input.choice, correct, difficulty: config.difficulty },
    };
  },
};
