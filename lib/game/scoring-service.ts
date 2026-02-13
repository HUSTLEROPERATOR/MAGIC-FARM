import { prisma } from '@/lib/db/prisma';
import { calculateScore, detectSuspiciousActivity } from './scoring';
import { isAnswerCorrect } from './answer-normalizer';

interface SubmitAnswerInput {
  userId: string;
  puzzleId: string;
  answer: string;
}

interface SubmitAnswerResult {
  submissionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  attemptsCount: number;
  flaggedReason: string | null;
}

/**
 * Server-side ScoringService — all point mutations are atomic via $transaction.
 * This is the ONLY place where submissions and score updates happen.
 */
export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const { userId, puzzleId, answer } = input;

  // All scoring logic runs inside a single transaction
  return prisma.$transaction(async (tx) => {
    // 1. Fetch puzzle with round and event
    const puzzle = await tx.puzzle.findUnique({
      where: { id: puzzleId },
      include: {
        round: { include: { eventNight: true } },
      },
    });

    if (!puzzle) {
      throw new ScoringError('Enigma non trovato.', 404);
    }

    // 2. Strict LIVE state enforcement
    if (puzzle.round.eventNight.status !== 'LIVE') {
      throw new ScoringError('SERATA_NON_ATTIVA', 409);
    }
    if (puzzle.round.status !== 'ACTIVE') {
      throw new ScoringError('ROUND_NON_ATTIVO', 409);
    }

    // 3. Check not already solved
    const existingCorrect = await tx.submission.findFirst({
      where: { userId, puzzleId, isCorrect: true },
    });
    if (existingCorrect) {
      throw new ScoringError('Hai già risolto questo enigma.', 400);
    }

    // 4. Count previous attempts
    const previousAttempts = await tx.submission.count({
      where: { userId, puzzleId },
    });

    // 5. Get hints used count (from audit logs or previous submissions)
    const lastSub = await tx.submission.findFirst({
      where: { userId, puzzleId },
      orderBy: { submittedAt: 'desc' },
      select: { hintsUsed: true },
    });
    const hintsUsed = lastSub?.hintsUsed || 0;

    // 6. Verify answer (with normalization: articles, punctuation, casing, minor typos)
    const isCorrect = isAnswerCorrect(answer, puzzle.answerHash, puzzle.answerSalt);

    // 7. Calculate time from round start
    const roundStartedAt = puzzle.round.startsAt || puzzle.round.createdAt;
    const timeToSolveMs = Date.now() - new Date(roundStartedAt).getTime();

    // 8. Calculate score
    const scoringConfig = (puzzle.scoringJson as Record<string, unknown>) || {};
    const points = calculateScore(
      {
        isCorrect,
        timeToSolveMs,
        hintsUsed,
        attemptsCount: previousAttempts + 1,
      },
      {
        basePoints: (scoringConfig.basePoints as number) || 100,
        timeBonusEnabled: (scoringConfig.timeBonusEnabled as boolean) ?? true,
        hintPenalty: (scoringConfig.hintPenalty as number) || 10,
      }
    );

    // 9. Anti-cheat: check recent submissions
    const recentSubs = await tx.submission.findMany({
      where: {
        userId,
        puzzle: { round: { eventNightId: puzzle.round.eventNightId } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      select: { submittedAt: true, timeToSolveMs: true, isCorrect: true },
    });

    let flaggedReason = detectSuspiciousActivity(
      recentSubs.map((s) => ({
        submittedAt: s.submittedAt,
        timeToSolveMs: Number(s.timeToSolveMs || 0),
        isCorrect: s.isCorrect,
      }))
    );

    // Additional: flag too many consecutive failures
    const recentFailures = await tx.submission.count({
      where: {
        userId,
        puzzleId,
        isCorrect: false,
        submittedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // last 5 min
      },
    });
    if (recentFailures >= 10 && !flaggedReason) {
      flaggedReason = 'EXCESSIVE_FAILURES';
    }

    // 10. Find user's table
    const membership = await tx.tableMembership.findFirst({
      where: {
        userId,
        leftAt: null,
        table: { eventNightId: puzzle.round.eventNightId },
      },
    });

    // 11. Create submission (atomic)
    const submission = await tx.submission.create({
      data: {
        puzzleId,
        userId,
        tableId: membership?.tableId || null,
        isCorrect,
        attemptsCount: previousAttempts + 1,
        hintsUsed,
        pointsAwarded: points,
        timeToSolveMs: BigInt(timeToSolveMs),
        flaggedReason,
      },
    });

    // 12. Update leaderboard atomically if correct
    if (isCorrect) {
      await tx.leaderboardEntry.upsert({
        where: { userId },
        create: {
          userId,
          points,
          riddles: 1,
          events: 1,
        },
        update: {
          points: { increment: points },
          riddles: { increment: 1 },
        },
      });
    }

    return {
      submissionId: submission.id,
      isCorrect,
      pointsAwarded: points,
      attemptsCount: previousAttempts + 1,
      flaggedReason,
    };
  });
}

/**
 * Custom error class for scoring errors with HTTP status codes
 */
export class ScoringError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ScoringError';
  }
}

/**
 * Check required consents for gameplay.
 * Enforces: privacy accepted, terms accepted, AND consentPlatform = true.
 * All checks are server-side only.
 */
export async function checkGameplayConsents(userId: string): Promise<boolean> {
  const consent = await prisma.consent.findFirst({
    where: {
      userId,
      privacyAcceptedAt: { not: null },
      termsAcceptedAt: { not: null },
      consentPlatform: true,
    },
  });
  return !!consent;
}

/**
 * Check user is not soft-deleted
 */
export async function checkUserActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true },
  });
  return !!user && !user.deletedAt;
}
