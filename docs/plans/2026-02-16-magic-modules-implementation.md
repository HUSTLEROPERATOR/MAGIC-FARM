# Magic Modules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a feature-flag-based "Incantesimi" system with registry, admin UI, and 3 starter modules.

**Architecture:** Code-first Module Registry in `lib/modules/` with Prisma DB for activation state. Admin UI as expandable panel in existing event cards. Player-facing integration via resolver that injects active modules into round flow.

**Tech Stack:** Next.js 14 App Router, Prisma/PostgreSQL, Zod validation, Tailwind CSS (magic design system), Vitest for tests.

---

### Task 1: Prisma Schema — Add 3 new models + enums

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add enums and models to schema**

Add after the `EventMetrics` model (line ~647), before `OpenStageApplication`:

```prisma
// ============================================================================
// MAGIC MODULES (Incantesimi — Feature Flags per Evento)
// ============================================================================

model MagicModule {
  id              String        @id @default(cuid())
  key             String        @unique
  name            String
  description     String?
  isGlobalEnabled Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  eventModules    EventModule[]

  @@map("magic_modules")
}

model EventModule {
  id             String      @id @default(cuid())
  eventNightId   String
  moduleId       String
  enabled        Boolean     @default(false)
  configJson     Json?
  startsAt       DateTime?
  endsAt         DateTime?
  toggledBy      String?
  toggledAt      DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  eventNight     EventNight  @relation(fields: [eventNightId], references: [id])
  module         MagicModule @relation(fields: [moduleId], references: [id])

  @@unique([eventNightId, moduleId])
  @@index([eventNightId])
  @@index([moduleId])
  @@index([eventNightId, enabled])
  @@index([toggledAt])
  @@map("event_modules")
}

enum ModuleInteractionActor {
  USER
  SYSTEM
}

enum ModuleInteractionStatus {
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

model ModuleInteraction {
  id            String                   @id @default(cuid())
  eventNightId  String
  roundId       String
  moduleKey     String
  actor         ModuleInteractionActor   @default(USER)
  userId        String?
  tableId       String?
  status        ModuleInteractionStatus  @default(IN_PROGRESS)
  state         Json?
  completedAt   DateTime?
  createdAt     DateTime                 @default(now())
  updatedAt     DateTime                 @updatedAt

  eventNight    EventNight  @relation(fields: [eventNightId], references: [id])
  user          User?       @relation(fields: [userId], references: [id])

  @@unique([eventNightId, roundId, moduleKey, actor, userId, tableId])
  @@index([eventNightId, roundId])
  @@index([userId])
  @@map("module_interactions")
}
```

**Step 2: Add relations to existing models**

In the `EventNight` model, add after `metrics EventMetrics?` (line ~203):

```prisma
  eventModules        EventModule[]
  moduleInteractions  ModuleInteraction[]
```

In the `User` model, add after `badgeAwards BadgeAward[]` (line ~40):

```prisma
  moduleInteractions  ModuleInteraction[]
```

**Step 3: Generate migration and client**

Run: `npx prisma migrate dev --name add-magic-modules`
Expected: Migration created and applied successfully.

**Step 4: Verify Prisma client types**

Run: `npx prisma generate`
Expected: `Generated Prisma Client`

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add MagicModule, EventModule, ModuleInteraction models

Adds schema for feature-flag-based module system (Incantesimi).
Three models: catalog, per-event activation, player interaction state."
```

---

### Task 2: Module Registry — Types + Validators

**Files:**
- Create: `lib/modules/types.ts`
- Create: `lib/modules/validators.ts`
- Test: `__tests__/modules/validators.test.ts`

**Step 1: Write the types file**

Create `lib/modules/types.ts`:

```typescript
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
```

**Step 2: Write the failing test for validators**

Create `__tests__/modules/validators.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateBaseConfig } from '@/lib/modules/validators';

describe('validateBaseConfig', () => {
  it('passes with valid configVersion', () => {
    const result = validateBaseConfig({ configVersion: 1 });
    expect(result).toEqual({ configVersion: 1 });
  });

  it('fails without configVersion', () => {
    expect(() => validateBaseConfig({})).toThrow();
  });

  it('fails with non-number configVersion', () => {
    expect(() => validateBaseConfig({ configVersion: 'one' })).toThrow();
  });

  it('fails with configVersion < 1', () => {
    expect(() => validateBaseConfig({ configVersion: 0 })).toThrow();
  });

  it('passes through extra fields', () => {
    const result = validateBaseConfig({ configVersion: 1, extra: 'value' });
    expect(result.configVersion).toBe(1);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/modules/validators.test.ts`
Expected: FAIL — module not found

**Step 4: Write validators implementation**

Create `lib/modules/validators.ts`:

```typescript
import { z } from 'zod';

export const baseConfigSchema = z.object({
  configVersion: z.number().int().min(1),
}).passthrough();

export function validateBaseConfig(config: unknown) {
  return baseConfigSchema.parse(config);
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/modules/validators.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add lib/modules/types.ts lib/modules/validators.ts __tests__/modules/validators.test.ts
git commit -m "feat(modules): add types and base config validator"
```

---

### Task 3: Module Registry — Core registry.ts

**Files:**
- Create: `lib/modules/registry.ts`
- Test: `__tests__/modules/registry.test.ts`

**Step 1: Write the failing test**

Create `__tests__/modules/registry.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerModule,
  getModule,
  getAllModules,
  executeModule,
  _resetRegistryForTesting,
} from '@/lib/modules/registry';
import type { MagicModuleHandler, ModuleContext } from '@/lib/modules/types';

const mockHandler: MagicModuleHandler<{ configVersion: number }, { choice: string }> = {
  key: 'TEST_MODULE',
  meta: {
    name: 'Test',
    description: 'Test module',
    icon: 'Sparkles',
    difficulty: 'base',
    scope: 'user',
    priority: 10,
  },
  defaultConfig: { configVersion: 1 },
  validateConfig: (c: unknown) => {
    const obj = c as Record<string, unknown>;
    if (obj.configVersion !== 1) throw new Error('invalid config');
    return obj as { configVersion: number };
  },
  validateInput: (i: unknown) => {
    const obj = i as Record<string, unknown>;
    if (typeof obj.choice !== 'string') throw new Error('invalid input');
    return obj as { choice: string };
  },
  isAvailable: async () => true,
  run: async (_ctx, _cfg, input) => ({
    success: true,
    data: { picked: input.choice },
    audit: { scoreDelta: 10 },
  }),
};

describe('Module Registry', () => {
  beforeEach(() => {
    _resetRegistryForTesting();
  });

  it('registers and retrieves a module', () => {
    registerModule(mockHandler);
    expect(getModule('TEST_MODULE')).toBe(mockHandler);
  });

  it('returns undefined for unknown module', () => {
    expect(getModule('UNKNOWN')).toBeUndefined();
  });

  it('lists all registered modules', () => {
    registerModule(mockHandler);
    expect(getAllModules()).toHaveLength(1);
  });

  it('throws on duplicate registration', () => {
    registerModule(mockHandler);
    expect(() => registerModule(mockHandler)).toThrow();
  });

  it('executeModule returns success for valid input', async () => {
    registerModule(mockHandler);
    const ctx: ModuleContext = { eventNightId: 'evt1', roundId: 'r1' };
    const result = await executeModule('TEST_MODULE', ctx, { configVersion: 1 }, { choice: 'red' });
    expect(result.success).toBe(true);
    expect(result.data?.picked).toBe('red');
  });

  it('executeModule returns VALIDATION_ERROR for bad config', async () => {
    registerModule(mockHandler);
    const ctx: ModuleContext = { eventNightId: 'evt1' };
    const result = await executeModule('TEST_MODULE', ctx, { configVersion: 99 }, undefined);
    expect(result.success).toBe(false);
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('executeModule returns error for unknown module', async () => {
    const ctx: ModuleContext = { eventNightId: 'evt1' };
    const result = await executeModule('NOPE', ctx, {}, undefined);
    expect(result.success).toBe(false);
    expect(result.code).toBe('VALIDATION_ERROR');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/modules/registry.test.ts`
Expected: FAIL

**Step 3: Write registry implementation**

Create `lib/modules/registry.ts`:

```typescript
import type { MagicModuleHandler, ModuleContext, ModuleResult } from './types';

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

/** Only for testing — clears all registered modules */
export function _resetRegistryForTesting(): void {
  MODULE_REGISTRY.clear();
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/modules/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/modules/registry.ts __tests__/modules/registry.test.ts
git commit -m "feat(modules): add module registry with executeModule"
```

---

### Task 4: Three Starter Modules

**Files:**
- Create: `lib/modules/modules/card-prediction-binary.ts`
- Create: `lib/modules/modules/equivoque-guided.ts`
- Create: `lib/modules/modules/envelope-prediction.ts`
- Test: `__tests__/modules/card-prediction-binary.test.ts`
- Test: `__tests__/modules/equivoque-guided.test.ts`
- Test: `__tests__/modules/envelope-prediction.test.ts`

**Step 1: Write failing test for CARD_PREDICTION_BINARY**

Create `__tests__/modules/card-prediction-binary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cardPredictionBinary } from '@/lib/modules/modules/card-prediction-binary';

describe('CARD_PREDICTION_BINARY', () => {
  it('has correct key and meta', () => {
    expect(cardPredictionBinary.key).toBe('CARD_PREDICTION_BINARY');
    expect(cardPredictionBinary.meta.scope).toBe('user');
    expect(cardPredictionBinary.meta.difficulty).toBe('base');
  });

  it('validates config', () => {
    const config = cardPredictionBinary.validateConfig({
      configVersion: 1,
      roundId: 'r1',
      difficulty: 'medio',
      timeLimit: 60,
    });
    expect(config.configVersion).toBe(1);
    expect(config.roundId).toBe('r1');
  });

  it('rejects invalid config', () => {
    expect(() => cardPredictionBinary.validateConfig({ configVersion: 1 })).toThrow();
  });

  it('isAvailable when roundId matches', async () => {
    const config = cardPredictionBinary.validateConfig({
      configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60,
    });
    expect(await cardPredictionBinary.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await cardPredictionBinary.isAvailable({ eventNightId: 'e1', roundId: 'r2' }, config)).toBe(false);
  });

  it('validates input', () => {
    const input = cardPredictionBinary.validateInput!({ choice: 'rosso' });
    expect(input.choice).toBe('rosso');
  });

  it('run returns success with scoreDelta', async () => {
    const config = cardPredictionBinary.validateConfig({
      configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60,
    });
    const result = await cardPredictionBinary.run(
      { eventNightId: 'e1', roundId: 'r1', userId: 'u1' },
      config,
      { choice: 'rosso' },
    );
    expect(result.success).toBe(true);
    expect(result.audit?.scoreDelta).toBeDefined();
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run __tests__/modules/card-prediction-binary.test.ts`
Expected: FAIL

**Step 3: Implement CARD_PREDICTION_BINARY**

Create `lib/modules/modules/card-prediction-binary.ts`:

```typescript
import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  roundId: z.string().min(1),
  difficulty: z.enum(['facile', 'medio', 'difficile']),
  timeLimit: z.number().int().min(10).max(300),
});

type CardConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  choice: z.string().min(1),
});

type CardInput = z.infer<typeof inputSchema>;

const SCORE_BY_DIFFICULTY: Record<string, number> = {
  facile: 25,
  medio: 50,
  difficile: 100,
};

export const cardPredictionBinary: MagicModuleHandler<CardConfig, CardInput> = {
  key: 'CARD_PREDICTION_BINARY',
  meta: {
    name: 'Predizione Carta',
    description: 'Il giocatore predice il colore o il valore di una carta. Scelta binaria con timer.',
    icon: 'CrystalBall',
    difficulty: 'base',
    scope: 'user',
    priority: 10,
  },
  ui: {
    fields: {
      roundId: { label: 'Round', kind: 'text' },
      difficulty: { label: 'Difficolta', kind: 'select', options: ['facile', 'medio', 'difficile'] },
      timeLimit: { label: 'Tempo limite (secondi)', kind: 'number', min: 10, max: 300, step: 5 },
    },
  },
  defaultConfig: { configVersion: 1, roundId: '', difficulty: 'medio', timeLimit: 60 },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (ctx, config) => ctx.roundId === config.roundId,
  run: async (_ctx, config, input) => {
    const correct = Math.random() > 0.5;
    const scoreDelta = correct ? SCORE_BY_DIFFICULTY[config.difficulty] ?? 50 : 0;
    return {
      success: true,
      data: { choice: input.choice, correct, scoreDelta },
      audit: { scoreDelta, choice: input.choice, correct, difficulty: config.difficulty },
    };
  },
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/modules/card-prediction-binary.test.ts`
Expected: PASS

**Step 5: Write failing test for EQUIVOQUE_GUIDED**

Create `__tests__/modules/equivoque-guided.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { equivoqueGuided } from '@/lib/modules/modules/equivoque-guided';

describe('EQUIVOQUE_GUIDED', () => {
  it('has correct key and meta', () => {
    expect(equivoqueGuided.key).toBe('EQUIVOQUE_GUIDED');
    expect(equivoqueGuided.meta.scope).toBe('user');
    expect(equivoqueGuided.meta.difficulty).toBe('intermedio');
  });

  it('validates config', () => {
    const config = equivoqueGuided.validateConfig({
      configVersion: 1,
      scriptVariant: 'classic',
      revealStyle: 'dramatic',
    });
    expect(config.revealStyle).toBe('dramatic');
  });

  it('rejects config without scriptVariant', () => {
    expect(() => equivoqueGuided.validateConfig({
      configVersion: 1, revealStyle: 'dramatic',
    })).toThrow();
  });

  it('isAvailable when roundId exists', async () => {
    const config = equivoqueGuided.validateConfig({
      configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic',
    });
    expect(await equivoqueGuided.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await equivoqueGuided.isAvailable({ eventNightId: 'e1' }, config)).toBe(false);
  });

  it('validates input with step and choice', () => {
    const input = equivoqueGuided.validateInput!({ step: 1, choice: 'left' });
    expect(input.step).toBe(1);
  });

  it('run returns success', async () => {
    const config = equivoqueGuided.validateConfig({
      configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic',
    });
    const result = await equivoqueGuided.run(
      { eventNightId: 'e1', roundId: 'r1', userId: 'u1' },
      config,
      { step: 0, choice: 'left' },
    );
    expect(result.success).toBe(true);
  });
});
```

**Step 6: Run to verify it fails**

Run: `npx vitest run __tests__/modules/equivoque-guided.test.ts`
Expected: FAIL

**Step 7: Implement EQUIVOQUE_GUIDED**

Create `lib/modules/modules/equivoque-guided.ts`:

```typescript
import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  scriptVariant: z.string().min(1),
  revealStyle: z.enum(['dramatic', 'instant']),
});

type EquivoqueConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({
  step: z.number().int().min(0),
  choice: z.string().min(1),
});

type EquivoqueInput = z.infer<typeof inputSchema>;

const TOTAL_STEPS = 3;

export const equivoqueGuided: MagicModuleHandler<EquivoqueConfig, EquivoqueInput> = {
  key: 'EQUIVOQUE_GUIDED',
  meta: {
    name: 'Equivoque Guidato',
    description: 'Script guidato a step con scelte del giocatore. Rivelazione finale basata sullo stile scelto.',
    icon: 'ScrollText',
    difficulty: 'intermedio',
    scope: 'user',
    priority: 20,
  },
  ui: {
    fields: {
      scriptVariant: { label: 'Variante script', kind: 'text' },
      revealStyle: { label: 'Stile rivelazione', kind: 'select', options: ['dramatic', 'instant'] },
    },
  },
  defaultConfig: { configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic' },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),
  isAvailable: async (ctx) => !!ctx.roundId,
  run: async (_ctx, config, input) => {
    const isLastStep = input.step >= TOTAL_STEPS - 1;
    return {
      success: true,
      data: {
        step: input.step,
        choice: input.choice,
        isLastStep,
        revealStyle: isLastStep ? config.revealStyle : undefined,
        nextStep: isLastStep ? undefined : input.step + 1,
      },
      audit: {
        step: input.step,
        choice: input.choice,
        isLastStep,
        scoreDelta: isLastStep ? 75 : 0,
      },
    };
  },
};
```

**Step 8: Run test to verify it passes**

Run: `npx vitest run __tests__/modules/equivoque-guided.test.ts`
Expected: PASS

**Step 9: Write failing test for ENVELOPE_PREDICTION**

Create `__tests__/modules/envelope-prediction.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { envelopePrediction } from '@/lib/modules/modules/envelope-prediction';

describe('ENVELOPE_PREDICTION', () => {
  it('has correct key and meta', () => {
    expect(envelopePrediction.key).toBe('ENVELOPE_PREDICTION');
    expect(envelopePrediction.meta.scope).toBe('table');
    expect(envelopePrediction.meta.difficulty).toBe('avanzato');
    expect(envelopePrediction.meta.priority).toBe(5);
  });

  it('validates config', () => {
    const config = envelopePrediction.validateConfig({
      configVersion: 1,
      revealAt: 'end_round',
      outputFormat: 'La carta scelta sara: {{prediction}}',
      tableScope: 'tavolo',
    });
    expect(config.revealAt).toBe('end_round');
  });

  it('rejects config with invalid revealAt', () => {
    expect(() => envelopePrediction.validateConfig({
      configVersion: 1, revealAt: 'never', outputFormat: 'x', tableScope: 'tavolo',
    })).toThrow();
  });

  it('isAvailable when roundId exists', async () => {
    const config = envelopePrediction.validateConfig({
      configVersion: 1, revealAt: 'end_round', outputFormat: 'x', tableScope: 'tavolo',
    });
    expect(await envelopePrediction.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await envelopePrediction.isAvailable({ eventNightId: 'e1' }, config)).toBe(false);
  });

  it('has no validateInput (player does not interact)', () => {
    expect(envelopePrediction.validateInput).toBeUndefined();
  });

  it('has onEnable hook', () => {
    expect(envelopePrediction.onEnable).toBeDefined();
  });
});
```

**Step 10: Run to verify it fails**

Run: `npx vitest run __tests__/modules/envelope-prediction.test.ts`
Expected: FAIL

**Step 11: Implement ENVELOPE_PREDICTION**

Create `lib/modules/modules/envelope-prediction.ts`:

```typescript
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
    icon: 'FileText',
    difficulty: 'avanzato',
    scope: 'table',
    priority: 5,
  },
  ui: {
    fields: {
      revealAt: { label: 'Momento rivelazione', kind: 'select', options: ['end_round', 'custom'] },
      outputFormat: { label: 'Formato output', kind: 'text' },
      tableScope: { label: 'Ambito', kind: 'select', options: ['tavolo', 'sala'] },
    },
  },
  defaultConfig: {
    configVersion: 1,
    revealAt: 'end_round',
    outputFormat: 'La predizione sigillata recita: {{prediction}}',
    tableScope: 'tavolo',
  },
  validateConfig: (config) => configSchema.parse(config),
  isAvailable: async (ctx) => !!ctx.roundId,
  onEnable: async (_ctx, _config) => {
    // Creates ModuleInteraction with actor=SYSTEM via resolver
    // This is a hook — actual DB write happens in resolver.handleModuleEnabled
  },
  run: async (_ctx, config) => {
    // Envelope does not have player interaction — run returns the reveal data
    return {
      success: true,
      data: {
        outputFormat: config.outputFormat,
        revealAt: config.revealAt,
        tableScope: config.tableScope,
      },
      audit: { scoreDelta: 0, action: 'envelope_reveal' },
    };
  },
};
```

**Step 12: Run all module tests**

Run: `npx vitest run __tests__/modules/`
Expected: ALL PASS

**Step 13: Commit**

```bash
git add lib/modules/modules/ __tests__/modules/
git commit -m "feat(modules): add 3 starter modules

CARD_PREDICTION_BINARY, EQUIVOQUE_GUIDED, ENVELOPE_PREDICTION
with config/input validation and tests."
```

---

### Task 5: Wire Modules into Registry + Add Audit Actions

**Files:**
- Modify: `lib/modules/registry.ts`
- Modify: `lib/audit/logger.ts`

**Step 1: Wire module imports into registry**

Add at the top of `lib/modules/registry.ts`, after existing imports:

```typescript
import { cardPredictionBinary } from './modules/card-prediction-binary';
import { equivoqueGuided } from './modules/equivoque-guided';
import { envelopePrediction } from './modules/envelope-prediction';

// Register all built-in modules
registerModule(cardPredictionBinary);
registerModule(equivoqueGuided);
registerModule(envelopePrediction);
```

Note: The `registerModule` calls must come AFTER the function definition. Move the function definitions above, or restructure so that the imports and registrations are at module-level after function declarations.

**Step 2: Add audit actions to logger.ts**

In `lib/audit/logger.ts`, add to the `AUDIT_ACTIONS` object (after `USER_DELETED` line ~123):

```typescript
  // Magic Modules
  MODULE_ENABLED: 'MODULE_ENABLED',
  MODULE_DISABLED: 'MODULE_DISABLED',
  MODULE_CONFIGURED: 'MODULE_CONFIGURED',
  MODULE_EXECUTED: 'MODULE_EXECUTED',
  MODULE_EXECUTION_BLOCKED: 'MODULE_EXECUTION_BLOCKED',
```

**Step 3: Verify tests still pass**

Run: `npx vitest run __tests__/modules/`
Expected: PASS

**Step 4: Commit**

```bash
git add lib/modules/registry.ts lib/audit/logger.ts
git commit -m "feat(modules): wire starter modules into registry + audit actions"
```

---

### Task 6: Module Resolver

**Files:**
- Create: `lib/modules/resolver.ts`
- Test: `__tests__/modules/resolver.test.ts`

**Step 1: Write the failing test**

Create `__tests__/modules/resolver.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing resolver
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    eventModule: {
      findMany: vi.fn(),
    },
    magicModule: {
      findFirst: vi.fn(),
    },
    moduleInteraction: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AUDIT_ACTIONS: {
    MODULE_EXECUTION_BLOCKED: 'MODULE_EXECUTION_BLOCKED',
    MODULE_ENABLED: 'MODULE_ENABLED',
  },
}));

import { getActiveModulesForRound } from '@/lib/modules/resolver';
import { prisma } from '@/lib/db/prisma';

describe('getActiveModulesForRound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no event modules exist', async () => {
    vi.mocked(prisma.eventModule.findMany).mockResolvedValue([]);
    const result = await getActiveModulesForRound('evt1', 'r1');
    expect(result).toEqual([]);
  });

  it('filters out modules with invalid config', async () => {
    vi.mocked(prisma.eventModule.findMany).mockResolvedValue([
      {
        id: 'em1',
        eventNightId: 'evt1',
        moduleId: 'm1',
        enabled: true,
        configJson: { configVersion: 999 },
        startsAt: null,
        endsAt: null,
        toggledBy: null,
        toggledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        module: { id: 'm1', key: 'CARD_PREDICTION_BINARY', name: 'Test', description: null, isGlobalEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      } as any,
    ]);
    const result = await getActiveModulesForRound('evt1', 'r1');
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run __tests__/modules/resolver.test.ts`
Expected: FAIL

**Step 3: Write resolver implementation**

Create `lib/modules/resolver.ts`:

```typescript
import { prisma } from '@/lib/db/prisma';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { getModule, getAllModules } from './registry';
import type { ActiveModule, ModuleContext } from './types';

// Simple TTL cache for getActiveModulesForRound
const resolverCache = new Map<string, { data: ActiveModule[]; expiresAt: number }>();
const CACHE_TTL_MS = 15_000;

export async function getActiveModulesForRound(
  eventNightId: string,
  roundId: string,
): Promise<ActiveModule[]> {
  const cacheKey = `${eventNightId}:${roundId}`;
  const cached = resolverCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const now = new Date();
  const eventModules = await prisma.eventModule.findMany({
    where: {
      eventNightId,
      enabled: true,
    },
    include: {
      module: true,
    },
  });

  const active: ActiveModule[] = [];

  for (const em of eventModules) {
    // Check global disable
    if (!em.module.isGlobalEnabled) continue;

    // Check time window
    if (em.startsAt && em.startsAt > now) continue;
    if (em.endsAt && em.endsAt < now) continue;

    const handler = getModule(em.module.key);
    if (!handler) continue;

    // Validate config
    let config;
    try {
      config = handler.validateConfig(em.configJson);
    } catch {
      await createAuditLog({
        action: AUDIT_ACTIONS.MODULE_EXECUTION_BLOCKED,
        metadata: { eventNightId, moduleKey: em.module.key, code: 'VALIDATION_ERROR' },
      });
      continue;
    }

    // Check availability
    const ctx: ModuleContext = { eventNightId, roundId };
    try {
      const available = await handler.isAvailable(ctx, config);
      if (!available) continue;
    } catch {
      await createAuditLog({
        action: AUDIT_ACTIONS.MODULE_EXECUTION_BLOCKED,
        metadata: { eventNightId, moduleKey: em.module.key, code: 'NOT_AVAILABLE' },
      });
      continue;
    }

    active.push({
      key: em.module.key,
      meta: handler.meta,
      config,
      eventModuleId: em.id,
      globallyDisabled: false,
    });
  }

  // Sort by priority (lower first)
  active.sort((a, b) => a.meta.priority - b.meta.priority);

  resolverCache.set(cacheKey, { data: active, expiresAt: Date.now() + CACHE_TTL_MS });
  return active;
}

export async function handleModuleEnabled(
  eventNightId: string,
  moduleKey: string,
): Promise<void> {
  const handler = getModule(moduleKey);
  if (!handler?.onEnable) return;

  const em = await prisma.eventModule.findFirst({
    where: {
      eventNightId,
      module: { key: moduleKey },
      enabled: true,
    },
    include: { module: true },
  });
  if (!em) return;

  let config;
  try {
    config = handler.validateConfig(em.configJson);
  } catch {
    return;
  }

  const ctx: ModuleContext = { eventNightId };
  await handler.onEnable(ctx, config);
}

export async function ensureRoundModuleArtifacts(
  eventNightId: string,
  roundId: string,
): Promise<void> {
  const eventModules = await prisma.eventModule.findMany({
    where: { eventNightId, enabled: true },
    include: { module: true },
  });

  for (const em of eventModules) {
    const handler = getModule(em.module.key);
    if (!handler?.onEnable) continue;

    let config;
    try {
      config = handler.validateConfig(em.configJson);
    } catch {
      continue;
    }

    const ctx: ModuleContext = { eventNightId, roundId };
    const available = await handler.isAvailable(ctx, config);
    if (!available) continue;

    // Check if system artifact already exists
    const existing = await prisma.moduleInteraction.findFirst({
      where: {
        eventNightId,
        roundId,
        moduleKey: em.module.key,
        actor: 'SYSTEM',
      },
    });
    if (existing) continue;

    await handler.onEnable(ctx, config);
  }
}

/** Clear resolver cache — useful for testing or after admin toggle */
export function clearResolverCache(): void {
  resolverCache.clear();
}
```

**Step 4: Run tests**

Run: `npx vitest run __tests__/modules/resolver.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/modules/resolver.ts __tests__/modules/resolver.test.ts
git commit -m "feat(modules): add resolver with cache, onEnable hooks, artifact creation"
```

---

### Task 7: Zod Schemas + Rate Limiter for Modules

**Files:**
- Modify: `lib/validations/schemas.ts`
- Modify: `lib/security/rate-limit.ts`

**Step 1: Add Zod schemas for module API bodies**

Add at the end of `lib/validations/schemas.ts` (before the type exports):

```typescript
// Module toggle schema
export const moduleToggleSchema = z.object({
  enabled: z.boolean(),
});

// Module config update schema
export const moduleConfigSchema = z.object({
  configJson: z.record(z.unknown()),
});

// Module execute schema
export const moduleExecuteSchema = z.object({
  roundId: z.string().cuid(),
  input: z.unknown().optional(),
});

export type ModuleToggleInput = z.infer<typeof moduleToggleSchema>;
export type ModuleConfigInput = z.infer<typeof moduleConfigSchema>;
export type ModuleExecuteInput = z.infer<typeof moduleExecuteSchema>;
```

**Step 2: Add module execute rate limiter**

In `lib/security/rate-limit.ts`, add after existing limiters:

```typescript
const moduleExecuteLimiter = new RateLimiterMemory({
  points: 3,
  duration: 10, // 3 executions per 10 seconds
});
```

And add the export function (after `rateLimitIPSubmissions`):

```typescript
/**
 * Rate limit module executions: 3 per 10 seconds per user
 */
export async function rateLimitModuleExecute(userId: string): Promise<boolean> {
  try {
    await moduleExecuteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}
```

**Step 3: Commit**

```bash
git add lib/validations/schemas.ts lib/security/rate-limit.ts
git commit -m "feat(modules): add Zod schemas and rate limiter for module API"
```

---

### Task 8: Admin API Routes

**Files:**
- Create: `app/api/admin/modules/route.ts`
- Create: `app/api/admin/modules/[eventModuleId]/route.ts`
- Create: `app/api/admin/modules/[eventModuleId]/config/route.ts`

**Step 1: Create GET /api/admin/modules**

Create `app/api/admin/modules/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { getAllModules } from '@/lib/modules/registry';

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const eventNightId = request.nextUrl.searchParams.get('eventNightId');
  if (!eventNightId) {
    return NextResponse.json({ error: 'eventNightId richiesto' }, { status: 400 });
  }

  const eventModules = await prisma.eventModule.findMany({
    where: { eventNightId },
    include: { module: true },
  });

  const blockedCounts = await prisma.moduleInteraction.groupBy({
    by: ['moduleKey'],
    where: { eventNightId, status: 'BLOCKED' },
    _count: true,
  });
  const blockedMap = new Map(blockedCounts.map((b) => [b.moduleKey, b._count]));

  const registryModules = getAllModules();
  const eventModuleMap = new Map(eventModules.map((em) => [em.module.key, em]));

  const modules = registryModules.map((handler) => {
    const em = eventModuleMap.get(handler.key);
    return {
      moduleKey: handler.key,
      magicModuleId: em?.module.id ?? null,
      eventModuleId: em?.id ?? null,
      enabled: em?.enabled ?? false,
      configJson: em?.configJson ?? handler.defaultConfig,
      toggledBy: em?.toggledBy ?? null,
      toggledAt: em?.toggledAt ?? null,
      globallyDisabled: em ? !em.module.isGlobalEnabled : false,
      blockedCount: blockedMap.get(handler.key) ?? 0,
      meta: handler.meta,
      ui: handler.ui ?? null,
      defaultConfig: handler.defaultConfig,
    };
  });

  return NextResponse.json({ modules });
}
```

**Step 2: Create PATCH /api/admin/modules/[eventModuleId] (toggle)**

Create `app/api/admin/modules/[eventModuleId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { moduleToggleSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { getModule } from '@/lib/modules/registry';
import { handleModuleEnabled, clearResolverCache } from '@/lib/modules/resolver';

interface RouteParams {
  params: { eventModuleId: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = moduleToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { enabled } = parsed.data;

  // Find or upsert the EventModule
  let eventModule = await prisma.eventModule.findUnique({
    where: { id: params.eventModuleId },
    include: { module: true },
  });

  if (!eventModule) {
    return NextResponse.json({ error: 'Modulo non trovato' }, { status: 404 });
  }

  // Check global disable
  if (enabled && !eventModule.module.isGlobalEnabled) {
    return NextResponse.json({ error: 'Modulo disattivato globalmente' }, { status: 403 });
  }

  const updated = await prisma.eventModule.update({
    where: { id: params.eventModuleId },
    data: {
      enabled,
      toggledBy: session!.user.id,
      toggledAt: new Date(),
    },
    include: { module: true },
  });

  // If toggling ON, call handleModuleEnabled
  if (enabled) {
    await handleModuleEnabled(updated.eventNightId, updated.module.key);
  }

  clearResolverCache();

  await createAuditLog({
    action: enabled ? AUDIT_ACTIONS.MODULE_ENABLED : AUDIT_ACTIONS.MODULE_DISABLED,
    actorUserId: session!.user.id,
    actorRole: 'ADMIN',
    metadata: { eventNightId: updated.eventNightId, moduleKey: updated.module.key, enabled },
  });

  return NextResponse.json({ eventModule: updated });
}
```

**Step 3: Create PUT /api/admin/modules/[eventModuleId]/config**

Create `app/api/admin/modules/[eventModuleId]/config/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { moduleConfigSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { getModule } from '@/lib/modules/registry';
import { clearResolverCache } from '@/lib/modules/resolver';

interface RouteParams {
  params: { eventModuleId: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = moduleConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const eventModule = await prisma.eventModule.findUnique({
    where: { id: params.eventModuleId },
    include: { module: true },
  });

  if (!eventModule) {
    return NextResponse.json({ error: 'Modulo non trovato' }, { status: 404 });
  }

  // Validate config via registry handler
  const handler = getModule(eventModule.module.key);
  if (!handler) {
    return NextResponse.json({ error: 'Handler modulo non trovato' }, { status: 500 });
  }

  try {
    handler.validateConfig(parsed.data.configJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Config non valida';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updated = await prisma.eventModule.update({
    where: { id: params.eventModuleId },
    data: {
      configJson: parsed.data.configJson as any,
    },
  });

  clearResolverCache();

  await createAuditLog({
    action: AUDIT_ACTIONS.MODULE_CONFIGURED,
    actorUserId: session!.user.id,
    actorRole: 'ADMIN',
    metadata: {
      eventNightId: eventModule.eventNightId,
      moduleKey: eventModule.module.key,
      configKeys: Object.keys(parsed.data.configJson),
    },
  });

  return NextResponse.json({ eventModule: updated });
}
```

**Step 4: Commit**

```bash
git add app/api/admin/modules/
git commit -m "feat(api): add admin module API routes (GET, PATCH toggle, PUT config)"
```

---

### Task 9: Player API Routes

**Files:**
- Create: `app/api/serate/[eventId]/modules/route.ts`
- Create: `app/api/serate/[eventId]/modules/[moduleKey]/execute/route.ts`

**Step 1: Create GET /api/serate/[eventId]/modules**

Create `app/api/serate/[eventId]/modules/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getActiveModulesForRound } from '@/lib/modules/resolver';

interface RouteParams {
  params: { eventId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAuth();
  if (response) return response;

  const roundId = request.nextUrl.searchParams.get('roundId');
  if (!roundId) {
    return NextResponse.json({ error: 'roundId richiesto' }, { status: 400 });
  }

  const modules = await getActiveModulesForRound(params.eventId, roundId);
  return NextResponse.json({ modules });
}
```

**Step 2: Create POST /api/serate/[eventId]/modules/[moduleKey]/execute**

Create `app/api/serate/[eventId]/modules/[moduleKey]/execute/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { moduleExecuteSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { executeModule, getModule } from '@/lib/modules/registry';
import { rateLimitModuleExecute } from '@/lib/security/rate-limit';

interface RouteParams {
  params: { eventId: string; moduleKey: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;

  // Rate limit
  const allowed = await rateLimitModuleExecute(userId);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra poco.' }, { status: 429 });
  }

  const body = await request.json();
  const parsed = moduleExecuteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { roundId, input } = parsed.data;
  const { eventId, moduleKey } = params;

  // Check event is LIVE
  const event = await prisma.eventNight.findUnique({
    where: { id: eventId },
    select: { status: true, currentRoundId: true },
  });
  if (!event || event.status !== 'LIVE') {
    return NextResponse.json({ error: 'Evento non attivo' }, { status: 400 });
  }

  // Check round is ACTIVE
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { status: true, eventNightId: true },
  });
  if (!round || round.status !== 'ACTIVE' || round.eventNightId !== eventId) {
    return NextResponse.json({ error: 'Round non attivo' }, { status: 400 });
  }

  // Idempotency: check existing completed interaction
  const existing = await prisma.moduleInteraction.findFirst({
    where: {
      eventNightId: eventId,
      roundId,
      moduleKey,
      userId,
      actor: 'USER',
      status: 'COMPLETED',
    },
  });
  if (existing) {
    return NextResponse.json({
      result: { success: true, data: existing.state, cached: true },
      interaction: existing,
    });
  }

  // Load config from EventModule
  const eventModule = await prisma.eventModule.findFirst({
    where: {
      eventNightId: eventId,
      module: { key: moduleKey },
      enabled: true,
    },
    include: { module: true },
  });
  if (!eventModule) {
    return NextResponse.json({ error: 'Modulo non attivo' }, { status: 404 });
  }

  // Execute
  const ctx = { eventNightId: eventId, roundId, userId };
  const result = await executeModule(moduleKey, ctx, eventModule.configJson, input);

  if (!result.success) {
    await createAuditLog({
      action: AUDIT_ACTIONS.MODULE_EXECUTION_BLOCKED,
      actorUserId: userId,
      metadata: { eventNightId: eventId, moduleKey, code: result.code, error: result.error },
    });

    // Create blocked interaction
    await prisma.moduleInteraction.upsert({
      where: {
        eventNightId_roundId_moduleKey_actor_userId_tableId: {
          eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId, tableId: null,
        },
      },
      create: {
        eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId,
        status: 'BLOCKED', state: { code: result.code, error: result.error },
      },
      update: {
        status: 'BLOCKED', state: { code: result.code, error: result.error },
      },
    });

    return NextResponse.json({ result }, { status: 400 });
  }

  // Determine if completed (check handler for multi-step)
  const handler = getModule(moduleKey);
  const isMultiStep = result.data?.isLastStep === false;
  const status = isMultiStep ? 'IN_PROGRESS' : 'COMPLETED';

  const interaction = await prisma.moduleInteraction.upsert({
    where: {
      eventNightId_roundId_moduleKey_actor_userId_tableId: {
        eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId, tableId: null,
      },
    },
    create: {
      eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId,
      status, state: result.data ?? null,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
    update: {
      status, state: result.data ?? null,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  // Apply scoreDelta once on completion
  if (status === 'COMPLETED' && result.audit?.scoreDelta && typeof result.audit.scoreDelta === 'number' && result.audit.scoreDelta > 0) {
    await prisma.leaderboardEntry.upsert({
      where: { userId },
      create: { userId, points: result.audit.scoreDelta as number },
      update: { points: { increment: result.audit.scoreDelta as number } },
    });
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.MODULE_EXECUTED,
    actorUserId: userId,
    metadata: {
      eventNightId: eventId, moduleKey, roundId,
      scoreDelta: result.audit?.scoreDelta ?? 0,
    },
  });

  return NextResponse.json({ result, interaction });
}
```

**Step 3: Commit**

```bash
git add app/api/serate/
git commit -m "feat(api): add player module API routes (GET active, POST execute)"
```

---

### Task 10: Seed MagicModules + Auto-create EventModules on Event Creation

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `app/api/admin/events/route.ts`

**Step 1: Add MagicModule seed to seed.ts**

Add after the library entries block (before `console.log('Seed completed successfully!')`):

```typescript
  // --- Magic Modules (sync from registry) ---
  const moduleDefinitions = [
    { key: 'CARD_PREDICTION_BINARY', name: 'Predizione Carta', description: 'Scelta binaria su carta con timer' },
    { key: 'EQUIVOQUE_GUIDED', name: 'Equivoque Guidato', description: 'Script guidato a step con rivelazione' },
    { key: 'ENVELOPE_PREDICTION', name: 'Predizione in Busta', description: 'Predizione sigillata con rivelazione programmata' },
  ];

  for (const mod of moduleDefinitions) {
    await prisma.magicModule.upsert({
      where: { key: mod.key },
      update: { name: mod.name, description: mod.description },
      create: { key: mod.key, name: mod.name, description: mod.description },
    });
  }
  console.log(`Synced ${moduleDefinitions.length} magic modules`);

  // Create EventModules for the seed event (all disabled by default)
  const allMagicModules = await prisma.magicModule.findMany();
  for (const mm of allMagicModules) {
    await prisma.eventModule.upsert({
      where: {
        eventNightId_moduleId: { eventNightId: event.id, moduleId: mm.id },
      },
      update: {},
      create: {
        eventNightId: event.id,
        moduleId: mm.id,
        enabled: false,
      },
    });
  }
  console.log(`Created EventModules for seed event`);
```

**Step 2: Add auto-creation in event POST route**

In `app/api/admin/events/route.ts`, add after the `createAuditLog` call (line ~57):

```typescript
  // Auto-create EventModules for all MagicModules (disabled by default)
  const allMagicModules = await prisma.magicModule.findMany();
  if (allMagicModules.length > 0) {
    await prisma.eventModule.createMany({
      data: allMagicModules.map((mm) => ({
        eventNightId: event.id,
        moduleId: mm.id,
        enabled: false,
      })),
    });
  }
```

Add the import for prisma if not already there (it's already imported via `@/lib/db/prisma`).

**Step 3: Run seed to verify**

Run: `npx prisma db seed`
Expected: Output includes "Synced 3 magic modules" and "Created EventModules for seed event"

**Step 4: Commit**

```bash
git add prisma/seed.ts app/api/admin/events/route.ts
git commit -m "feat(modules): seed MagicModules + auto-create EventModules on event creation"
```

---

### Task 11: Admin UI — SpellsPanel Component

**Files:**
- Modify: `app/(protected)/admin/page.tsx`

**Step 1: Add SpellsPanel types and fetch logic**

In `app/(protected)/admin/page.tsx`, add the module types after the existing `EventDetail` interface (line ~246):

```typescript
interface ModuleInfo {
  moduleKey: string;
  magicModuleId: string | null;
  eventModuleId: string | null;
  enabled: boolean;
  configJson: Record<string, unknown>;
  toggledBy: string | null;
  toggledAt: string | null;
  globallyDisabled: boolean;
  blockedCount: number;
  meta: {
    name: string;
    description: string;
    icon: string;
    difficulty: string;
    scope: string;
    priority: number;
  };
  ui: {
    fields: Record<string, {
      label: string;
      kind?: string;
      options?: string[];
      min?: number;
      max?: number;
      step?: number;
    }>;
  } | null;
  defaultConfig: Record<string, unknown>;
}
```

**Step 2: Add SpellsPanel to EventDetailPanel**

In the `EventDetailPanel` component, add after the Rounds section closing `</div>`:

```tsx
      {/* Incantesimi */}
      <div>
        <h4 className="text-white font-medium text-sm mb-2">Incantesimi</h4>
        <SpellsPanel eventId={event.id} />
      </div>
```

**Step 3: Write the SpellsPanel component**

Add the full SpellsPanel component after the `AddPuzzleForm` component:

```tsx
function SpellsPanel({ eventId }: { eventId: string }) {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [configModal, setConfigModal] = useState<ModuleInfo | null>(null);

  const fetchModules = useCallback(async () => {
    const res = await fetch(`/api/admin/modules?eventNightId=${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setModules(data.modules);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  async function handleToggle(mod: ModuleInfo) {
    if (!mod.eventModuleId || mod.globallyDisabled) return;
    setTogglingKey(mod.moduleKey);

    // Optimistic update
    const prev = [...modules];
    setModules((ms) => ms.map((m) =>
      m.moduleKey === mod.moduleKey ? { ...m, enabled: !m.enabled } : m
    ));

    const res = await fetch(`/api/admin/modules/${mod.eventModuleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !mod.enabled }),
    });

    if (!res.ok) {
      setModules(prev); // rollback
    }

    setTogglingKey(null);
    fetchModules();
  }

  if (loading) return <p className="text-white/30 text-xs animate-pulse">Caricamento moduli...</p>;

  if (modules.length === 0) {
    return <p className="text-white/30 text-xs">Nessun modulo disponibile.</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {modules.map((mod) => (
          <ModuleCard
            key={mod.moduleKey}
            mod={mod}
            toggling={togglingKey === mod.moduleKey}
            onToggle={() => handleToggle(mod)}
            onConfigure={() => setConfigModal(mod)}
          />
        ))}
      </div>

      {configModal && (
        <ConfigModal
          mod={configModal}
          onClose={() => setConfigModal(null)}
          onSaved={() => {
            setConfigModal(null);
            fetchModules();
          }}
        />
      )}
    </>
  );
}

function ModuleCard({
  mod,
  toggling,
  onToggle,
  onConfigure,
}: {
  mod: ModuleInfo;
  toggling: boolean;
  onToggle: () => void;
  onConfigure: () => void;
}) {
  const difficultyColor =
    mod.meta.difficulty === 'base' ? 'text-green-400 bg-green-500/20' :
    mod.meta.difficulty === 'intermedio' ? 'text-yellow-400 bg-yellow-500/20' :
    'text-red-400 bg-red-500/20';

  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{mod.meta.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyColor}`}>
              {mod.meta.difficulty}
            </span>
            {mod.blockedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-red-400 bg-red-500/20">
                {mod.blockedCount} bloccati
              </span>
            )}
          </div>
          <span className="text-white/30 text-xs">
            {mod.enabled && mod.toggledAt
              ? `Attivo da ${new Date(mod.toggledAt).toLocaleString('it-IT')}`
              : mod.globallyDisabled
              ? 'Disattivato globalmente'
              : 'Disattivo'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mod.eventModuleId && (
          <button
            onClick={onConfigure}
            className="text-xs text-magic-mystic hover:text-magic-gold"
          >
            Configura
          </button>
        )}
        <button
          onClick={onToggle}
          disabled={toggling || mod.globallyDisabled || !mod.eventModuleId}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            mod.enabled ? 'bg-magic-gold' : 'bg-white/20'
          } ${(toggling || mod.globallyDisabled) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              mod.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ConfigModal({
  mod,
  onClose,
  onSaved,
}: {
  mod: ModuleInfo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [config, setConfig] = useState<Record<string, unknown>>(
    (mod.configJson as Record<string, unknown>) || mod.defaultConfig
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fields = mod.ui?.fields ?? {};
  const fieldKeys = Object.keys(fields).filter((k) => k !== 'configVersion');

  function updateField(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    const res = await fetch(`/api/admin/modules/${mod.eventModuleId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configJson: config }),
    });

    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json();
      setError(data.error || 'Errore nel salvataggio');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card-magic w-full max-w-md mx-4">
        <h3 className="text-magic-gold font-semibold mb-4">Configura: {mod.meta.name}</h3>

        <div className="space-y-3">
          {fieldKeys.map((key) => {
            const field = fields[key];
            const value = config[key] ?? '';

            if (field.kind === 'select' && field.options) {
              return (
                <div key={key}>
                  <label className="text-white/60 text-xs block mb-1">{field.label}</label>
                  <select
                    value={String(value)}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="input-magic w-full text-sm"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.kind === 'number') {
              return (
                <div key={key}>
                  <label className="text-white/60 text-xs block mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={Number(value) || 0}
                    onChange={(e) => updateField(key, Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className="input-magic w-full text-sm"
                  />
                </div>
              );
            }

            return (
              <div key={key}>
                <label className="text-white/60 text-xs block mb-1">{field.label}</label>
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="input-magic w-full text-sm"
                />
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white/60 px-3 py-1.5">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-magic text-xs disabled:opacity-40"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/(protected)/admin/page.tsx
git commit -m "feat(ui): add SpellsPanel with toggle, config modal in admin event cards"
```

---

### Task 12: Run All Tests + Verify Build

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Run Next.js build**

Run: `npx next build`
Expected: Build succeeds without errors

**Step 3: Fix any issues found**

If tests or build fail, fix the issues and re-run.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve any build/test issues from magic modules implementation"
```

(Only if there were fixes needed.)

---

### Task 13: Run Migration on Dev Database

**Step 1: Verify migration exists**

Run: `ls prisma/migrations/ | tail -1`
Expected: Directory named `*_add_magic_modules`

**Step 2: Run migration**

Run: `npx prisma migrate dev`
Expected: Migration applied successfully

**Step 3: Seed the database**

Run: `npx prisma db seed`
Expected: "Synced 3 magic modules" in output

**Step 4: Verify in Prisma Studio**

Run: `npx prisma studio`
Expected: MagicModule table shows 3 records, EventModule shows records for each event
