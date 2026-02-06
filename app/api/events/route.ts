import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato.' },
        { status: 401 }
      );
    }

    const events = await prisma.eventNight.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        rounds: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        tables: {
          select: { id: true },
        },
        _count: {
          select: {
            rounds: true,
            tables: true,
          },
        },
      },
    });

    const formatted = events.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      status: event.status,
      roundCount: event._count.rounds,
      tableCount: event._count.tables,
      rounds: event.rounds,
    }));

    return NextResponse.json({ events: formatted });
  } catch (error) {
    console.error('[API] Error fetching events:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
