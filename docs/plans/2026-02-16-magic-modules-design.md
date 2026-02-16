# Magic Modules — Design Document

**Data:** 2026-02-16
**Stato:** Approvato
**Approccio:** Registry code-first + DB leggero (Approccio A)

---

## 1. Obiettivo

Aggiungere un sistema di "Magic Modules" (feature flags per incantesimi) che permetta all'admin di attivare/disattivare moduli di gioco per ogni evento con un click, senza rompere la serata. Ogni modulo e' un plugin isolato con validazione, safe mode, e osservabilita'.

## 2. Schema Prisma — 3 nuovi modelli

### MagicModule (catalogo, sync da registry)

```prisma
model MagicModule {
  id              String        @id @default(cuid())
  key             String        @unique
  name            String
  description     String?
  isGlobalEnabled Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  eventModules    EventModule[]
}
```

### EventModule (attivazione per evento)

```prisma
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
}
```

### ModuleInteraction (stato player/sistema)

```prisma
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
}
```

**Relazioni da aggiungere:**
- `EventNight`: `eventModules EventModule[]`, `moduleInteractions ModuleInteraction[]`
- `User`: `moduleInteractions ModuleInteraction[]`

**Regole actor:**
- `actor=USER`: richiede `userId`, `tableId` opzionale
- `actor=SYSTEM`: richiede `tableId` (se scope table), `userId` null

## 3. Module Registry — Code-first

### Struttura file

```
lib/modules/
  types.ts             — interfacce
  registry.ts          — mappa + import espliciti + executeModule
  resolver.ts          — getActiveModulesForRound + cache + onEnable hooks
  validators.ts        — validazione configVersion + schema base
  modules/
    card-prediction-binary.ts
    equivoque-guided.ts
    envelope-prediction.ts
```

### Interfacce core (types.ts)

```typescript
interface BaseModuleConfig {
  configVersion: number
}

interface ModuleContext {
  eventNightId: string
  roundId?: string
  userId?: string
  tableId?: string
}

interface ModuleResult {
  success: boolean
  data?: Record<string, unknown>
  code?: 'VALIDATION_ERROR' | 'NOT_AVAILABLE' | 'RUNTIME_ERROR'
  error?: string
  audit?: Record<string, unknown>  // include scoreDelta, reason — mai dati sensibili
}

interface MagicModuleHandler<TConfig extends BaseModuleConfig = BaseModuleConfig, TInput = void> {
  key: string
  meta: {
    name: string
    description: string
    icon: string                                    // chiave da lib/ui/icons.ts
    difficulty: 'base' | 'intermedio' | 'avanzato'
    scope: 'global' | 'table' | 'user'
    priority: number                                // piu' basso = prima
  }
  ui?: {
    fields: Record<string, {
      label: string
      kind?: 'select' | 'number' | 'text'
      options?: string[]
      min?: number
      max?: number
      step?: number
    }>
  }
  defaultConfig: TConfig
  validateConfig: (config: unknown) => TConfig      // Zod parse, lancia su errore
  validateInput?: (input: unknown) => TInput         // Zod parse per input player
  isAvailable: (context: ModuleContext, config: TConfig) => Promise<boolean>
  onEnable?: (context: ModuleContext, config: TConfig) => Promise<void>
  run: (context: ModuleContext, config: TConfig, input: TInput) => Promise<ModuleResult>
}
```

### Registry (registry.ts)

```typescript
import { cardPredictionBinary } from './modules/card-prediction-binary'
import { equivoqueGuided } from './modules/equivoque-guided'
import { envelopePrediction } from './modules/envelope-prediction'

const MODULE_REGISTRY = new Map<string, MagicModuleHandler<any, any>>()

registerModule(cardPredictionBinary)
registerModule(equivoqueGuided)
registerModule(envelopePrediction)

function registerModule(handler: MagicModuleHandler<any, any>): void
function getModule(key: string): MagicModuleHandler | undefined
function getAllModules(): MagicModuleHandler[]
async function executeModule(key, context, configJson): Promise<ModuleResult>
```

`executeModule`:
1. Ottiene handler dal registry
2. `validateConfig` — se fallisce ritorna `{ success: false, code: 'VALIDATION_ERROR' }`
3. `isAvailable(ctx, config)` — se false ritorna `{ success: false, code: 'NOT_AVAILABLE' }`
4. `run(ctx, config, input)` — wrappato in try/catch, ritorna `RUNTIME_ERROR` su eccezione
5. Scrive AuditLog su ogni blocco (`MODULE_EXECUTION_BLOCKED`)
6. Mai silenzio totale: ogni errore e' strutturato e loggato

### Resolver (resolver.ts)

```typescript
// Cache 15s per (eventNightId, roundId) — deterministico per tutti i player
async function getActiveModulesForRound(eventNightId, roundId): Promise<ActiveModule[]>

// Chiamata al toggle OFF→ON
async function handleModuleEnabled(eventNightId, moduleKey): Promise<void>

// Chiamata all'avvio round — crea artifact mancanti (es. busta)
async function ensureRoundModuleArtifacts(eventNightId, roundId): Promise<void>
```

`ActiveModule` include: handler meta, config validato, scope, priority, globallyDisabled flag.

## 4. API Routes

### Admin (protette da requireAdmin)

| Method | Path | Scopo |
|---|---|---|
| GET | `/api/admin/modules?eventNightId=X` | Lista moduli con stato DB + registry meta + globallyDisabled + blockedCount |
| PATCH | `/api/admin/modules/[eventModuleId]` | Toggle ON/OFF con upsert se non esiste |
| PUT | `/api/admin/modules/[eventModuleId]/config` | Salva config validata via registry |

**GET response** include per ogni modulo: `moduleKey`, `magicModuleId`, `eventModuleId`, `enabled`, `configJson`, `toggledBy`, `toggledAt`, `globallyDisabled`, `blockedCount`, `meta` (dal registry).

**PATCH toggle:**
- Upsert EventModule se non esiste (evento creato prima della feature)
- Aggiorna `toggledBy`, `toggledAt`
- Se OFF→ON: chiama `handleModuleEnabled()`
- Se `isGlobalEnabled: false`: ritorna 403
- Scrive AuditLog `MODULE_ENABLED` o `MODULE_DISABLED`
- Payload audit: `{ eventNightId, moduleKey, enabled }` (sintetico)

**PUT config:**
- `validateConfig()` prima, salva poi, AuditLog `MODULE_CONFIGURED` dopo
- Payload audit sintetico (chiavi config, no valori potenzialmente sensibili)

### Player (protette da requireAuth)

| Method | Path | Scopo |
|---|---|---|
| GET | `/api/serate/[eventId]/modules?roundId=X` | Moduli attivi per round (via resolver con cache) |
| POST | `/api/serate/[eventId]/modules/[moduleKey]/execute` | Esegui modulo |

**POST execute:**
- Verifica sessione + evento LIVE + round ACTIVE
- Idempotency su `(eventNightId, roundId, moduleKey, userId)` — se ModuleInteraction completata, ritorna risultato cached
- Rate limit: max 3 richieste/10s per user
- `validateInput()` se handler lo definisce
- `run()` calcola `scoreDelta` in `audit`
- Endpoint applica `scoreDelta` una sola volta al completamento ModuleInteraction
- Crea/aggiorna ModuleInteraction con `state`, `status`, `completedAt`

## 5. Admin UI — Pannello "Incantesimi"

Pannello espandibile nella card evento, stesso pattern di tavoli e round.

```
EventDetailPanel (esistente)
  +-- Incantesimi section
      +-- SpellsPanel
          +-- ModuleCard (per ogni modulo)
          |   +-- Icona + Nome + Badge difficolta'
          |   +-- Switch toggle ON/OFF (con stati disabled + loading)
          |   +-- Status: "Attivo da [data]" / "Disattivo" / "Bloccato: [motivo]"
          |   +-- Pulsante "Configura" -> ConfigModal
          |
          +-- (globallyDisabled) -> switch disabilitato + tooltip
          +-- (nessun modulo) -> messaggio vuoto

ConfigModal
  +-- Campi generati da handler.ui.fields (fallback su defaultConfig)
  +-- configVersion nascosto e automatico
  +-- Pulsante "Salva" / "Annulla"
```

**Pattern UI:**
- Classi: `card-magic`, `btn-magic`, `input-magic`
- Switch custom Tailwind con stati `disabled` e `loading`
- Optimistic UI con rollback su errore
- Lock per singolo modulo durante request (no doppio toggle)
- Toast su successo/errore via `useToast()` esistente
- Badge "Bloccato" con motivo (`VALIDATION_ERROR`, `NOT_AVAILABLE`, `OUT_OF_WINDOW`)
- Contatore `blockedCount` per modulo visibile all'admin

## 6. Integrazione nel flusso di gioco

### Flow aggiornato

```
EventNight LIVE -> Round ACTIVE
  -> resolver.getActiveModulesForRound(eventNightId, roundId)  [cache 15s]
  -> Per ogni modulo: enabled + validateConfig + isAvailable(ctx, config)
  -> Moduli disponibili passati come prop al client
  -> ModuleMissionCard accanto ai PuzzleCard
  -> Player interagisce -> POST execute -> ModuleInteraction aggiornata
```

### Creazione EventModule alla creazione evento

Nella API route di creazione EventNight (`/api/admin/events`), dopo la creazione evento:
`createMany` su EventModule per tutte le MagicModule con `enabled: false`.

### Hook onEnable — due trigger

1. `handleModuleEnabled(eventNightId, moduleKey)` — chiamata dal PATCH toggle OFF→ON
2. `ensureRoundModuleArtifacts(eventNightId, roundId)` — chiamata all'avvio round

Copre: admin che attiva tardi, serata che riparte, buste mancanti.

### ENVELOPE_PREDICTION — flow speciale

- Output generato server-side in `onEnable` o `ensureRoundModuleArtifacts`
- Creato come `ModuleInteraction` con `actor=SYSTEM`, `tableId` per scope
- Il player non chiama execute — vede solo la rivelazione a `revealAt`
- Il payload busta e' in `state` del record system

## 7. AuditLog — nuove action

| Action | Trigger | Payload standard |
|---|---|---|
| `MODULE_ENABLED` | Toggle OFF→ON | `{ eventNightId, moduleKey, enabled: true }` |
| `MODULE_DISABLED` | Toggle ON→OFF | `{ eventNightId, moduleKey, enabled: false }` |
| `MODULE_CONFIGURED` | PUT config | `{ eventNightId, moduleKey, configKeys: [...] }` |
| `MODULE_EXECUTED` | Player execute | `{ eventNightId, moduleKey, roundId, scoreDelta }` |
| `MODULE_EXECUTION_BLOCKED` | Safe mode block | `{ eventNightId, moduleKey, code, error }` |

## 8. I 3 moduli starter

### CARD_PREDICTION_BINARY

- **Scope:** user | **Difficulty:** base | **Priority:** 10
- **Config:** `{ configVersion: 1, roundId, difficulty: 'facile'|'medio'|'difficile', timeLimit: number }`
- **Input:** `{ choice: string }` (rosso/nero, alto/basso)
- **isAvailable:** `ctx.roundId === config.roundId`
- **Comportamento:** Missione "Predizione Carta" nel round configurato. Timer server-side via ModuleInteraction.

### EQUIVOQUE_GUIDED

- **Scope:** user | **Difficulty:** intermedio | **Priority:** 20
- **Config:** `{ configVersion: 1, scriptVariant: string, revealStyle: 'dramatic'|'instant' }`
- **Input:** `{ step: number, choice: string }`
- **isAvailable:** `!!ctx.roundId`
- **Comportamento:** Script a step. Stato progressivo in ModuleInteraction.state. Rivelazione finale.

### ENVELOPE_PREDICTION

- **Scope:** table | **Difficulty:** avanzato | **Priority:** 5
- **Config:** `{ configVersion: 1, revealAt: 'end_round'|'custom', outputFormat: string, tableScope: 'tavolo'|'sala' }`
- **Input:** nessuno (player non interagisce)
- **isAvailable:** `!!ctx.roundId`
- **onEnable:** genera payload busta come ModuleInteraction actor=SYSTEM
- **Comportamento:** Notifica "Busta Sigillata". Rivelazione al momento configurato.

## 9. Regole operative

1. **Default OFF** per tutti i moduli alla creazione evento
2. **Safe mode:** config invalida o isAvailable false = modulo non appare (mai crash)
3. **Osservabilita':** ogni blocco e' loggato e visibile in admin
4. **configVersion** obbligatorio per migrazioni future
5. **Score application** una sola volta via ModuleInteraction completamento
6. **Idempotency** su execute via chiave composita
7. **Rate limit** soft: 3 execute/10s per user
