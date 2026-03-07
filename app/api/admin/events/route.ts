import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { eventCreationSchema } from '@/lib/validations/schemas';
import { generateJoinCode } from '@/lib/security/crypto';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

/**
 * GET /api/admin/events — list all events
 */
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const events = await prisma.eventNight.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { tables: true, rounds: true } },
    },
  });

  return NextResponse.json({ events });
}

/**
 * POST /api/admin/events — create a new event
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = eventCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const joinCode = generateJoinCode();

  const event = await prisma.eventNight.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      joinCode,
    },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_EVENT_CREATE,
    actorUserId: session!.user.id,
    metadata: { eventId: event.id, name: event.name },
  });

  // Auto-create EventModules for all MagicModules (disabled by default)
  const allMagicModules = await prisma.magicModule.findMany();
  if (allMagicModules.length > 0) {
    await prisma.eventModule.createMany({
      data: allMagicModules.map((mm) => ({
        eventNightId: event.id,
        moduleId: mm.id,
        enabled: false,
      })),
    });
  }

  return NextResponse.json({ event: { ...event, joinCode } }, { status: 201 });
}
