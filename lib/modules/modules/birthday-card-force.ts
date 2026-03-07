import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
});
type BirthdayCardConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
});
type BirthdayCardInput = z.infer<typeof inputSchema>;

const VALORI = ['Asso', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Fante', 'Regina', 'Re'];
const SEMI = ['Picche', 'Cuori', 'Quadri', 'Fiori'];

export const birthdayCardForce: MagicModuleHandler<BirthdayCardConfig, BirthdayCardInput> = {
  key: 'BIRTHDAY_CARD_FORCE',
  meta: {
    name: 'Carta dalla Data di Nascita',
    description: 'La data di nascita si trasforma in una carta specifica tramite formula magica.',
    icon: 'Calendar',
    difficulty: 'base',
    scope: 'user',
    priority: 65,
    magicianControlled: true,
  },
  ui: {
    fields: {
      day: { label: 'Giorno di nascita', kind: 'number', min: 1, max: 31 },
      month: { label: 'Mese di nascita', kind: 'number', min: 1, max: 12 },
    },
  },
  defaultConfig: {
    configVersion: 1,
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, _config, input) => {
    const valore = VALORI[(input.day - 1) % 13];
    const seme = SEMI[(input.month - 1) % 4];
    const card = `${valore} di ${seme}`;
    return {
      success: true,
      data: {
        day: input.day,
        month: input.month,
        card,
        valore,
        seme,
        message: `Nato il ${input.day}/${input.month}? La tua carta è il ${card}!`,
        formula: `Giorno ${input.day} → ${valore} (posizione ${(input.day - 1) % 13 + 1} nel mazzo). Mese ${input.month} → ${seme}.`,
      },
      audit: { day: input.day, month: input.month, card },
    };
  },
};
