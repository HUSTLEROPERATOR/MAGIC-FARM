import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { verifyHash } from '@/lib/security/crypto';
import { hashIP } from '@/lib/security/crypto';
import { calculateScore } from '@/lib/game/scoring';
import { rateLimitSubmission } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

const submissionSchema = z.object({
  puzzleId: z.string().min(1, 'puzzleId è richiesto'),
  answer: z.string().min(1, 'La risposta non può essere vuota').max(500),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato.' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limit
    const identifier = `submission:${session.user.id}:${hashIP(ip)}`;
    const allowed = await rateLimitSubmission(identifier);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche secondo.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = submissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { puzzleId, answer } = result.data;

    // Fetch puzzle with round info
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: puzzleId },
      include: {
        round: {
          include: {
            eventNight: true,
          },
        },
        hints: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: 'Enigma non trovato.' },
        { status: 404 }
      );
    }

    // Check if round is active
    if (puzzle.round.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Questo round non è attivo al momento.' },
        { status: 403 }
      );
    }

    // Check if event is LIVE
    if (puzzle.round.eventNight.status !== 'LIVE') {
      return NextResponse.json(
        { error: "L'evento non è attivo al momento." },
        { status: 403 }
      );
    }

    // Count previous attempts for this user/puzzle
    const previousSubmissions = await prisma.submission.findMany({
      where: {
        puzzleId,
        userId: session.user.id,
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Check if already solved correctly
    const alreadySolved = previousSubmissions.some((s) => s.isCorrect);
    if (alreadySolved) {
      return NextResponse.json(
        { error: 'Hai già risolto questo enigma!' },
        { status: 400 }
      );
    }

    const attemptsCount = previousSubmissions.length + 1;

    // Verify answer
    const isCorrect = verifyHash(
      answer.trim().toLowerCase(),
      puzzle.answerHash,
      puzzle.answerSalt
    );

    // Calculate time from first attempt or puzzle start
    const startTime = previousSubmissions.length > 0
      ? previousSubmissions[0].submittedAt
      : (puzzle.round.startsAt ?? new Date());
    const timeToSolveMs = Date.now() - startTime.getTime();

    // Count hints used (we'll track this simply as hints available at time of submission)
    // In a full implementation, you'd track which hints the user requested
    const hintsUsed = 0;

    // Calculate score
    const scoringConfig = puzzle.scoringJson as Record<string, unknown> | null;
    const pointsAwarded = isCorrect
      ? calculateScore(
          {
            isCorrect,
            timeToSolveMs,
            hintsUsed,
            attemptsCount,
          },
          scoringConfig
            ? {
                basePoints: (scoringConfig.basePoints as number) ?? undefined,
                timeBonusEnabled: (scoringConfig.timeBonus as boolean) ?? undefined,
                hintPenalty: (scoringConfig.hintPenalty as number) ?? undefined,
              }
            : {}
        )
      : 0;

    // Get user's table membership for this event
    const tableMembership = await prisma.tableMembership.findFirst({
      where: {
        userId: session.user.id,
        table: {
          eventNightId: puzzle.round.eventNightId,
          isActive: true,
        },
        leftAt: null,
      },
      select: { tableId: true },
    });

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        puzzleId,
        userId: session.user.id,
        tableId: tableMembership?.tableId ?? null,
        isCorrect,
        attemptsCount,
        timeToSolveMs: BigInt(timeToSolveMs),
        hintsUsed,
        pointsAwarded,
      },
    });

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.ANSWER_SUBMITTED,
      actorUserId: session.user.id,
      metadata: {
        puzzleId,
        isCorrect,
        attemptsCount,
        pointsAwarded,
        submissionId: submission.id,
      },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      isCorrect,
      pointsAwarded,
      attemptsCount,
      message: isCorrect
        ? `🎉 Corretto! Hai guadagnato ${pointsAwarded} punti!`
        : '❌ Risposta errata. Riprova!',
    });
  } catch (error) {
    console.error('[API] Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
