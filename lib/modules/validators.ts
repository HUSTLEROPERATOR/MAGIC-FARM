import { z } from 'zod';

export const baseConfigSchema = z.object({
  configVersion: z.number().int().min(1),
}).passthrough();

export function validateBaseConfig(config: unknown) {
  return baseConfigSchema.parse(config);
}
