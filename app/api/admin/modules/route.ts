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

  // Auto-create EventModule records for any registry modules not yet linked to this event
  const missingKeys = registryModules
    .filter((h) => !eventModuleMap.has(h.key))
    .map((h) => h.key);

  if (missingKeys.length > 0) {
    const missingDbModules = await prisma.magicModule.findMany({
      where: { key: { in: missingKeys } },
    });
    if (missingDbModules.length > 0) {
      await prisma.eventModule.createMany({
        data: missingDbModules.map((mm) => ({
          eventNightId,
          moduleId: mm.id,
          enabled: false,
        })),
        skipDuplicates: true,
      });
      // Re-fetch to include newly created records
      const refreshed = await prisma.eventModule.findMany({
        where: { eventNightId },
        include: { module: true },
      });
      refreshed.forEach((em) => eventModuleMap.set(em.module.key, em));
    }
  }

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
