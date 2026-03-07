import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  deckStyle: z.enum(['standard', 'fantasy']),
});
type InvisibleDeckConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  namedCard: z.string().min(1),
});
type InvisibleDeckInput = z.infer<typeof inputSchema>;

export const invisibleDeckDigital: MagicModuleHandler<InvisibleDeckConfig, InvisibleDeckInput> = {
  key: 'INVISIBLE_DECK_DIGITAL',
  meta: {
    name: 'Mazzo Invisibile Digitale',
    description:
      'L’utente nomina qualsiasi carta. Nel mazzo virtuale quella carta è l’unica girata al contrario.',
    icon: 'EyeOff',
    difficulty: 'avanzato',
    scope: 'user',
    priority: 55,    magicianControlled: true,  },
  ui: {
    fields: {
      deckStyle: {
        label: 'Stile mazzo',
        kind: 'select',
        options: ['standard', 'fantasy'],
      },
    },
  },
  defaultConfig: { configVersion: 1, deckStyle: 'standard' },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, _config, input) => {
    const { namedCard } = input;

    if (!namedCard || namedCard.trim().length === 0) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        error: 'Devi nominare una carta.',
      };
    }

    const normalized = namedCard.toLowerCase();
    let charSum = 0;
    for (let i = 0; i < normalized.length; i++) {
      charSum += normalized.charCodeAt(i);
    }
    const cardPosition = charSum % 52;

    return {
      success: true,
      data: {
        namedCard: input.namedCard,
        cardPosition,
        reveal: true,
        message:
          'Hai detto ' + String.fromCharCode(34) +
          input.namedCard +
          String.fromCharCode(34) + '. Nel mazzo invisibile, c’è una sola carta girata al contrario...' +
          ' ed è esattamente quella che hai nominato. Posizione ' +
          String(cardPosition + 1) +
          ' di 52.',
        visualHint: 'Carta girata: posizione ' + String(cardPosition + 1),
        impossibilityNote: 'Il mazzo era già così prima che tu dicessi la tua carta.',
      },
      audit: {
        namedCard: input.namedCard,
        cardPosition,
      },
    };
  },
};
