import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/badges — Get all badges with user's awards
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const userId = session.user.id;

  const badges = await prisma.badge.findMany({
    where: { isActive: true },
    include: {
      awards: {
        where: { userId },
        select: {
          id: true,
          awardedAt: true,
          reason: true,
        },
      },
      eventNight: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = badges.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    eventNight: b.eventNight ? { id: b.eventNight.id, name: b.eventNight.name } : null,
    earned: b.awards.length > 0,
    awardedAt: b.awards[0]?.awardedAt || null,
    reason: b.awards[0]?.reason || null,
  }));

  return NextResponse.json({
    badges: result,
    earnedCount: result.filter((b) => b.earned).length,
    totalCount: result.length,
  });
}
