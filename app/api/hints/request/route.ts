import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { requestHintSchema } from '@/lib/validations/schemas';
import { rateLimitHint } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { checkGameplayConsents, checkUserActive } from '@/lib/game/scoring-service';

/**
 * POST /api/hints/request — request the next available hint for a puzzle.
 * Enforces: auth, soft-delete, consents, rate-limit, LIVE + ACTIVE state.
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Soft-delete check
  const isActive = await checkUserActive(userId);
  if (!isActive) {
    return NextResponse.json({ error: 'Account disabilitato.' }, { status: 403 });
  }

  // Consent enforcement
  const hasConsents = await checkGameplayConsents(userId);
  if (!hasConsents) {
    return NextResponse.json(
      { error: 'Devi accettare i consensi obbligatori.', code: 'CONSENTS_REQUIRED' },
      { status: 403 }
    );
  }

  // Rate limit: 3 per 5 minutes per user
  const allowed = await rateLimitHint(`hint:${userId}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Troppi tentativi. Attendi prima di richiedere un altro suggerimento.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = requestHintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { puzzleId, hintId } = parsed.data;

  // Fetch hint with puzzle, round, and event in a single query (no N+1)
  const hint = await prisma.hint.findUnique({
    where: { id: hintId },
    include: {
      puzzle: {
        include: {
          round: { include: { eventNight: { select: { status: true } } } },
          hints: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!hint || hint.puzzleId !== puzzleId) {
    return NextResponse.json(
      { error: 'Suggerimento non trovato.' },
      { status: 404 }
    );
  }

  // Strict LIVE state enforcement (409)
  if (hint.puzzle.round.eventNight.status !== 'LIVE') {
    return NextResponse.json(
      { error: 'SERATA_NON_ATTIVA', code: 'EVENT_NOT_LIVE' },
      { status: 409 }
    );
  }
  if (hint.puzzle.round.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'ROUND_NON_ATTIVO', code: 'ROUND_NOT_ACTIVE' },
      { status: 409 }
    );
  }

  // Check user hasn't already solved this puzzle
  const alreadySolved = await prisma.submission.findFirst({
    where: { userId, puzzleId, isCorrect: true },
  });
  if (alreadySolved) {
    return NextResponse.json(
      { error: 'Hai già risolto questo enigma.' },
      { status: 400 }
    );
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.HINT_REQUESTED,
    actorUserId: userId,
    metadata: {
      puzzleId,
      hintId,
      penaltyPoints: hint.penaltyPoints,
      hintOrder: hint.order,
    },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({
    hint: {
      id: hint.id,
      text: hint.text,
      penaltyPoints: hint.penaltyPoints,
      order: hint.order,
    },
    totalHintsAvailable: hint.puzzle.hints.length,
  });
}
