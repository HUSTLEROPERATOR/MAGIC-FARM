import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';

/**
 * GET /api/events/active — returns the currently LIVE event summary
 */
export async function GET() {
  const { response } = await requireAuth();
  if (response) return response;

  const event = await prisma.eventNight.findFirst({
    where: { status: 'LIVE' },
    include: {
      rounds: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, title: true, status: true, type: true },
      },
      tables: {
        select: {
          id: true,
          name: true,
          _count: { select: { memberships: { where: { leftAt: null } } } },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ event: null, message: 'Nessuna serata attiva.' });
  }

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      joinCode: event.joinCode,
      currentRoundId: event.currentRoundId,
      organizationId: event.organizationId,
      venueName: event.venueName,
      hostName: event.hostName,
      theme: event.theme,
      rounds: event.rounds,
      tables: event.tables.map((t) => ({
        id: t.id,
        name: t.name,
        memberCount: t._count.memberships,
      })),
    },
  });
}
