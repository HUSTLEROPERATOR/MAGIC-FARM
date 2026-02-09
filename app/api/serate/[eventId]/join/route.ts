import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyHash } from '@/lib/security/crypto';

// POST /api/serate/[eventId]/join — Unisciti a un tavolo con codice
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { joinCode } = body;

  if (!joinCode || typeof joinCode !== 'string') {
    return NextResponse.json({ error: 'Codice tavolo richiesto' }, { status: 400 });
  }

  // Check event exists and is LIVE
  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
  });

  if (!event || event.status !== 'LIVE') {
    return NextResponse.json({ error: 'Serata non disponibile' }, { status: 400 });
  }

  // Check if user is already at a table for this event
  const existingMembership = await prisma.tableMembership.findFirst({
    where: {
      userId: session.user.id,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
  });

  if (existingMembership) {
    return NextResponse.json({ error: 'Sei già seduto a un tavolo per questa serata' }, { status: 400 });
  }

  // Find the table by matching join code hash
  const tables = await prisma.table.findMany({
    where: {
      eventNightId: params.eventId,
      isActive: true,
    },
  });

  const matchedTable = tables.find((t) =>
    verifyHash(joinCode.toUpperCase(), t.joinCodeHash, t.joinCodeSalt)
  );

  if (!matchedTable) {
    return NextResponse.json({ error: 'Codice tavolo non valido' }, { status: 400 });
  }

  // Join the table
  const membership = await prisma.tableMembership.create({
    data: {
      tableId: matchedTable.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    success: true,
    table: { id: matchedTable.id, name: matchedTable.name },
    membership,
  });
}
