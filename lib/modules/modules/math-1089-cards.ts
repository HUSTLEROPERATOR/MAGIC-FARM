import { z } from "zod";
import type { MagicModuleHandler } from "../types";

const configSchema = z.object({
  configVersion: z.literal(1),
  targetCard: z.string().min(1),
});
type Math1089Config = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0).max(3),
  value: z.number().optional(),
});
type Math1089Input = z.infer<typeof inputSchema>;

export const math1089Cards: MagicModuleHandler<Math1089Config, Math1089Input> = {
  key: "MATH_1089_CARDS",
  meta: {
    name: "1089 con Carte",
    description: "Trick matematico classico: qualsiasi numero a 3 cifre porta sempre a 1089 → 9 di Cuori.",
    icon: "Binary",
    difficulty: "base",
    scope: "user",
    priority: 60,
  },
  ui: {
    fields: {
      targetCard: { label: "Carta finale", kind: "text" },
    },
  },
  defaultConfig: {
    configVersion: 1,
    targetCard: "9 di Cuori",
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    switch (input.step) {
      case 0:
        return {
          success: true,
          data: {
            step: 0,
            instruction: "Pensa a un numero a 3 cifre dove la prima cifra è maggiore dell'ultima (es. 532, 741, 863). Scrivilo.",
            nextStep: 1,
            isLastStep: false,
          },
        };
      case 1:
        return {
          success: true,
          data: {
            step: 1,
            instruction: "Inverti il numero (es. 532 → 235). Sottrai il numero minore dal maggiore.",
            nextStep: 2,
            isLastStep: false,
          },
        };
      case 2:
        return {
          success: true,
          data: {
            step: 2,
            instruction: "Inverti il risultato e sommalo al risultato stesso.",
            nextStep: 3,
            isLastStep: false,
          },
        };
      case 3:
        return {
          success: true,
          data: {
            step: 3,
            result: 1089,
            targetCard: config.targetCard,
            reveal: true,
            isLastStep: true,
            message: `Il risultato è sempre 1089! La tua carta è ${config.targetCard}!`,
            mathNote: "Questo funziona con qualsiasi numero a 3 cifre dove prima cifra > ultima cifra.",
          },
        };
      default:
        return { success: false, error: "Step non valido.", code: "VALIDATION_ERROR" };
    }
  },
};
