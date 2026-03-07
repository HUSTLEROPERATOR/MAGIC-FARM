import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { hintCreationSchema } from '@/lib/validations/schemas';

/**
 * POST /api/admin/hints — create a hint for a puzzle
 */
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = hintCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const hint = await prisma.hint.create({
    data: {
      puzzleId: parsed.data.puzzleId,
      text: parsed.data.text,
      penaltyPoints: parsed.data.penaltyPoints,
      order: parsed.data.order,
    },
  });

  return NextResponse.json({ hint }, { status: 201 });
}
