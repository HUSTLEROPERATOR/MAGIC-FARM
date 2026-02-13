import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';

/**
 * GET /api/table/me — returns the user's current table state for the active event
 */
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;

  // Find active event
  const event = await prisma.eventNight.findFirst({
    where: { status: 'LIVE' },
  });

  if (!event) {
    return NextResponse.json({ table: null, message: 'Nessuna serata attiva.' });
  }

  // Find user's table membership for this event
  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      leftAt: null,
      table: { eventNightId: event.id },
    },
    include: {
      table: {
        include: {
          memberships: {
            where: { leftAt: null },
            include: {
              user: { select: { id: true, alias: true, firstName: true } },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ table: null, eventId: event.id, message: 'Non sei in nessun tavolo.' });
  }

  // Get current round with puzzles
  const currentRound = event.currentRoundId
    ? await prisma.round.findUnique({
        where: { id: event.currentRoundId },
        include: {
          puzzles: {
            orderBy: { order: 'asc' },
            include: {
              hints: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
                select: { id: true, order: true, penaltyPoints: true },
              },
            },
          },
        },
      })
    : null;

  // Get submissions for current user in this event
  const submissions = await prisma.submission.findMany({
    where: {
      userId,
      puzzle: { round: { eventNightId: event.id } },
    },
    select: {
      puzzleId: true,
      isCorrect: true,
      pointsAwarded: true,
      attemptsCount: true,
      hintsUsed: true,
    },
  });

  // Build submission map per puzzle
  const submissionMap: Record<string, { isCorrect: boolean; points: number; attempts: number; hintsUsed: number }> = {};
  for (const s of submissions) {
    if (!submissionMap[s.puzzleId] || s.isCorrect) {
      submissionMap[s.puzzleId] = {
        isCorrect: s.isCorrect,
        points: s.pointsAwarded,
        attempts: s.attemptsCount,
        hintsUsed: s.hintsUsed,
      };
    }
  }

  // Calculate table total score
  const tableSubmissions = await prisma.submission.findMany({
    where: {
      tableId: membership.tableId,
      isCorrect: true,
      puzzle: { round: { eventNightId: event.id } },
    },
    select: { pointsAwarded: true },
  });
  const tableScore = tableSubmissions.reduce((sum, s) => sum + s.pointsAwarded, 0);

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      currentRoundId: event.currentRoundId,
      hostName: event.hostName,
    },
    table: {
      id: membership.table.id,
      name: membership.table.name,
      score: tableScore,
      members: membership.table.memberships.map((m) => ({
        id: m.user.id,
        alias: m.user.alias,
        firstName: m.user.firstName,
      })),
    },
    currentRound: currentRound
      ? {
          id: currentRound.id,
          title: currentRound.title,
          description: currentRound.description,
          type: currentRound.type,
          puzzles: currentRound.puzzles.map((p) => ({
            id: p.id,
            title: p.title,
            prompt: p.prompt,
            order: p.order,
            hintCount: p.hints.length,
            hints: p.hints,
            submission: submissionMap[p.id] || null,
          })),
        }
      : null,
  });
}
