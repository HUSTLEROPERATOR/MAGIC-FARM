import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyHash } from '@/lib/security/crypto';
import { calculateScore, detectSuspiciousActivity } from '@/lib/game/scoring';
import { rateLimitSubmission } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

// POST /api/serate/[eventId]/submit — Invia risposta a un enigma
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 submissions per 30 seconds per user
  const allowed = await rateLimitSubmission(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra poco.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const puzzleId = body.puzzleId as string | undefined;
  const answer = body.answer as string | undefined;

  if (!puzzleId || !answer) {
    return NextResponse.json({ error: 'puzzleId e answer richiesti' }, { status: 400 });
  }

  // Get the puzzle with its round
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: {
      round: true,
    },
  });

  if (!puzzle || puzzle.round.eventNightId !== params.eventId) {
    return NextResponse.json({ error: 'Enigma non trovato' }, { status: 404 });
  }

  if (puzzle.round.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Questo round non è ancora attivo' }, { status: 400 });
  }

  // Check if already solved
  const alreadySolved = await prisma.submission.findFirst({
    where: {
      puzzleId,
      userId: session.user.id,
      isCorrect: true,
    },
  });

  if (alreadySolved) {
    return NextResponse.json({ error: 'Hai già risolto questo enigma' }, { status: 400 });
  }

  // Count previous attempts
  const previousAttempts = await prisma.submission.count({
    where: {
      puzzleId,
      userId: session.user.id,
    },
  });

  // Count hints used
  const hintsUsed = await prisma.submission.findFirst({
    where: {
      puzzleId,
      userId: session.user.id,
    },
    orderBy: { submittedAt: 'desc' },
    select: { hintsUsed: true },
  });

  // Get user's table for this event
  const userTable = await prisma.tableMembership.findFirst({
    where: {
      userId: session.user.id,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
  });

  // Verify answer
  const isCorrect = verifyHash(
    answer.trim().toLowerCase(),
    puzzle.answerHash,
    puzzle.answerSalt
  );

  // Calculate time to solve (from round start)
  const roundStart = puzzle.round.startsAt || puzzle.round.createdAt;
  const timeToSolveMs = Date.now() - roundStart.getTime();

  // Parse scoring config
  const scoringConfig = (puzzle.scoringJson as Record<string, unknown>) || {};

  const attemptsCount = previousAttempts + 1;
  const currentHintsUsed = hintsUsed?.hintsUsed || 0;

  // Calculate points
  const pointsAwarded = calculateScore(
    {
      isCorrect,
      timeToSolveMs,
      hintsUsed: currentHintsUsed,
      attemptsCount,
      isCrossTable: puzzle.round.type === 'MULTI_TABLE',
    },
    scoringConfig
  );

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      puzzleId,
      userId: session.user.id,
      tableId: userTable?.tableId || null,
      isCorrect,
      attemptsCount,
      timeToSolveMs: BigInt(timeToSolveMs),
      hintsUsed: currentHintsUsed,
      pointsAwarded,
    },
  });

  // Update leaderboard if correct
  if (isCorrect) {
    await prisma.leaderboardEntry.upsert({
      where: { userId: session.user.id },
      update: {
        points: { increment: pointsAwarded },
        riddles: { increment: 1 },
      },
      create: {
        userId: session.user.id,
        points: pointsAwarded,
        riddles: 1,
        events: 0,
      },
    });
  }

  // Anti-cheat: check recent submission patterns and log if suspicious
  const recentSubmissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: 'desc' },
    take: 20,
    select: { submittedAt: true, timeToSolveMs: true, isCorrect: true },
  });

  const suspiciousReason = detectSuspiciousActivity(
    recentSubmissions.map((s) => ({
      submittedAt: s.submittedAt,
      timeToSolveMs: Number(s.timeToSolveMs ?? 0),
      isCorrect: s.isCorrect,
    }))
  );

  if (suspiciousReason) {
    await createAuditLog({
      action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY_DETECTED,
      actorUserId: session.user.id,
      metadata: { reason: suspiciousReason, submissionId: submission.id, puzzleId },
    });
  }

  return NextResponse.json({
    isCorrect,
    pointsAwarded: isCorrect ? pointsAwarded : 0,
    attemptsCount,
    message: isCorrect
      ? `Corretto! +${pointsAwarded} punti`
      : 'Risposta errata. Riprova!',
  });
}
