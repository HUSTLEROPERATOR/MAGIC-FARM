import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  revealAt: z.enum(['end_round', 'custom']),
  outputFormat: z.string().min(1),
  tableScope: z.enum(['tavolo', 'sala']),
});
type EnvelopeConfig = z.infer<typeof configSchema>;

export const envelopePrediction: MagicModuleHandler<EnvelopeConfig, void> = {
  key: 'ENVELOPE_PREDICTION',
  meta: {
    name: 'Predizione in Busta',
    description: 'Genera una predizione sigillata. Output server-side, rivelazione al momento configurato.',
    icon: 'FileText', difficulty: 'avanzato', scope: 'table', priority: 5,
  },
  ui: {
    fields: {
      revealAt: { label: 'Momento rivelazione', kind: 'select', options: ['end_round', 'custom'] },
      outputFormat: { label: 'Formato output', kind: 'text' },
      tableScope: { label: 'Ambito', kind: 'select', options: ['tavolo', 'sala'] },
    },
  },
  defaultConfig: { configVersion: 1, revealAt: 'end_round', outputFormat: 'La predizione sigillata recita: {{prediction}}', tableScope: 'tavolo' },
  validateConfig: (config) => configSchema.parse(config),
  isAvailable: async (ctx) => !!ctx.roundId,
  onEnable: async (_ctx, _config) => {
    // Hook — actual DB write happens in resolver.handleModuleEnabled
  },
  run: async (_ctx, config) => {
    return {
      success: true,
      data: { outputFormat: config.outputFormat, revealAt: config.revealAt, tableScope: config.tableScope },
      audit: { scoreDelta: 0, action: 'envelope_reveal' },
    };
  },
};
