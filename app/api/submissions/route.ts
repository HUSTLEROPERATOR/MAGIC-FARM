import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/rbac';
import { hashIP } from '@/lib/security/crypto';
import { rateLimitSubmission, rateLimitPuzzleCooldown, rateLimitIPSubmissions } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { submitAnswer, ScoringError, checkGameplayConsents, checkUserActive } from '@/lib/game/scoring-service';

const submissionSchema = z.object({
  puzzleId: z.string().min(1, 'puzzleId è richiesto'),
  answer: z.string().min(1, 'La risposta non può essere vuota').max(500),
});

/**
 * POST /api/submissions — submit an answer for a puzzle.
 * Uses atomic ScoringService for all point mutations.
 * Enforces: auth, soft-delete, consents, rate-limit, puzzle cooldown, IP pattern, LIVE state.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const userId = session!.user.id;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipHash = hashIP(ip);

    // Soft-delete check
    const isActive = await checkUserActive(userId);
    if (!isActive) {
      return NextResponse.json({ error: 'Account disabilitato.' }, { status: 403 });
    }

    // Consent enforcement at endpoint level
    const hasConsents = await checkGameplayConsents(userId);
    if (!hasConsents) {
      return NextResponse.json(
        { error: 'Devi accettare i consensi obbligatori prima di giocare.', code: 'CONSENTS_REQUIRED' },
        { status: 403 }
      );
    }

    // Rate limit: 5 attempts per 30 seconds per user (global)
    const allowed = await rateLimitSubmission(`submit:${userId}`);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche secondo.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // ── Per-puzzle cooldown: 1 attempt per 5 seconds per user+puzzle ──
    const cooldownAllowed = await rateLimitPuzzleCooldown(userId, parsed.data.puzzleId);
    if (!cooldownAllowed) {
      await createAuditLog({
        action: AUDIT_ACTIONS.SUBMISSION_COOLDOWN_BLOCKED,
        actorUserId: userId,
        metadata: { puzzleId: parsed.data.puzzleId, ipHash },
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        { error: 'Attendi qualche secondo tra un tentativo e l\'altro.' },
        { status: 429 }
      );
    }

    // ── IP-based pattern detection: 30 submissions per 5 min from same IP ──
    const ipAllowed = await rateLimitIPSubmissions(ipHash);
    if (!ipAllowed) {
      await createAuditLog({
        action: AUDIT_ACTIONS.SUBMISSION_IP_PATTERN_BLOCKED,
        actorUserId: userId,
        metadata: {
          puzzleId: parsed.data.puzzleId,
          ipHash,
          reason: 'TOO_MANY_FROM_SAME_IP',
        },
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        { error: 'Attività sospetta rilevata. Riprova più tardi.' },
        { status: 429 }
      );
    }

    // Atomic scoring via ScoringService (all DB mutations in one transaction)
    const result = await submitAnswer({
      userId,
      puzzleId: parsed.data.puzzleId,
      answer: parsed.data.answer,
    });

    // Audit log (non-blocking, outside transaction)
    await createAuditLog({
      action: AUDIT_ACTIONS.ANSWER_SUBMITTED,
      actorUserId: userId,
      metadata: {
        puzzleId: parsed.data.puzzleId,
        isCorrect: result.isCorrect,
        attemptsCount: result.attemptsCount,
        pointsAwarded: result.pointsAwarded,
        flagged: result.flaggedReason,
        submissionId: result.submissionId,
        ipHash,
      },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      isCorrect: result.isCorrect,
      pointsAwarded: result.pointsAwarded,
      attemptsCount: result.attemptsCount,
      flagged: !!result.flaggedReason,
      message: result.isCorrect
        ? `Corretto! Hai guadagnato ${result.pointsAwarded} punti!`
        : 'Risposta errata. Riprova!',
    });
  } catch (error) {
    if (error instanceof ScoringError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[API] Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
