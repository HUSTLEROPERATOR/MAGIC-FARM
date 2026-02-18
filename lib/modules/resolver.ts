import { prisma } from '@/lib/db/prisma';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { getModule } from './registry';
import type { ActiveModule, ModuleContext } from './types';

<<<<<<< HEAD
=======
// Simple TTL cache for getActiveModulesForRound
>>>>>>> origin/main
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
<<<<<<< HEAD
    where: { eventNightId, enabled: true },
    include: { module: true },
=======
    where: {
      eventNightId,
      enabled: true,
    },
    include: {
      module: true,
    },
>>>>>>> origin/main
  });

  const active: ActiveModule[] = [];

  for (const em of eventModules) {
<<<<<<< HEAD
    if (!em.module.isGlobalEnabled) continue;
=======
    // Check global disable
    if (!em.module.isGlobalEnabled) continue;

    // Check time window
>>>>>>> origin/main
    if (em.startsAt && em.startsAt > now) continue;
    if (em.endsAt && em.endsAt < now) continue;

    const handler = getModule(em.module.key);
    if (!handler) continue;

<<<<<<< HEAD
=======
    // Validate config
>>>>>>> origin/main
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

<<<<<<< HEAD
=======
    // Check availability
>>>>>>> origin/main
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

<<<<<<< HEAD
    active.push({ key: em.module.key, meta: handler.meta, config, eventModuleId: em.id, globallyDisabled: false });
  }

  active.sort((a, b) => a.meta.priority - b.meta.priority);
=======
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

>>>>>>> origin/main
  resolverCache.set(cacheKey, { data: active, expiresAt: Date.now() + CACHE_TTL_MS });
  return active;
}

<<<<<<< HEAD
export async function handleModuleEnabled(eventNightId: string, moduleKey: string): Promise<void> {
=======
export async function handleModuleEnabled(
  eventNightId: string,
  moduleKey: string,
): Promise<void> {
>>>>>>> origin/main
  const handler = getModule(moduleKey);
  if (!handler?.onEnable) return;

  const em = await prisma.eventModule.findFirst({
<<<<<<< HEAD
    where: { eventNightId, module: { key: moduleKey }, enabled: true },
=======
    where: {
      eventNightId,
      module: { key: moduleKey },
      enabled: true,
    },
>>>>>>> origin/main
    include: { module: true },
  });
  if (!em) return;

  let config;
<<<<<<< HEAD
  try { config = handler.validateConfig(em.configJson); } catch { return; }
=======
  try {
    config = handler.validateConfig(em.configJson);
  } catch {
    return;
  }
>>>>>>> origin/main

  const ctx: ModuleContext = { eventNightId };
  await handler.onEnable(ctx, config);
}

<<<<<<< HEAD
export async function ensureRoundModuleArtifacts(eventNightId: string, roundId: string): Promise<void> {
=======
export async function ensureRoundModuleArtifacts(
  eventNightId: string,
  roundId: string,
): Promise<void> {
>>>>>>> origin/main
  const eventModules = await prisma.eventModule.findMany({
    where: { eventNightId, enabled: true },
    include: { module: true },
  });

  for (const em of eventModules) {
    const handler = getModule(em.module.key);
    if (!handler?.onEnable) continue;

    let config;
<<<<<<< HEAD
    try { config = handler.validateConfig(em.configJson); } catch { continue; }
=======
    try {
      config = handler.validateConfig(em.configJson);
    } catch {
      continue;
    }
>>>>>>> origin/main

    const ctx: ModuleContext = { eventNightId, roundId };
    const available = await handler.isAvailable(ctx, config);
    if (!available) continue;

<<<<<<< HEAD
    const existing = await prisma.moduleInteraction.findFirst({
      where: { eventNightId, roundId, moduleKey: em.module.key, actor: 'SYSTEM' },
=======
    // Check if system artifact already exists
    const existing = await prisma.moduleInteraction.findFirst({
      where: {
        eventNightId,
        roundId,
        moduleKey: em.module.key,
        actor: 'SYSTEM',
      },
>>>>>>> origin/main
    });
    if (existing) continue;

    await handler.onEnable(ctx, config);
  }
}

<<<<<<< HEAD
=======
/** Clear resolver cache — useful for testing or after admin toggle */
>>>>>>> origin/main
export function clearResolverCache(): void {
  resolverCache.clear();
}
