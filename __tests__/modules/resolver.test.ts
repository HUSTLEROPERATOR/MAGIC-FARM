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
