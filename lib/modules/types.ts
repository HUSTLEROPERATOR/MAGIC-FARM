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
    playerLabel?: string; // label shown to players instead of name (hides admin info)
    description: string;
    icon: string;
    difficulty: 'base' | 'intermedio' | 'avanzato';
    scope: 'global' | 'table' | 'user';
    priority: number;
    /**
     * If true, module is controlled by the magician (not player-interactive).
     * Input is provided via magician control panel instead of player forms.
     * Allows all modules to be usable during live shows even without custom UI.
     */
    magicianControlled?: boolean;
  };
  ui?: {
    fields: Record<string, ModuleUIField>;
  };
  /** Describes input schema for magician control panel auto-generation */
  inputSchema?: {
    type: 'object' | 'discriminatedUnion';
    fields?: Record<string, { type: string; label: string; options?: string[]; min?: number; max?: number }>;
    discriminator?: string;
    variants?: Record<string, { label: string; fields?: Record<string, { type: string; label: string }> }>;
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
