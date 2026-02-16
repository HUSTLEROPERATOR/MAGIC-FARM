import type { MagicModuleHandler, ModuleContext, ModuleResult } from './types';
import { cardPredictionBinary } from './modules/card-prediction-binary';
import { equivoqueGuided } from './modules/equivoque-guided';
import { envelopePrediction } from './modules/envelope-prediction';

const MODULE_REGISTRY = new Map<string, MagicModuleHandler<any, any>>();

export function registerModule(handler: MagicModuleHandler<any, any>): void {
  if (MODULE_REGISTRY.has(handler.key)) {
    throw new Error(`Module "${handler.key}" is already registered`);
  }
  MODULE_REGISTRY.set(handler.key, handler);
}

export function getModule(key: string): MagicModuleHandler<any, any> | undefined {
  return MODULE_REGISTRY.get(key);
}

export function getAllModules(): MagicModuleHandler<any, any>[] {
  return Array.from(MODULE_REGISTRY.values());
}

export async function executeModule(
  key: string,
  context: ModuleContext,
  configJson: unknown,
  input: unknown,
): Promise<ModuleResult> {
  const handler = MODULE_REGISTRY.get(key);
  if (!handler) {
    return { success: false, code: 'VALIDATION_ERROR', error: `Module "${key}" not found` };
  }

  let config;
  try {
    config = handler.validateConfig(configJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Config validation failed';
    return { success: false, code: 'VALIDATION_ERROR', error: message };
  }

  if (handler.validateInput && input !== undefined) {
    try {
      input = handler.validateInput(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Input validation failed';
      return { success: false, code: 'VALIDATION_ERROR', error: message };
    }
  }

  const available = await handler.isAvailable(context, config);
  if (!available) {
    return { success: false, code: 'NOT_AVAILABLE', error: `Module "${key}" not available in this context` };
  }

  try {
    return await handler.run(context, config, input as any);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Runtime error';
    return { success: false, code: 'RUNTIME_ERROR', error: message };
  }
}

// Register all built-in modules
registerModule(cardPredictionBinary);
registerModule(equivoqueGuided);
registerModule(envelopePrediction);

/** Only for testing — clears all registered modules */
export function _resetRegistryForTesting(): void {
  MODULE_REGISTRY.clear();
}
