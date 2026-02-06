import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { puzzleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato.' },
        { status: 401 }
      );
    }

    const puzzle = await prisma.puzzle.findUnique({
      where: { id: params.puzzleId },
      include: {
        round: {
          include: {
            eventNight: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            hints: true,
            submissions: true,
          },
        },
      },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: 'Enigma non trovato.' },
        { status: 404 }
      );
    }

    // Get user's best submission for this puzzle
    const userSubmission = await prisma.submission.findFirst({
      where: {
        puzzleId: puzzle.id,
        userId: session.user.id,
        isCorrect: true,
      },
      select: {
        isCorrect: true,
        pointsAwarded: true,
        attemptsCount: true,
      },
    });

    // Only show prompt if round is active
    const showPrompt = puzzle.round.status === 'ACTIVE' || puzzle.round.status === 'COMPLETED';

    const formatted = {
      id: puzzle.id,
      title: puzzle.title,
      prompt: showPrompt ? puzzle.prompt : null,
      order: puzzle.order,
      hintCount: puzzle._count.hints,
      roundTitle: puzzle.round.title,
      roundStatus: puzzle.round.status,
      eventName: puzzle.round.eventNight.name,
      eventId: puzzle.round.eventNight.id,
      eventStatus: puzzle.round.eventNight.status,
      userStatus: userSubmission
        ? {
            solved: userSubmission.isCorrect,
            points: userSubmission.pointsAwarded,
            attempts: userSubmission.attemptsCount,
          }
        : null,
    };

    return NextResponse.json({ puzzle: formatted });
  } catch (error) {
    console.error('[API] Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
