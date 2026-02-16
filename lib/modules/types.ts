export interface BaseModuleConfig {
  configVersion: number;
}

export interface ModuleContext {
  eventNightId: string;
  roundId?: string;
  userId?: string;
  tableId?: string;
}

export type ModuleResultCode = 'VALIDATION_ERROR' | 'NOT_AVAILABLE' | 'RUNTIME_ERROR';

export interface ModuleResult {
  success: boolean;
  data?: Record<string, unknown>;
  code?: ModuleResultCode;
  error?: string;
  audit?: Record<string, unknown>;
}

export interface ModuleUIField {
  label: string;
  kind?: 'select' | 'number' | 'text';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface MagicModuleHandler<
  TConfig extends BaseModuleConfig = BaseModuleConfig,
  TInput = void,
> {
  key: string;
  meta: {
    name: string;
    description: string;
    icon: string;
    difficulty: 'base' | 'intermedio' | 'avanzato';
    scope: 'global' | 'table' | 'user';
    priority: number;
  };
  ui?: {
    fields: Record<string, ModuleUIField>;
  };
  defaultConfig: TConfig;
  validateConfig: (config: unknown) => TConfig;
  validateInput?: (input: unknown) => TInput;
  isAvailable: (context: ModuleContext, config: TConfig) => Promise<boolean>;
  onEnable?: (context: ModuleContext, config: TConfig) => Promise<void>;
  run: (context: ModuleContext, config: TConfig, input: TInput) => Promise<ModuleResult>;
}

export interface ActiveModule {
  key: string;
  meta: MagicModuleHandler['meta'];
  config: BaseModuleConfig;
  eventModuleId: string;
  globallyDisabled: boolean;
}
