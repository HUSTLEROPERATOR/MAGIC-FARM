import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const CARDS_POOL: string[] = [
  'Asso di Picche', '2 di Picche', '3 di Picche', '4 di Picche', '5 di Picche', '6 di Picche', '7 di Picche',
  'Asso di Cuori', '2 di Cuori', '3 di Cuori', '4 di Cuori', '5 di Cuori', '6 di Cuori', '7 di Cuori',
  'Asso di Quadri', '2 di Quadri', '3 di Quadri', '4 di Quadri', '5 di Quadri', '6 di Quadri', '7 di Quadri',
];

function seededShuffle(seed: number, cards: string[]): string[] {
  const arr = [...cards];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (1664525 * s + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function deckToColumns(deck: string[]): { left: string[]; center: string[]; right: string[] } {
  const left: string[] = [];
  const center: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < 21; i++) {
    if (i % 3 === 0) left.push(deck[i]);
    else if (i % 3 === 1) center.push(deck[i]);
    else right.push(deck[i]);
  }
  return { left, center, right };
}

function reassemble(deck: string[], columnChoice: number): string[] {
  const cols = deckToColumns(deck);
  const colsArr = [cols.left, cols.center, cols.right];
  const other = [0, 1, 2].filter((i) => i !== columnChoice);
  const stacked = [...colsArr[other[0] as number]!, ...colsArr[columnChoice]!, ...colsArr[other[1] as number]!];
  return stacked;
}

const configSchema = z.object({
  configVersion: z.literal(1),
  deckSeed: z.number().int(),
});
type TwentyOneConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(3),
  columnChoice: z.number().int().min(0).max(2).optional(),
  deckState: z.array(z.string()).length(21).optional(),
});
type TwentyOneInput = z.infer<typeof inputSchema>;

export const twentyOneCards: MagicModuleHandler<TwentyOneConfig, TwentyOneInput> = {
  key: 'TWENTY_ONE_CARDS',
  meta: {
    name: 'Trick delle 21 Carte',
    description: 'Principio matematico classico: dopo 3 round di selezione, la carta è sempre in posizione 11.',
    icon: 'Grid3x3',
    difficulty: 'intermedio',
    scope: 'user',
    priority: 70,
  },
  ui: {
    fields: {
      deckSeed: { label: 'Seme del mazzo', kind: 'number', min: 1, max: 999999 },
    },
  },
  defaultConfig: {
    configVersion: 1,
    deckSeed: 42,
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    if (input.step === 0) {
      const deck = seededShuffle(config.deckSeed, CARDS_POOL);
      const columns = deckToColumns(deck);
      return {
        success: true,
        data: {
          step: 0,
          deck,
          columns,
          instruction: 'Pensa a una carta. In quale colonna si trova? (0=sinistra, 1=centro, 2=destra)',
          nextStep: 1,
        },
      };
    }

    if (input.step === 1 || input.step === 2) {
      const deck = input.deckState ?? seededShuffle(config.deckSeed, CARDS_POOL);
      const colChoice = input.columnChoice ?? 1;
      const newDeck = reassemble(deck, colChoice);
      const columns = deckToColumns(newDeck);
      const instruction =
        input.step === 1
          ? 'Bene! In quale colonna si trova ora la tua carta? (0=sinistra, 1=centro, 2=destra)'
          : 'Ultima volta: in quale colonna? (0=sinistra, 1=centro, 2=destra)';
      return {
        success: true,
        data: {
          step: input.step,
          deck: newDeck,
          columns,
          instruction,
          nextStep: input.step + 1,
        },
      };
    }

    // step === 3
    const deck = input.deckState ?? seededShuffle(config.deckSeed, CARDS_POOL);
    const colChoice = input.columnChoice ?? 1;
    const finalDeck = reassemble(deck, colChoice);
    const revealedCard = finalDeck[10];
    return {
      success: true,
      data: {
        step: 3,
        revealedCard,
        reveal: true,
        message: 'La tua carta è sempre in posizione 11 (centro del mazzo)! La matematica non mente.',
      },
    };
  },
};
