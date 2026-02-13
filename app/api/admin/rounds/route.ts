import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { roundCreationSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

/**
 * POST /api/admin/rounds — create a new round for an event
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = roundCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const round = await prisma.round.create({
    data: {
      eventNightId: parsed.data.eventNightId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      configJson: parsed.data.configJson || null,
    },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_ROUND_CREATE,
    actorUserId: session!.user.id,
    metadata: { roundId: round.id, eventId: parsed.data.eventNightId },
  });

  return NextResponse.json({ round }, { status: 201 });
}
