import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
});
type AcaanConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  namedCard: z.string().min(1),
  namedPosition: z.number().int().min(1).max(52),
});
type AcaanInput = z.infer<typeof inputSchema>;

const SEMI = ['Picche', 'Cuori', 'Quadri', 'Fiori'];
const VALORI = [
  'Asso', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Fante', 'Regina', 'Re',
];
const STANDARD_DECK: string[] = SEMI.flatMap((s) =>
  VALORI.map((v) => v + ' di ' + s)
);

export const acaanDynamic: MagicModuleHandler<AcaanConfig, AcaanInput> = {
  key: 'ACAAN_DYNAMIC',
  meta: {
    name: 'ACAAN Dinamico',
    description: 'Any Card At Any Number: carta libera, numero libero, sempre corretto.',
    icon: 'Target',
    difficulty: 'avanzato',
    scope: 'user',
    priority: 58,
    magicianControlled: true,
  },
  ui: {
    fields: {
      namedCard: { label: 'La tua carta', kind: 'text' },
      namedPosition: { label: 'Posizione (1-52)', kind: 'number', min: 1, max: 52 },
    },
  },
  defaultConfig: { configVersion: 1 },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, _config, input) => {
    const { namedCard, namedPosition } = input;

    // Build a custom deck where namedCard is at namedPosition (1-based)
    const remaining = STANDARD_DECK.filter(
      (card) => card.toLowerCase() !== namedCard.toLowerCase()
    );

    // Insert namedCard at 0-based index namedPosition - 1
    const customDeck: string[] = [...remaining];
    customDeck.splice(namedPosition - 1, 0, namedCard);

    // Trim to 52 cards (handles both in-deck and out-of-deck named cards)
    const finalDeck = customDeck.slice(0, 52);

    return {
      success: true,
      data: {
        namedCard: input.namedCard,
        namedPosition: input.namedPosition,
        deck: finalDeck,
        reveal: true,
        message:
          'Hai detto ' + String.fromCharCode(34) +
          input.namedCard +
          String.fromCharCode(34) + ' alla posizione ' +
          String(input.namedPosition) +
          '. Eccolo esattamente lì!',
        verifiable: true,
        instruction:
          'Contate le carte fino alla posizione indicata. È esattamente la vostra carta.',
      },
      audit: {
        namedCard: input.namedCard,
        namedPosition: input.namedPosition,
      },
    };
  },
};
