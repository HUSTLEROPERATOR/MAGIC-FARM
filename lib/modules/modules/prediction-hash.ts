import { z } from "zod";
import crypto from "crypto";
import type { MagicModuleHandler } from "../types";

const configSchema = z.object({
  configVersion: z.literal(1),
  predictionText: z.string().min(1),
  showHashImmediately: z.boolean(),
});
type PredictionHashConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  action: z.enum(["get_hash", "reveal"]),
});
type PredictionHashInput = z.infer<typeof inputSchema>;

export const predictionHash: MagicModuleHandler<PredictionHashConfig, PredictionHashInput> = {
  key: "PREDICTION_HASH",
  meta: {
    name: "Previsione Hash (SHA-256)",
    description: "Hash SHA-256 mostrato a inizio serata. Rivelazione finale verifica l'impossibile previsione.",
    icon: "Hash",
    difficulty: "avanzato",
    scope: "global",
    priority: 5,
    magicianControlled: true,
  },
  ui: {
    fields: {
      predictionText: { label: "Testo della previsione", kind: "text" },
      showHashImmediately: { label: "Mostra hash subito", kind: "select", options: ["true", "false"] },
    },
  },
  defaultConfig: {
    configVersion: 1,
    predictionText: "La carta scelta sarà l'Asso di Picche nel round finale.",
    showHashImmediately: true,
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (_ctx, _config) => true,
  run: async (_ctx, config, input) => {
    const hash = crypto.createHash("sha256").update(config.predictionText).digest("hex");

    if (input.action === "get_hash") {
      return {
        success: true,
        data: {
          hash,
          algorithm: "SHA-256",
          instruction: "Questo hash è stato generato all'inizio della serata. Non può essere modificato retroattivamente.",
          timestamp: new Date().toISOString(),
        },
        audit: { action: input.action, predictionText: config.predictionText },
      };
    }

    // action === "reveal"
    return {
      success: true,
      data: {
        hash,
        predictionText: config.predictionText,
        verified: true,
        message: `Previsione originale: "${config.predictionText}". Verificate: l'hash SHA-256 di questo testo è esattamente ${hash}. Era scritto prima che sceglieste.`,
      },
      audit: { action: input.action, predictionText: config.predictionText },
    };
  },
};
