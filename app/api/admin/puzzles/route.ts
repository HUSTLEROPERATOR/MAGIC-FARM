import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { puzzleCreationSchema } from '@/lib/validations/schemas';
import { hashWithSalt } from '@/lib/security/crypto';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

/**
 * POST /api/admin/puzzles — create a new puzzle for a round
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = puzzleCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const normalizedAnswer = parsed.data.answer.toLowerCase().trim();
  const { hash, salt } = hashWithSalt(normalizedAnswer);

  const puzzle = await prisma.puzzle.create({
    data: {
      roundId: parsed.data.roundId,
      title: parsed.data.title,
      prompt: parsed.data.prompt,
      answerHash: hash,
      answerSalt: salt,
      scoringJson: parsed.data.scoringJson || { basePoints: 100, timeBonusEnabled: true, hintPenalty: 10 },
      order: parsed.data.order ?? 0,
    },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_PUZZLE_CREATE,
    actorUserId: session!.user.id,
    metadata: { puzzleId: puzzle.id, roundId: parsed.data.roundId },
  });

  return NextResponse.json({ puzzle }, { status: 201 });
}
