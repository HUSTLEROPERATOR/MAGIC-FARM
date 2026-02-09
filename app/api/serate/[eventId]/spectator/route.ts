import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// POST /api/serate/[eventId]/spectator — Toggle spectator mode for event
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const userId = session.user.id;
  const { enabled } = await req.json();

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    select: { spectatorEnabled: true, status: true },
  });

  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
  }

  if (!event.spectatorEnabled) {
    return NextResponse.json({ error: 'Modalità spettatore non disponibile' }, { status: 403 });
  }

  // Check if user has any real table membership
  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
  });

  return NextResponse.json({
    spectatorMode: enabled === true,
    message: enabled
      ? 'Sei ora in modalità spettatore. Le tue risposte non contano per la classifica.'
      : 'Modalità spettatore disattivata.',
    hasTable: !!membership,
  });
}

// GET /api/serate/[eventId]/spectator — Check spectator status
export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    select: { spectatorEnabled: true },
  });

  return NextResponse.json({
    spectatorAvailable: event?.spectatorEnabled ?? false,
  });
}
