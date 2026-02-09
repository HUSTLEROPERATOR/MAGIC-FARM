import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/serate/[eventId]/metrics — Get event metrics (aggregated, anonymized)
export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    select: { id: true, name: true, status: true },
  });

  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
  }

  // Only show metrics for ENDED events
  if (event.status !== 'ENDED') {
    return NextResponse.json({
      event: { id: event.id, name: event.name, status: event.status },
      message: 'Le metriche saranno disponibili al termine della serata.',
    });
  }

  // Check if cached metrics exist
  let metrics = await prisma.eventMetrics.findUnique({
    where: { eventNightId: params.eventId },
  });

  // Compute if not cached
  if (!metrics) {
    metrics = await computeAndSaveMetrics(params.eventId);
  }

  return NextResponse.json({
    event: { id: event.id, name: event.name },
    metrics: {
      totalParticipants: metrics.totalParticipants,
      totalSpectators: metrics.totalSpectators,
      totalSubmissions: metrics.totalSubmissions,
      totalCorrect: metrics.totalCorrect,
      successRate: metrics.totalSubmissions > 0
        ? Math.round((metrics.totalCorrect / metrics.totalSubmissions) * 100)
        : 0,
      avgSolveTimeMs: Number(metrics.avgSolveTimeMs),
      medianSolveTimeMs: Number(metrics.medianSolveTimeMs),
      totalHintsUsed: metrics.totalHintsUsed,
      avgHintsPerPuzzle: metrics.avgHintsPerPuzzle,
      totalAlliances: metrics.totalAlliances,
      totalMessages: metrics.totalMessages,
      hardestPuzzleId: metrics.hardestPuzzleId,
      easiestPuzzleId: metrics.easiestPuzzleId,
      puzzleMetrics: metrics.puzzleMetricsJson,
    },
  });
}

// POST /api/serate/[eventId]/metrics — Force recompute metrics
export async function POST(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const metrics = await computeAndSaveMetrics(params.eventId);
  return NextResponse.json({ success: true, metrics });
}

async function computeAndSaveMetrics(eventNightId: string) {
  // Gather all aggregated data
  const [
    participants,
    spectatorSubmissions,
    allSubmissions,
    correctSubmissions,
    solveTimes,
    hintsAgg,
    allianceCount,
    messageCount,
    puzzleStats,
  ] = await Promise.all([
    // Total unique participants (non-spectator)
    prisma.tableMembership.findMany({
      where: { table: { eventNightId } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    // Spectator submissions count
    prisma.submission.count({
      where: {
        puzzle: { round: { eventNightId } },
        isSpectator: true,
      },
    }),
    // All submissions
    prisma.submission.count({
      where: { puzzle: { round: { eventNightId } }, isSpectator: false },
    }),
    // Correct submissions
    prisma.submission.count({
      where: { puzzle: { round: { eventNightId } }, isCorrect: true, isSpectator: false },
    }),
    // Solve times for correct answers
    prisma.submission.findMany({
      where: {
        puzzle: { round: { eventNightId } },
        isCorrect: true,
        isSpectator: false,
        timeToSolveMs: { not: null },
      },
      select: { timeToSolveMs: true },
      orderBy: { timeToSolveMs: 'asc' },
    }),
    // Hints usage
    prisma.submission.aggregate({
      where: { puzzle: { round: { eventNightId } }, isSpectator: false },
      _sum: { hintsUsed: true },
      _avg: { hintsUsed: true },
    }),
    // Alliances
    prisma.alliance.count({
      where: { eventNightId, status: 'ACTIVE' },
    }),
    // Messages
    prisma.clueBoardMessage.count({
      where: { table: { eventNightId } },
    }),
    // Per-puzzle stats
    prisma.puzzle.findMany({
      where: { round: { eventNightId } },
      select: {
        id: true,
        title: true,
        puzzleType: true,
        _count: {
          select: {
            submissions: true,
          },
        },
        submissions: {
          where: { isCorrect: true, isSpectator: false },
          select: { id: true },
        },
      },
    }),
  ]);

  // Calculate median solve time
  const times = solveTimes
    .map((s) => Number(s.timeToSolveMs))
    .filter((t) => t > 0);
  const avgTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;
  const medianTime = times.length > 0
    ? times[Math.floor(times.length / 2)]
    : 0;

  // Per-puzzle metrics
  const puzzleMetrics = puzzleStats.map((p) => ({
    puzzleId: p.id,
    title: p.title,
    puzzleType: p.puzzleType,
    totalSubmissions: p._count.submissions,
    correctCount: p.submissions.length,
    successRate: p._count.submissions > 0
      ? Math.round((p.submissions.length / p._count.submissions) * 100)
      : 0,
  }));

  // Find hardest/easiest
  const sortedBySuccess = [...puzzleMetrics].sort((a, b) => a.successRate - b.successRate);
  const hardest = sortedBySuccess[0]?.puzzleId || null;
  const easiest = sortedBySuccess.length > 0
    ? sortedBySuccess[sortedBySuccess.length - 1]?.puzzleId || null
    : null;

  // Count puzzles for avg hints
  const puzzleCount = puzzleStats.length || 1;

  // Upsert metrics
  const metrics = await prisma.eventMetrics.upsert({
    where: { eventNightId },
    update: {
      totalParticipants: participants.length,
      totalSpectators: spectatorSubmissions,
      totalSubmissions: allSubmissions,
      totalCorrect: correctSubmissions,
      avgSolveTimeMs: BigInt(avgTime),
      medianSolveTimeMs: BigInt(medianTime),
      totalHintsUsed: hintsAgg._sum.hintsUsed || 0,
      avgHintsPerPuzzle: (hintsAgg._avg.hintsUsed || 0) * (allSubmissions / puzzleCount),
      totalAlliances: allianceCount,
      totalMessages: messageCount,
      hardestPuzzleId: hardest,
      easiestPuzzleId: easiest,
      puzzleMetricsJson: puzzleMetrics,
    },
    create: {
      eventNightId,
      totalParticipants: participants.length,
      totalSpectators: spectatorSubmissions,
      totalSubmissions: allSubmissions,
      totalCorrect: correctSubmissions,
      avgSolveTimeMs: BigInt(avgTime),
      medianSolveTimeMs: BigInt(medianTime),
      totalHintsUsed: hintsAgg._sum.hintsUsed || 0,
      avgHintsPerPuzzle: (hintsAgg._avg.hintsUsed || 0) * (allSubmissions / puzzleCount),
      totalAlliances: allianceCount,
      totalMessages: messageCount,
      hardestPuzzleId: hardest,
      easiestPuzzleId: easiest,
      puzzleMetricsJson: puzzleMetrics,
    },
  });

  return metrics;
}
