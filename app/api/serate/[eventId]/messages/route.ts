import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { rateLimitClueBoard } from '@/lib/security/rate-limit';

// GET /api/serate/[eventId]/messages — Messaggi del tavolo
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  // Find user's table
  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId: session.user.id,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Non sei a nessun tavolo' }, { status: 400 });
  }

  const messages = await prisma.clueBoardMessage.findMany({
    where: {
      tableId: membership.tableId,
      hiddenAt: null,
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      user: {
        select: { alias: true, firstName: true },
      },
    },
  });

  return NextResponse.json(messages);
}

// POST /api/serate/[eventId]/messages — Invia messaggio al tavolo
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const allowed = await rateLimitClueBoard(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra poco.' }, { status: 429 });
  }

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const { message } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Messaggio vuoto' }, { status: 400 });
  }

  if (message.length > 500) {
    return NextResponse.json({ error: 'Messaggio troppo lungo (max 500 caratteri)' }, { status: 400 });
  }

  // Find user's table
  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId: session.user.id,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Non sei a nessun tavolo' }, { status: 400 });
  }

  const newMessage = await prisma.clueBoardMessage.create({
    data: {
      tableId: membership.tableId,
      userId: session.user.id,
      body: message.trim(),
    },
    include: {
      user: {
        select: { alias: true, firstName: true },
      },
    },
  });

  return NextResponse.json(newMessage);
}
