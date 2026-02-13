import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';

/**
 * GET /api/leaderboard?eventId=... — returns ranked tables for an event.
 * Ranks by total correct-submission points per table.
 */
export async function GET(request: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const eventId = request.nextUrl.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'eventId è obbligatorio.' }, { status: 400 });
  }

  // Get all tables for this event with their scores
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

  // Build leaderboard: rank tables by total points
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

  // Assign ranks (handle ties)
  let currentRank = 1;
  const rankedWithPosition = ranked.map((entry, index) => {
    if (index > 0 && entry.totalPoints < ranked[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return { ...entry, rank: currentRank };
  });

  return NextResponse.json({ leaderboard: rankedWithPosition, eventId });
}
