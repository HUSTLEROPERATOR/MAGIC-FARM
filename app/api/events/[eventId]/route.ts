import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato.' },
        { status: 401 }
      );
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
                _count: {
                  select: {
                    submissions: true,
                    hints: true,
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
            _count: {
              select: { memberships: true },
            },
          },
        },
        _count: {
          select: {
            rounds: true,
            tables: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento non trovato.' },
        { status: 404 }
      );
    }

    // Check if user has any submissions for puzzles in this event
    const userSubmissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id,
        puzzle: {
          round: {
            eventNightId: event.id,
          },
        },
      },
      select: {
        puzzleId: true,
        isCorrect: true,
        pointsAwarded: true,
        attemptsCount: true,
      },
    });

    const submissionsByPuzzle = new Map<string, typeof userSubmissions[0]>();
    for (const sub of userSubmissions) {
      const existing = submissionsByPuzzle.get(sub.puzzleId);
      // Keep the best submission (correct > incorrect, more points)
      if (!existing || (sub.isCorrect && !existing.isCorrect) || sub.pointsAwarded > existing.pointsAwarded) {
        submissionsByPuzzle.set(sub.puzzleId, sub);
      }
    }

    const formatted = {
      id: event.id,
      name: event.name,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      status: event.status,
      roundCount: event._count.rounds,
      tableCount: event._count.tables,
      rounds: event.rounds.map((round) => ({
        id: round.id,
        title: round.title,
        description: round.description,
        type: round.type,
        status: round.status,
        startsAt: round.startsAt?.toISOString() ?? null,
        endsAt: round.endsAt?.toISOString() ?? null,
        puzzles: round.puzzles.map((puzzle) => {
          const userSub = submissionsByPuzzle.get(puzzle.id);
          return {
            id: puzzle.id,
            title: puzzle.title,
            prompt: round.status === 'ACTIVE' ? puzzle.prompt : null,
            order: puzzle.order,
            hintCount: puzzle._count.hints,
            submissionCount: puzzle._count.submissions,
            userStatus: userSub
              ? {
                  solved: userSub.isCorrect,
                  points: userSub.pointsAwarded,
                  attempts: userSub.attemptsCount,
                }
              : null,
          };
        }),
      })),
      tables: event.tables.map((table) => ({
        id: table.id,
        name: table.name,
        isActive: table.isActive,
        memberCount: table._count.memberships,
      })),
    };

    return NextResponse.json({ event: formatted });
  } catch (error) {
    console.error('[API] Error fetching event detail:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
