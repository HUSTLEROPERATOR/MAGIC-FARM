import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// POST /api/badges/check — Check and auto-award badges based on triggers
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const userId = session.user.id;
  const newlyAwarded: Array<{ name: string; icon: string; reason: string }> = [];

  // Fetch user stats
  const [puzzlesSolved, eventsAttended, alliancesFormed, existingAwards] = await Promise.all([
    prisma.submission.count({
      where: { userId, isCorrect: true, isSpectator: false },
    }),
    prisma.tableMembership.groupBy({
      by: ['userId'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.alliance.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { tableA: { memberships: { some: { userId, leftAt: null } } } },
          { tableB: { memberships: { some: { userId, leftAt: null } } } },
        ],
      },
    }),
    prisma.badgeAward.findMany({
      where: { userId },
      select: { badgeId: true },
    }),
  ]);

  const earnedBadgeIds = new Set(existingAwards.map((a) => a.badgeId));
  const eventCount = eventsAttended[0]?._count._all || 0;

  // Fetch trigger-based badges that user doesn't have yet
  const triggerBadges = await prisma.badge.findMany({
    where: {
      isActive: true,
      triggerType: { not: null },
      triggerValue: { not: null },
      id: { notIn: Array.from(earnedBadgeIds) },
    },
  });

  for (const badge of triggerBadges) {
    let qualified = false;
    let reason = '';

    switch (badge.triggerType) {
      case 'puzzles_solved':
        if (puzzlesSolved >= (badge.triggerValue || 0)) {
          qualified = true;
          reason = `Hai risolto ${puzzlesSolved} enigmi!`;
        }
        break;
      case 'events_attended':
        if (eventCount >= (badge.triggerValue || 0)) {
          qualified = true;
          reason = `Hai partecipato a ${eventCount} serate!`;
        }
        break;
      case 'alliance_formed':
        if (alliancesFormed >= (badge.triggerValue || 0)) {
          qualified = true;
          reason = `Hai stretto ${alliancesFormed} alleanze!`;
        }
        break;
    }

    if (qualified) {
      await prisma.badgeAward.create({
        data: {
          badgeId: badge.id,
          userId,
          reason,
        },
      });
      newlyAwarded.push({ name: badge.name, icon: badge.icon, reason });
    }
  }

  return NextResponse.json({
    newlyAwarded,
    message:
      newlyAwarded.length > 0
        ? `Hai ottenuto ${newlyAwarded.length} nuovi badge!`
        : 'Nessun nuovo badge al momento.',
  });
}
