import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getActiveModulesForRound } from '@/lib/modules/resolver';

interface RouteParams {
  params: { eventId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAuth();
  if (response) return response;

  const roundId = request.nextUrl.searchParams.get('roundId');
  if (!roundId) {
    return NextResponse.json({ error: 'roundId richiesto' }, { status: 400 });
  }

  const modules = await getActiveModulesForRound(params.eventId, roundId);
  return NextResponse.json({ modules });
}
