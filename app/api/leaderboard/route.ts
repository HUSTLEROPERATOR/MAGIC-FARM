import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';

/**
 * GET /api/leaderboard
 *
 * Supports three modes via query params:
 *
 * 1) Legacy per-event table ranking (backward-compatible):
 *      ?eventId=xxx
 *    Returns tables ranked by total points within that event.
 *
 * 2) Local leaderboard (per Organization):
 *      ?scope=local&organizationId=xxx
 *    Returns individual users ranked by total pointsAwarded
 *    across all events belonging to that organization.
 *
 * 3) Global leaderboard (cross-organization):
 *      ?scope=global
 *    Returns individual users ranked by total pointsAwarded
 *    across ALL events in the system.
 *
 * Why local vs global?
 *   Local gives each venue its own competitive context.
 *   Global enables a cross-venue meta-ranking for dedicated players.
 *   Future: add ?scope=seasonal&season=2026-S1 for time-bounded rankings.
 */
export async function GET(request: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const scope = request.nextUrl.searchParams.get('scope');
  const eventId = request.nextUrl.searchParams.get('eventId');
  const organizationId = request.nextUrl.searchParams.get('organizationId');

  // ── Mode 1: Legacy per-event table ranking ─────────────────────
  if (eventId) {
    return handleEventLeaderboard(eventId);
  }

  // ── Mode 2 & 3: Scoped individual leaderboards ────────────────
  if (scope === 'local') {
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId è obbligatorio per scope=local.' },
        { status: 400 },
      );
    }
    return handleScopedLeaderboard('local', organizationId);
  }

  if (scope === 'global') {
    return handleScopedLeaderboard('global');
  }

  // No valid params → error
  return NextResponse.json(
    { error: 'Specificare eventId oppure scope (local|global).' },
    { status: 400 },
  );
}

// ─── Legacy: per-event table ranking ─────────────────────────────

async function handleEventLeaderboard(eventId: string) {
  const tables = await prisma.table.findMany({
    where: { eventNightId: eventId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, alias: true, firstName: true } },
        },
      },
      submissions: {
        where: { isCorrect: true },
        select: { pointsAwarded: true, userId: true, puzzleId: true },
      },
    },
  });

  const ranked = tables
    .map((table) => {
      const totalPoints = table.submissions.reduce((sum, s) => sum + s.pointsAwarded, 0);
      const puzzlesSolved = new Set(table.submissions.map((s) => s.puzzleId)).size;

      return {
        tableId: table.id,
        tableName: table.name,
        totalPoints,
        puzzlesSolved,
        members: table.memberships.map((m) => ({
          id: m.user.id,
          alias: m.user.alias,
          firstName: m.user.firstName,
        })),
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  let currentRank = 1;
  const rankedWithPosition = ranked.map((entry, index) => {
    if (index > 0 && entry.totalPoints < ranked[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return { ...entry, rank: currentRank };
  });

  return NextResponse.json({ leaderboard: rankedWithPosition, eventId });
}

// ─── Scoped individual leaderboard (local / global) ──────────────

async function handleScopedLeaderboard(
  scope: 'local' | 'global',
  organizationId?: string,
) {
  // Build a WHERE clause that filters submissions down to the right events.
  // Path: Submission → Puzzle → Round → EventNight → Organization
  const eventFilter =
    scope === 'local' && organizationId
      ? { puzzle: { round: { eventNight: { organizationId } } } }
      : {}; // global: no filter

  // Aggregate correct submissions grouped by userId
  const aggregated = await prisma.submission.groupBy({
    by: ['userId'],
    where: {
      isCorrect: true,
      ...eventFilter,
    },
    _sum: { pointsAwarded: true },
    _count: { id: true }, // count of correct submissions = puzzles solved
    orderBy: { _sum: { pointsAwarded: 'desc' } },
  });

  // Fetch user details for all ranked users in one query
  const userIds = aggregated.map((a) => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, deletedAt: null },
    select: {
      id: true,
      alias: true,
      firstName: true,
      consents: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { consentShareWithHost: true },
      },
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Build ranked list with tie-aware ranking
  let currentRank = 1;
  const leaderboard = aggregated
    .filter((a) => userMap.has(a.userId)) // skip deleted users
    .map((entry, index, arr) => {
      const totalPoints = entry._sum.pointsAwarded ?? 0;
      if (index > 0) {
        const prevPoints = arr[index - 1]._sum.pointsAwarded ?? 0;
        if (totalPoints < prevPoints) {
          currentRank = index + 1;
        }
      }
      const user = userMap.get(entry.userId);
      return {
        userId: entry.userId,
        username: user?.alias || user?.firstName || 'Anonimo',
        totalPoints,
        totalSolved: entry._count.id,
        rank: currentRank,
        hostSharingEnabled: user?.consents?.[0]?.consentShareWithHost === true,
      };
    });

  return NextResponse.json({ leaderboard, scope, organizationId: organizationId ?? null });
}
