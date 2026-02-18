# CLAUDE.md - Magic Farm Project Context

## Project Overview
Next.js 14 App Router app for magic show event management. PostgreSQL via Prisma, NextAuth magic-link auth, custom Tailwind "magic" design system (no shadcn). All UI in Italian.

## Key Patterns
- Admin pages: `'use client'` + `fetch('/api/admin/...')` pattern
- Auth: Read c:\Users\risto\Desktop\MAGIC-FARM\prisma\seed.ts
Read c:\Users\risto\Desktop\MAGIC-FARM\app\(protected)\admin\page.tsx
Read c:\Users\risto\Desktop\MAGIC-FARM\lib\security\rate-limit.ts
Read c:\Users\risto\Desktop\MAGIC-FARM\app\(protected)\serate\[eventId]\page.tsx
Now I have everything needed. Let me write the implementation plan.

Write c:\Users\risto\Desktop\MAGIC-FARM\docs\plans\2026-02-16-magic-modules-implementation.md
2127 lines
Bash Commit implementation plan
IN
cd "c:/Users/risto/Desktop/MAGIC-FARM" && git add docs/plans/2026-02-16-magic-modules-implementation.md && git commit -m "$(cat <<'EOF'
docs: add Magic Modules implementation plan

13-task TDD plan covering: Prisma schema, registry, 3 starter modules,
resolver with cache, admin/player API routes, admin UI SpellsPanel,
seed sync, and build verification.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"

OUT
[main 50f74ba] docs: add Magic Modules implementation plan
 1 file changed, 2126 insertions(+)
 create mode 100644 docs/plans/2026-02-16-magic-modules-implementation.md
Update Todos

Explore project context

Ask clarifying questions

Propose approaches with trade-offs

Present design for approval

Write design doc

Transition to implementation planning
Plan completo e salvato in 2026-02-16-magic-modules-implementation.md. 13 task TDD che coprono:

#	Task	Files
1	Schema Prisma (3 modelli + enum)	prisma/schema.prisma
2	Types + Validators	lib/modules/types.ts, validators.ts
3	Registry core	lib/modules/registry.ts
4	3 moduli starter	lib/modules/modules/*.ts
5	Wire registry + audit actions	registry.ts, logger.ts
6	Resolver con cache	lib/modules/resolver.ts
7	Zod schemas + rate limiter	schemas.ts, rate-limit.ts
8	Admin API routes (GET, PATCH, PUT)	app/api/admin/modules/
9	Player API routes (GET, POST execute)	app/api/serate/[eventId]/modules/
10	Seed + auto-create EventModules	seed.ts, events route.ts
11	Admin UI SpellsPanel	admin/page.tsx
12	Test + Build verification	-
13	Migration + Seed run	-
Due opzioni di esecuzione:

Subagent-Driven (questa sessione) — lancio un agente per task, review tra i task, iterazione veloce
Sessione parallela (separata) — apri nuova sessione con executing-plans, esecuzione batch con checkpoint
Quale approccio preferisci?

Opzione 1: Subagent-Driven (questa sessione). Vai task-by-task con superpowers:executing-plans, checkpoint e commit dopo ogni task.
superpowers:subagent-driven-development skill
I'm using Subagent-Driven Development to execute the Magic Modules plan.

Let me set up the workspace and create the task list.

Bash Create feature branch for magic modules
IN
cd "c:/Users/risto/Desktop/MAGIC-FARM" && git checkout -b feat/magic-modules

Read C:\Users\risto\.claude\plugins\cache\superpowers-marketplace\superpowers\4.0.3\skills\subagent-driven-development\implementer-prompt.md
Update Todos

Task 1: Prisma Schema — Add 3 new models + enums

Task 2: Module Registry — Types + Validators

Task 3: Module Registry — Core registry.ts

Task 4: Three Starter Modules

Task 5: Wire Modules into Registry + Audit Actions

Task 6: Module Resolver

Task 7: Zod Schemas + Rate Limiter

Task 8: Admin API Routes

Task 9: Player API Routes

Task 10: Seed + Auto-create EventModules

Task 11: Admin UI — SpellsPanel

Task 12: Run All Tests + Verify Build

Task 13: Run Migration on Dev Database
Branch feat/magic-modules creato. Parto con Task 1.

Task:Implement Task 1: Prisma Schema
IN
You are implementing Task 1: Prisma Schema — Add 3 new models + enums

## Task Description

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add enums and models to schema**

Add after the `EventMetrics` model (around line 647), before `OpenStageApplication`:

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

In the `EventNight` model, add after `metrics EventMetrics?` (around line 203):

```prisma
  eventModules        EventModule[]
  moduleInteractions  ModuleInteraction[]
```

In the `User` model, add after `badgeAwards BadgeAward[]` (around line 40):

```prisma
  moduleInteractions  ModuleInteraction[]
```

**Step 3: Run prisma validate (NOT migrate — we'll migrate later)**

Run: `npx prisma validate`
Expected: Schema is valid.

**Step 4: Generate Prisma client**

Run: `npx prisma generate`
Expected: `Generated Prisma Client`

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add MagicModule, EventModule, ModuleInteraction models

Adds schema for feature-flag-based module system (Incantesimi).
Three models: catalog, per-event activation, player interaction state."
```

## Context

This is the first task of the Magic Modules feature. The Prisma schema is at `c:/Users/risto/Desktop/MAGIC-FARM/prisma/schema.prisma`. The project uses PostgreSQL. We are on branch `feat/magic-modules`.

IMPORTANT: Do NOT run `prisma migrate dev` — only `prisma validate` and `prisma generate`. Migration will happen in Task 13.

## Your Job

1. Read the current schema.prisma
2. Add the new models and enums in the exact position specified
3. Add the relations to existing EventNight and User models
4. Run prisma validate and prisma generate
5. Commit
6. Self-review and report back

Work from: c:/Users/risto/Desktop/MAGIC-FARM
Task 1 completato - schema Prisma validato e committato (0904e64). Passo a Task 2.

Update Todos

Task 1: Prisma Schema — Add 3 new models + enums

Task 2: Module Registry — Types + Validators

Task 3: Module Registry — Core registry.ts

Task 4: Three Starter Modules

Task 5: Wire Modules into Registry + Audit Actions

Task 6: Module Resolver

Task 7: Zod Schemas + Rate Limiter

Task 8: Admin API Routes

Task 9: Player API Routes

Task 10: Seed + Auto-create EventModules

Task 11: Admin UI — SpellsPanel

Task 12: Run All Tests + Verify Build

Task 13: Run Migration on Dev Database
Task:Implement Task 2: Types + Validators
IN
You are implementing Task 2: Module Registry — Types + Validators

## Task Description

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

## Context

This is Task 2 of 13 for the Magic Modules feature. Task 1 (Prisma schema) is complete. This task creates the TypeScript type system and base config validator that all subsequent tasks depend on. The project uses Vitest for testing with `@/` path alias. Working directory: `c:/Users/risto/Desktop/MAGIC-FARM`. Branch: `feat/magic-modules`.

## Your Job

1. Create the types file exactly as specified
2. Write the test first (TDD)
3. Run the test to verify it fails
4. Write the validator implementation
5. Run test to verify it passes
6. Commit
7. Self-review and report back
Task 2 done (b95bd27). Continuing — Task 3: Registry core.

Update Todos

Task 1: Prisma Schema

Task 2: Types + Validators

Task 3: Core registry.ts

Task 4: Three Starter Modules

Task 5: Wire + Audit Actions

Task 6: Module Resolver

Task 7: Zod Schemas + Rate Limiter

Task 8: Admin API Routes

Task 9: Player API Routes

Task 10: Seed + Auto-create EventModules

Task 11: Admin UI SpellsPanel

Task 12: Tests + Build

Task 13: Migration + Seed
Task:Implement Task 3: Registry core
IN
You are implementing Task 3: Module Registry — Core registry.ts

## Task Description

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

## Context

Task 2 is done — `lib/modules/types.ts` and `lib/modules/validators.ts` exist. This task creates the core registry that stores module handlers and provides `executeModule` with safe mode (validation errors → structured result, never crash). Working directory: `c:/Users/risto/Desktop/MAGIC-FARM`. Branch: `feat/magic-modules`.

## Your Job

1. Write the test first (TDD)
2. Verify it fails
3. Write the implementation
4. Verify tests pass
5. Commit
6. Report back
Task 3 done (036d38f). Task 4: Three Starter Modules.

Update Todos

Task 1: Prisma Schema

Task 2: Types + Validators

Task 3: Core registry.ts

Task 4: Three Starter Modules

Task 5: Wire + Audit Actions

Task 6: Module Resolver

Task 7: Zod Schemas + Rate Limiter

Task 8: Admin API Routes

Task 9: Player API Routes

Task 10: Seed + Auto-create EventModules

Task 11: Admin UI SpellsPanel

Task 12: Tests + Build

Task 13: Migration + Seed
Task:Implement Task 4: Starter Modules
IN
You are implementing Task 4: Three Starter Modules

## Task Description

Create 3 module handler files + 3 test files. TDD: write test first, verify fail, implement, verify pass.

### Module 1: CARD_PREDICTION_BINARY

**Test file:** `__tests__/modules/card-prediction-binary.test.ts`

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
      configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60,
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
      { eventNightId: 'e1', roundId: 'r1', userId: 'u1' }, config, { choice: 'rosso' },
    );
    expect(result.success).toBe(true);
    expect(result.audit?.scoreDelta).toBeDefined();
  });
});
```

**Implementation file:** `lib/modules/modules/card-prediction-binary.ts`

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

const inputSchema = z.object({ choice: z.string().min(1) });
type CardInput = z.infer<typeof inputSchema>;

const SCORE_BY_DIFFICULTY: Record<string, number> = { facile: 25, medio: 50, difficile: 100 };

export const cardPredictionBinary: MagicModuleHandler<CardConfig, CardInput> = {
  key: 'CARD_PREDICTION_BINARY',
  meta: {
    name: 'Predizione Carta',
    description: 'Il giocatore predice il colore o il valore di una carta. Scelta binaria con timer.',
    icon: 'CrystalBall', difficulty: 'base', scope: 'user', priority: 10,
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

### Module 2: EQUIVOQUE_GUIDED

**Test file:** `__tests__/modules/equivoque-guided.test.ts`

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
      configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic',
    });
    expect(config.revealStyle).toBe('dramatic');
  });

  it('rejects config without scriptVariant', () => {
    expect(() => equivoqueGuided.validateConfig({ configVersion: 1, revealStyle: 'dramatic' })).toThrow();
  });

  it('isAvailable when roundId exists', async () => {
    const config = equivoqueGuided.validateConfig({ configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic' });
    expect(await equivoqueGuided.isAvailable({ eventNightId: 'e1', roundId: 'r1' }, config)).toBe(true);
    expect(await equivoqueGuided.isAvailable({ eventNightId: 'e1' }, config)).toBe(false);
  });

  it('validates input with step and choice', () => {
    const input = equivoqueGuided.validateInput!({ step: 1, choice: 'left' });
    expect(input.step).toBe(1);
  });

  it('run returns success', async () => {
    const config = equivoqueGuided.validateConfig({ configVersion: 1, scriptVariant: 'classic', revealStyle: 'dramatic' });
    const result = await equivoqueGuided.run({ eventNightId: 'e1', roundId: 'r1', userId: 'u1' }, config, { step: 0, choice: 'left' });
    expect(result.success).toBe(true);
  });
});
```

**Implementation file:** `lib/modules/modules/equivoque-guided.ts`

```typescript
import { z } from 'zod';
import type { MagicModuleHandler } from '../types';

const configSchema = z.object({
  configVersion: z.literal(1),
  scriptVariant: z.string().min(1),
  revealStyle: z.enum(['dramatic', 'instant']),
});
type EquivoqueConfig = z.infer<typeof configSchema>;

const inputSchema = z.object({ step: z.number().int().min(0), choice: z.string().min(1) });
type EquivoqueInput = z.infer<typeof inputSchema>;

const TOTAL_STEPS = 3;

export const equivoqueGuided: MagicModuleHandler<EquivoqueConfig, EquivoqueInput> = {
  key: 'EQUIVOQUE_GUIDED',
  meta: {
    name: 'Equivoque Guidato',
    description: 'Script guidato a step con scelte del giocatore. Rivelazione finale basata sullo stile scelto.',
    icon: 'ScrollText', difficulty: 'intermedio', scope: 'user', priority: 20,
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
        step: input.step, choice: input.choice, isLastStep,
        revealStyle: isLastStep ? config.revealStyle : undefined,
        nextStep: isLastStep ? undefined : input.step + 1,
      },
      audit: { step: input.step, choice: input.choice, isLastStep, scoreDelta: isLastStep ? 75 : 0 },
    };
  },
};
```

### Module 3: ENVELOPE_PREDICTION

**Test file:** `__tests__/modules/envelope-prediction.test.ts`

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
      configVersion: 1, revealAt: 'end_round', outputFormat: 'La carta scelta sara: {{prediction}}', tableScope: 'tavolo',
    });
    expect(config.revealAt).toBe('end_round');
  });

  it('rejects config with invalid revealAt', () => {
    expect(() => envelopePrediction.validateConfig({
      configVersion: 1, revealAt: 'never', outputFormat: 'x', tableScope: 'tavolo',
    })).toThrow();
  });

  it('isAvailable when roundId exists', async () => {
    const config = envelopePrediction.validateConfig({ configVersion: 1, revealAt: 'end_round', outputFormat: 'x', tableScope: 'tavolo' });
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

**Implementation file:** `lib/modules/modules/envelope-prediction.ts`

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
```

### Final steps

After creating all 6 files, run all module tests:
`npx vitest run __tests__/modules/`
Expected: ALL PASS

Then commit:
```bash
git add lib/modules/modules/ __tests__/modules/card-prediction-binary.test.ts __tests__/modules/equivoque-guided.test.ts __tests__/modules/envelope-prediction.test.ts
git commit -m "feat(modules): add 3 starter modules

CARD_PREDICTION_BINARY, EQUIVOQUE_GUIDED, ENVELOPE_PREDICTION
with config/input validation and tests."
```

## Context

Tasks 1-3 complete. `lib/modules/types.ts` has `MagicModuleHandler` interface. Working directory: `c:/Users/risto/Desktop/MAGIC-FARM`. Branch: `feat/magic-modules`.

## Your Job

1. Create all 3 test files first
2. Run tests to verify they fail
3. Create all 3 implementation files
4. Run all tests to verify they pass
5. Commit
6. Report back
Task 4 done (e9fc3ff). 30 test passano. Task 5: Wire + Audit.

Update Todos

Task 1: Prisma Schema

Task 2: Types + Validators

Task 3: Core registry.ts

Task 4: Three Starter Modules

Task 5: Wire + Audit Actions

Task 6: Module Resolver

Task 7: Zod Schemas + Rate Limiter

Task 8: Admin API Routes

Task 9: Player API Routes

Task 10: Seed + Auto-create EventModules

Task 11: Admin UI SpellsPanel

Task 12: Tests + Build

Task 13: Migration + Seed
Tasks 5, 6, and 7 are smaller and independent. Let me execute them.

Task:Implement Tasks 5+6+7 together
IN
You are implementing Tasks 5, 6, and 7 of the Magic Modules feature. Do them sequentially.

Working directory: `c:/Users/risto/Desktop/MAGIC-FARM`
Branch: `feat/magic-modules`

---

## TASK 5: Wire Modules into Registry + Add Audit Actions

### Step 1: Modify `lib/modules/registry.ts`

The file currently has imports and function definitions. You need to add module imports and registration calls AFTER the function definitions. Read the file first to understand the current structure, then add at the BOTTOM of the file (before `_resetRegistryForTesting`):

```typescript
import { cardPredictionBinary } from './modules/card-prediction-binary';
import { equivoqueGuided } from './modules/equivoque-guided';
import { envelopePrediction } from './modules/envelope-prediction';
```

And registration calls after function definitions:

```typescript
// Register all built-in modules
registerModule(cardPredictionBinary);
registerModule(equivoqueGuided);
registerModule(envelopePrediction);
```

IMPORTANT: The imports must be at the top of the file. The `registerModule` calls must be after the `registerModule` function definition but before `_resetRegistryForTesting`.

ALSO IMPORTANT: The existing `__tests__/modules/registry.test.ts` uses `_resetRegistryForTesting()` in `beforeEach` which clears all modules. Since modules are now auto-registered at import time, the test's `beforeEach` reset will clear them, and tests that register `mockHandler` will work fine. But make sure to verify tests still pass.

### Step 2: Modify `lib/audit/logger.ts`

Add to the `AUDIT_ACTIONS` object, after the `USER_DELETED` entry:

```typescript
  // Magic Modules
  MODULE_ENABLED: 'MODULE_ENABLED',
  MODULE_DISABLED: 'MODULE_DISABLED',
  MODULE_CONFIGURED: 'MODULE_CONFIGURED',
  MODULE_EXECUTED: 'MODULE_EXECUTED',
  MODULE_EXECUTION_BLOCKED: 'MODULE_EXECUTION_BLOCKED',
```

### Step 3: Run tests

Run: `npx vitest run __tests__/modules/`
Expected: ALL PASS

### Step 4: Commit

```bash
git add lib/modules/registry.ts lib/audit/logger.ts
git commit -m "feat(modules): wire starter modules into registry + audit actions"
```

---

## TASK 6: Module Resolver

### Step 1: Create test file `__tests__/modules/resolver.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    eventModule: { findMany: vi.fn() },
    magicModule: { findFirst: vi.fn() },
    moduleInteraction: { findUnique: vi.fn(), upsert: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AUDIT_ACTIONS: {
    MODULE_EXECUTION_BLOCKED: 'MODULE_EXECUTION_BLOCKED',
    MODULE_ENABLED: 'MODULE_ENABLED',
  },
}));

import { getActiveModulesForRound, clearResolverCache } from '@/lib/modules/resolver';
import { prisma } from '@/lib/db/prisma';

describe('getActiveModulesForRound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResolverCache();
  });

  it('returns empty array when no event modules exist', async () => {
    vi.mocked(prisma.eventModule.findMany).mockResolvedValue([]);
    const result = await getActiveModulesForRound('evt1', 'r1');
    expect(result).toEqual([]);
  });

  it('filters out modules with invalid config', async () => {
    vi.mocked(prisma.eventModule.findMany).mockResolvedValue([
      {
        id: 'em1', eventNightId: 'evt1', moduleId: 'm1', enabled: true,
        configJson: { configVersion: 999 }, startsAt: null, endsAt: null,
        toggledBy: null, toggledAt: null, createdAt: new Date(), updatedAt: new Date(),
        module: { id: 'm1', key: 'CARD_PREDICTION_BINARY', name: 'Test', description: null, isGlobalEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      } as any,
    ]);
    const result = await getActiveModulesForRound('evt1', 'r1');
    expect(result).toEqual([]);
  });

  it('filters out globally disabled modules', async () => {
    vi.mocked(prisma.eventModule.findMany).mockResolvedValue([
      {
        id: 'em1', eventNightId: 'evt1', moduleId: 'm1', enabled: true,
        configJson: { configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60 },
        startsAt: null, endsAt: null, toggledBy: null, toggledAt: null,
        createdAt: new Date(), updatedAt: new Date(),
        module: { id: 'm1', key: 'CARD_PREDICTION_BINARY', name: 'Test', description: null, isGlobalEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      } as any,
    ]);
    const result = await getActiveModulesForRound('evt1', 'r1');
    expect(result).toEqual([]);
  });

  it('returns available modules sorted by priority', async () => {
    vi.mocked(prisma.eventModule.findMany).mockResolvedValue([
      {
        id: 'em1', eventNightId: 'evt1', moduleId: 'm1', enabled: true,
        configJson: { configVersion: 1, roundId: 'r1', difficulty: 'medio', timeLimit: 60 },
        startsAt: null, endsAt: null, toggledBy: null, toggledAt: null,
        createdAt: new Date(), updatedAt: new Date(),
        module: { id: 'm1', key: 'CARD_PREDICTION_BINARY', name: 'Predizione Carta', description: null, isGlobalEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      } as any,
    ]);
    const result = await getActiveModulesForRound('evt1', 'r1');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('CARD_PREDICTION_BINARY');
  });
});
```

### Step 2: Run test to verify it fails, then create `lib/modules/resolver.ts`

```typescript
import { prisma } from '@/lib/db/prisma';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { getModule } from './registry';
import type { ActiveModule, ModuleContext } from './types';

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
    where: { eventNightId, enabled: true },
    include: { module: true },
  });

  const active: ActiveModule[] = [];

  for (const em of eventModules) {
    if (!em.module.isGlobalEnabled) continue;
    if (em.startsAt && em.startsAt > now) continue;
    if (em.endsAt && em.endsAt < now) continue;

    const handler = getModule(em.module.key);
    if (!handler) continue;

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

    active.push({ key: em.module.key, meta: handler.meta, config, eventModuleId: em.id, globallyDisabled: false });
  }

  active.sort((a, b) => a.meta.priority - b.meta.priority);
  resolverCache.set(cacheKey, { data: active, expiresAt: Date.now() + CACHE_TTL_MS });
  return active;
}

export async function handleModuleEnabled(eventNightId: string, moduleKey: string): Promise<void> {
  const handler = getModule(moduleKey);
  if (!handler?.onEnable) return;

  const em = await prisma.eventModule.findFirst({
    where: { eventNightId, module: { key: moduleKey }, enabled: true },
    include: { module: true },
  });
  if (!em) return;

  let config;
  try { config = handler.validateConfig(em.configJson); } catch { return; }

  const ctx: ModuleContext = { eventNightId };
  await handler.onEnable(ctx, config);
}

export async function ensureRoundModuleArtifacts(eventNightId: string, roundId: string): Promise<void> {
  const eventModules = await prisma.eventModule.findMany({
    where: { eventNightId, enabled: true },
    include: { module: true },
  });

  for (const em of eventModules) {
    const handler = getModule(em.module.key);
    if (!handler?.onEnable) continue;

    let config;
    try { config = handler.validateConfig(em.configJson); } catch { continue; }

    const ctx: ModuleContext = { eventNightId, roundId };
    const available = await handler.isAvailable(ctx, config);
    if (!available) continue;

    const existing = await prisma.moduleInteraction.findFirst({
      where: { eventNightId, roundId, moduleKey: em.module.key, actor: 'SYSTEM' },
    });
    if (existing) continue;

    await handler.onEnable(ctx, config);
  }
}

export function clearResolverCache(): void {
  resolverCache.clear();
}
```

### Step 3: Run tests, then commit

```bash
git add lib/modules/resolver.ts __tests__/modules/resolver.test.ts
git commit -m "feat(modules): add resolver with cache, onEnable hooks, artifact creation"
```

---

## TASK 7: Zod Schemas + Rate Limiter

### Step 1: Modify `lib/validations/schemas.ts`

Add before the type export lines at the end:

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

### Step 2: Modify `lib/security/rate-limit.ts`

Add the limiter instance after the existing limiter declarations:

```typescript
const moduleExecuteLimiter = new RateLimiterMemory({
  points: 3,
  duration: 10, // 3 executions per 10 seconds
});
```

And add the export function after `rateLimitIPSubmissions`:

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

### Step 3: Run all tests to verify nothing broke

`npx vitest run __tests__/modules/`

### Step 4: Commit

```bash
git add lib/validations/schemas.ts lib/security/rate-limit.ts
git commit -m "feat(modules): add Zod schemas and rate limiter for module API"
```

---

For EACH task: read the files first, make the changes, run tests, commit. Report all 3 task results.
Tasks 5-6-7 completati. Mi fermo qui e salvo il progresso in CLAUDE.md.

Update Todos

Task 1: Prisma Schema

Task 2: Types + Validators

Task 3: Core registry.ts

Task 4: Three Starter Modules

Task 5: Wire + Audit Actions

Task 6: Module Resolver

Task 7: Zod Schemas + Rate Limiter

Task 8: Admin API Routes

Task 9: Player API Routes

Task 10: Seed + Auto-create EventModules

Task 11: Admin UI SpellsPanel

Task 12: Tests + Build

Task 13: Migration + Seed
Globpattern: "CLAUDE.md"
No files found
Write c:\Users\risto\Desktop\MAGIC-FARM\CLAUDE.md
53 lines
You're out of extra usage · resets 8pm (Europe/Rome)

DOVREI AVER TERMINATO TUTTO E CONTINUATO LO SVILUPPO IN CLAUDE CODE SU CLOUD- ANALIZZA NUOVAMENTE IL REPO
Task:Analyze current repo state
IN
Analyze the current state of the MAGIC-FARM repository at c:\Users\risto\Desktop\MAGIC-FARM. I need to know:

1. Current git branch and recent commits (last 20)
2. What files exist in lib/modules/ (full tree)
3. What files exist in app/api/admin/modules/ and app/api/serate/[eventId]/modules/
4. Current test results - run `npx vitest run` and show output
5. Read CLAUDE.md to understand stated progress
6. Check if prisma migrations have been applied (list prisma/migrations/ directory)
7. Check the current prisma/schema.prisma around line 650+ to see if MagicModule models exist
8. Check app/(protected)/admin/page.tsx - does it have SpellsPanel?
9. Check prisma/seed.ts - does it have MagicModule seeding?

Give me a clear "DONE / NOT DONE" checklist of all 13 tasks from the implementation plan.
Bash Check serate API directory structure
IN
ls "c:/Users/risto/Desktop/MAGIC-FARM/app/api/serate/" 2>/dev/null | head -30

OUT
<tool_use_error>Sibling tool call errored</tool_use_error>
Bash List serate API directory structure
IN
find "c:/Users/risto/Desktop/MAGIC-FARM/app/api/serate" -print 2>/dev/null | sort

OUT
<tool_use_error>Sibling tool call errored</tool_use_error>
Globpattern: "prisma/migrations/**/*"
Found 6 files
Globpattern: "prisma/seed.ts"
Found 1 file
Grep "MagicModule|magicModule|magic_module" (in c:/Users/risto/Desktop/MAGIC-FARM/prisma/seed.ts)
1 line of output
API Error: 500 {"type":"error","error":{"type":"api_error","message":"Internal server error"},"request_id":"req_011CYFmt4RojC4Q5bpv7Yssb"}`requireAuth()` / `requireAdmin()` from `lib/auth/rbac.ts` — returns `{ session, response }`
- Validation: Zod schemas in `lib/validations/schemas.ts`
- Audit: `createAuditLog()` from `lib/audit/logger.ts` — never throws
- Answers: SHA-256 hashed with salt, never plaintext
- CSS: `card-magic`, `btn-magic`, `input-magic`, `font-cinzel`
- Icons: `lib/ui/icons.ts` re-exports lucide-react, `<Icon>` wrapper in `components/ui/icon.tsx`
- Toast: `useToast()` from `components/ui/magic-toast.tsx`

## Active Branch: feat/magic-modules

### What's Done (Tasks 1-7 of 13)
- **Task 1**: Prisma schema — `MagicModule`, `EventModule`, `ModuleInteraction` models + enums added
- **Task 2**: `lib/modules/types.ts` (interfaces) + `lib/modules/validators.ts` (base config Zod)
- **Task 3**: `lib/modules/registry.ts` — registerModule, getModule, getAllModules, executeModule
- **Task 4**: 3 starter modules in `lib/modules/modules/`:
  - `card-prediction-binary.ts` (scope: user, priority: 10)
  - `equivoque-guided.ts` (scope: user, priority: 20)
  - `envelope-prediction.ts` (scope: table, priority: 5, has onEnable hook)
- **Task 5**: Modules wired into registry + 5 audit actions added
- **Task 6**: `lib/modules/resolver.ts` — getActiveModulesForRound (15s cache), handleModuleEnabled, ensureRoundModuleArtifacts
- **Task 7**: Zod schemas (moduleToggle, moduleConfig, moduleExecute) + rateLimitModuleExecute

### What's Left (Tasks 8-13)
- **Task 8**: Admin API routes (`/api/admin/modules/` — GET, PATCH toggle, PUT config)
- **Task 9**: Player API routes (`/api/serate/[eventId]/modules/` — GET active, POST execute)
- **Task 10**: Seed MagicModules + auto-create EventModules on event creation
- **Task 11**: Admin UI SpellsPanel (toggle + config modal in event card)
- **Task 12**: Run all tests + verify Next.js build
- **Task 13**: Run Prisma migration + seed on dev DB

### Implementation Plan
Full plan: `docs/plans/2026-02-16-magic-modules-implementation.md`
Design doc: `docs/plans/2026-02-16-magic-modules-design.md`

### Test Status
34 tests passing across `__tests__/modules/` (validators, registry, 3 modules, resolver).
Migration NOT yet applied (schema validated + client generated only).

## Commands
- `npx vitest run` — run tests
- `npx vitest run __tests__/modules/` — run module tests only
- `npx prisma validate` — validate schema
- `npx prisma generate` — generate client
- `npx prisma migrate dev --name X` — create+apply migration
- `npx prisma db seed` — seed database
