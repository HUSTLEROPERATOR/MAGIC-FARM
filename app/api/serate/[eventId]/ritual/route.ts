import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/serate/[eventId]/ritual — Get ritual narratives
export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      name: true,
      theme: true,
      status: true,
      openingNarrative: true,
      closingNarrative: true,
      nextEventTeaser: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
  }

  // Show opening narrative only when event is LIVE or ENDED
  // Show closing narrative + teaser only when ENDED
  const response: Record<string, unknown> = {
    id: event.id,
    name: event.name,
    theme: event.theme,
    status: event.status,
  };

  if (event.status === 'LIVE' || event.status === 'ENDED') {
    response.openingNarrative = event.openingNarrative;
  }

  if (event.status === 'ENDED') {
    response.closingNarrative = event.closingNarrative;
    response.nextEventTeaser = event.nextEventTeaser;
  }

  return NextResponse.json(response);
}
