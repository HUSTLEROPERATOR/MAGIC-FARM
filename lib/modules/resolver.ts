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
