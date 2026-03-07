import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  targetCombination: z.array(z.string()).min(1),
  revealMessage: z.string().min(1),
});
type SharedImpossibleConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  tableIndex: z.number().int().min(0),
  action: z.enum(['get_assignment', 'reveal_combination']),
});
type SharedImpossibleInput = z.infer<typeof inputSchema>;

export const sharedImpossibleCard: MagicModuleHandler<SharedImpossibleConfig, SharedImpossibleInput> = {
  key: 'SHARED_IMPOSSIBLE_CARD',
  meta: {
    name: 'Carta Condivisa Impossibile',
    description: 'Ogni tavolo sceglie una carta. Insieme formano una combinazione impossibile già prevista.',
    icon: 'Users',
    difficulty: 'avanzato',
    scope: 'table',
    priority: 15,
    magicianControlled: true,
  },
  ui: {
    fields: {
      targetCombination: { label: 'Combinazione prevista (carte separate da virgola)', kind: 'text' },
      revealMessage: { label: 'Messaggio di rivelazione', kind: 'text' },
    },
  },
  defaultConfig: {
    configVersion: 1,
    targetCombination: [
      'Asso di Picche',
      'Re di Cuori',
      'Regina di Quadri',
      'Fante di Fiori',
      '10 di Picche',
    ],
    revealMessage: 'Le carte dei vostri tavoli formano la combinazione impossibile!',
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    if (input.action === 'get_assignment') {
      const card = config.targetCombination[input.tableIndex % config.targetCombination.length];
      return {
        success: true,
        data: {
          tableIndex: input.tableIndex,
          assignedCard: card,
          sealed: true,
          message: `Tavolo ${input.tableIndex + 1}: la vostra carta assegnata è sigillata. Non rivelate ancora!`,
        },
        audit: { action: input.action, tableIndex: input.tableIndex },
      };
    }

    // action === 'reveal_combination'
    return {
      success: true,
      data: {
        reveal: true,
        combination: config.targetCombination,
        message: config.revealMessage,
        instruction: 'Ogni tavolo riveli ora la propria carta. Sono esattamente quelle previste!',
      },
      audit: { action: input.action, tableIndex: input.tableIndex },
    };
  },
};
