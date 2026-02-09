import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leaderboard = await prisma.leaderboardEntry.findMany({
    orderBy: { points: 'desc' },
    take: 50,
    include: {
      user: {
        select: { alias: true, firstName: true },
      },
    },
  });

  return NextResponse.json(leaderboard);
}
