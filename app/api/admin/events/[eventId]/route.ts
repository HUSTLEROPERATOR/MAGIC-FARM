import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE', 'ENDED']).optional(),
  currentRoundId: z.string().cuid().nullable().optional(),
});

/**
 * GET /api/admin/events/[eventId] — get event details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    include: {
      tables: {
        include: {
          _count: { select: { memberships: { where: { leftAt: null } } } },
        },
      },
      rounds: {
        orderBy: { createdAt: 'asc' },
        include: {
          puzzles: {
            orderBy: { order: 'asc' },
            include: {
              hints: { orderBy: { order: 'asc' } },
              _count: { select: { submissions: true } },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato.' }, { status: 404 });
  }

  return NextResponse.json({ event });
}

/**
 * PATCH /api/admin/events/[eventId] — update event (name, status, currentRound)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const event = await prisma.eventNight.update({
    where: { id: params.eventId },
    data: parsed.data,
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_EVENT_UPDATE,
    actorUserId: session!.user.id,
    metadata: { eventId: event.id, changes: parsed.data },
  });

  return NextResponse.json({ event });
}
