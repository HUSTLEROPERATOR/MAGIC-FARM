import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/rbac';
import { getModule } from '@/lib/modules/registry';
import { adminReveal, FIRMA_SIGILLATA_KEY } from '@/lib/modules/modules/firma-sigillata';
import type { FirmaSigillatConfig } from '@/lib/modules/modules/firma-sigillata';
import prisma from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const body = await req.json().catch(() => null);
  if (!body?.eventNightId) {
    return NextResponse.json({ error: 'eventNightId obbligatorio' }, { status: 400 });
  }
  const { eventNightId } = body as { eventNightId: string };

  const em = await prisma.eventModule.findFirst({
    where: {
      eventNightId,
      module: { key: FIRMA_SIGILLATA_KEY },
      enabled: true,
    },
    include: { module: true },
  });
  if (!em) {
    return NextResponse.json(
      { error: 'Modulo non abilitato per questo evento' },
      { status: 404 },
    );
  }

  const handler = getModule(FIRMA_SIGILLATA_KEY);
  if (!handler) {
    return NextResponse.json({ error: 'Modulo non registrato' }, { status: 500 });
  }

  let config: FirmaSigillatConfig;
  try {
    config = handler.validateConfig(em.configJson) as FirmaSigillatConfig;
  } catch {
    return NextResponse.json({ error: 'Config non valida' }, { status: 400 });
  }

  const result = await adminReveal(eventNightId, config);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
