import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// POST /api/serate/[eventId]/alliance-effect — Apply alliance effect (hint sharing)
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const userId = session.user.id;
  const { action, puzzleId } = await req.json();

  // Find user's table
  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
    include: { table: true },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Non sei a un tavolo' }, { status: 400 });
  }

  // Find active alliances for this table
  const alliances = await prisma.alliance.findMany({
    where: {
      eventNightId: params.eventId,
      status: 'ACTIVE',
      OR: [
        { tableAId: membership.tableId },
        { tableBId: membership.tableId },
      ],
    },
    include: {
      tableA: { select: { id: true, name: true } },
      tableB: { select: { id: true, name: true } },
    },
  });

  if (alliances.length === 0) {
    return NextResponse.json({ error: 'Nessuna alleanza attiva' }, { status: 400 });
  }

  if (action === 'share_hint') {
    // Share hints with allied tables
    const shareableAlliances = alliances.filter(
      (a) => a.effectType === 'HINT_SHARING' && a.sharedHints
    );

    if (shareableAlliances.length === 0) {
      return NextResponse.json({
        error: 'Nessuna alleanza con condivisione suggerimenti attiva',
      }, { status: 400 });
    }

    // Get user's revealed hints for this puzzle
    const userSubmission = await prisma.submission.findFirst({
      where: { puzzleId, userId },
      select: { hintsUsed: true },
    });

    if (!userSubmission || userSubmission.hintsUsed === 0) {
      return NextResponse.json({ error: 'Nessun suggerimento da condividere' }, { status: 400 });
    }

    // Get allied table IDs
    const alliedTableIds = shareableAlliances.map((a) =>
      a.tableAId === membership.tableId ? a.tableBId : a.tableAId
    );

    const alliedTableNames = shareableAlliances.map((a) =>
      a.tableAId === membership.tableId ? a.tableB.name : a.tableA.name
    );

    // Post a message on the allied tables' clue board
    for (const tableId of alliedTableIds) {
      await prisma.clueBoardMessage.create({
        data: {
          tableId,
          userId,
          content: `🤝 Suggerimento condiviso dall'alleato: il vostro alleato al tavolo "${membership.table.name}" ha ${userSubmission.hintsUsed} suggerimenti per l'enigma. Consultate la vostra alleanza!`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Suggerimento condiviso con: ${alliedTableNames.join(', ')}`,
    });
  }

  if (action === 'check_common_goal') {
    const goalAlliances = alliances.filter(
      (a) => a.effectType === 'COMMON_GOAL' && a.commonGoal
    );

    return NextResponse.json({
      alliances: goalAlliances.map((a) => ({
        id: a.id,
        ally: a.tableAId === membership.tableId ? a.tableB.name : a.tableA.name,
        commonGoal: a.commonGoal,
        goalMet: a.commonGoalMet,
      })),
    });
  }

  if (action === 'list') {
    return NextResponse.json({
      alliances: alliances.map((a) => ({
        id: a.id,
        ally: a.tableAId === membership.tableId ? a.tableB.name : a.tableA.name,
        effectType: a.effectType,
        sharedHints: a.sharedHints,
        bonusPoints: a.bonusPoints,
        commonGoal: a.commonGoal,
        commonGoalMet: a.commonGoalMet,
      })),
    });
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}
