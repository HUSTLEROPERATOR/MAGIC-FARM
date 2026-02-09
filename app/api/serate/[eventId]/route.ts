import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/serate/[eventId] — Dettaglio serata con round, puzzle, tavolo utente
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    include: {
      rounds: {
        orderBy: { createdAt: 'asc' },
        include: {
          puzzles: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              prompt: true,
              order: true,
              scoringJson: true,
              hints: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  order: true,
                  penaltyPoints: true,
                  // text is NOT included — revealed only via hint API
                },
              },
              submissions: {
                where: { userId: session.user.id },
                select: {
                  id: true,
                  isCorrect: true,
                  attemptsCount: true,
                  hintsUsed: true,
                  pointsAwarded: true,
                  submittedAt: true,
                },
              },
            },
          },
        },
      },
      tables: {
        select: {
          id: true,
          name: true,
          isActive: true,
          memberships: {
            select: {
              userId: true,
              user: {
                select: { alias: true, firstName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Find user's table
  const userTable = await prisma.tableMembership.findFirst({
    where: {
      userId: session.user.id,
      table: { eventNightId: params.eventId },
    },
    include: {
      table: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({
    event,
    userTable: userTable?.table || null,
  });
}
