import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/serate/[eventId]/leaderboard — Classifica live della serata
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all correct submissions for this event
  const submissions = await prisma.submission.findMany({
    where: {
      isCorrect: true,
      puzzle: {
        round: {
          eventNightId: params.eventId,
        },
      },
    },
    include: {
      user: {
        select: { id: true, alias: true, firstName: true },
      },
      table: {
        select: { id: true, name: true },
      },
    },
  });

  // Aggregate by user
  const userMap = new Map<string, {
    userId: string;
    name: string;
    tableName: string | null;
    totalPoints: number;
    puzzlesSolved: number;
  }>();

  for (const sub of submissions) {
    const existing = userMap.get(sub.userId);
    if (existing) {
      existing.totalPoints += sub.pointsAwarded;
      existing.puzzlesSolved += 1;
    } else {
      userMap.set(sub.userId, {
        userId: sub.userId,
        name: sub.user.alias || sub.user.firstName || 'Mago Anonimo',
        tableName: sub.table?.name || null,
        totalPoints: sub.pointsAwarded,
        puzzlesSolved: 1,
      });
    }
  }

  // Aggregate by table
  const tableMap = new Map<string, {
    tableId: string;
    tableName: string;
    totalPoints: number;
    puzzlesSolved: number;
    members: number;
  }>();

  for (const sub of submissions) {
    if (!sub.table) continue;
    const existing = tableMap.get(sub.tableId!);
    if (existing) {
      existing.totalPoints += sub.pointsAwarded;
      existing.puzzlesSolved += 1;
    } else {
      tableMap.set(sub.tableId!, {
        tableId: sub.tableId!,
        tableName: sub.table.name,
        totalPoints: sub.pointsAwarded,
        puzzlesSolved: 1,
        members: 0,
      });
    }
  }

  // Sort by points descending
  const players = Array.from(userMap.values())
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const tables = Array.from(tableMap.values())
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return NextResponse.json({ players, tables });
}
