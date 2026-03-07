import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { rateLimitHint } from '@/lib/security/rate-limit';

// POST /api/serate/[eventId]/hint — Richiedi un suggerimento
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const allowed = await rateLimitHint(session.user.id);
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
  const hintOrder = body.hintOrder as number | undefined;

  if (!puzzleId || hintOrder === undefined) {
    return NextResponse.json({ error: 'puzzleId e hintOrder richiesti' }, { status: 400 });
  }

  // Verify puzzle belongs to event
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: { round: true },
  });

  if (!puzzle || puzzle.round.eventNightId !== params.eventId) {
    return NextResponse.json({ error: 'Enigma non trovato' }, { status: 404 });
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

  // Get the hint
  const hint = await prisma.hint.findFirst({
    where: {
      puzzleId,
      order: hintOrder,
      isActive: true,
    },
  });

  if (!hint) {
    return NextResponse.json({ error: 'Suggerimento non disponibile' }, { status: 404 });
  }

  // Check user has unlocked previous hints (must go in order)
  if (hintOrder > 1) {
    // Simple check: we track hints via submission.hintsUsed count
    const lastSubmission = await prisma.submission.findFirst({
      where: { puzzleId, userId: session.user.id },
      orderBy: { submittedAt: 'desc' },
    });
    const currentHints = lastSubmission?.hintsUsed || 0;
    if (hintOrder > currentHints + 1) {
      return NextResponse.json(
        { error: 'Devi sbloccare i suggerimenti precedenti' },
        { status: 400 }
      );
    }
  }

  // Update hint count on the latest submission or create a tracking entry
  const existingSubmission = await prisma.submission.findFirst({
    where: { puzzleId, userId: session.user.id },
    orderBy: { submittedAt: 'desc' },
  });

  if (existingSubmission) {
    await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: { hintsUsed: hintOrder },
    });
  } else {
    // Create a placeholder submission to track hints
    const userTable = await prisma.tableMembership.findFirst({
      where: {
        userId: session.user.id,
        table: { eventNightId: params.eventId },
        leftAt: null,
      },
    });
    await prisma.submission.create({
      data: {
        puzzleId,
        userId: session.user.id,
        tableId: userTable?.tableId || null,
        isCorrect: false,
        attemptsCount: 0,
        hintsUsed: hintOrder,
        pointsAwarded: 0,
      },
    });
  }

  return NextResponse.json({
    hint: {
      order: hint.order,
      text: hint.text,
      penaltyPoints: hint.penaltyPoints,
    },
  });
}
