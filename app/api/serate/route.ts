import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await prisma.eventNight.findMany({
    where: {
      status: { in: ['DRAFT', 'LIVE'] },
    },
    orderBy: { startsAt: 'asc' },
    take: 10,
  });

  return NextResponse.json(items);
}
