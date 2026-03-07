import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { moduleConfigSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { getModule } from '@/lib/modules/registry';
import { clearResolverCache } from '@/lib/modules/resolver';

interface RouteParams {
  params: { eventModuleId: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = moduleConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const eventModule = await prisma.eventModule.findUnique({
    where: { id: params.eventModuleId },
    include: { module: true },
  });

  if (!eventModule) {
    return NextResponse.json({ error: 'Modulo non trovato' }, { status: 404 });
  }

  // Validate config via registry handler
  const handler = getModule(eventModule.module.key);
  if (!handler) {
    return NextResponse.json({ error: 'Handler modulo non trovato' }, { status: 500 });
  }

  try {
    handler.validateConfig(parsed.data.configJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Config non valida';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updated = await prisma.eventModule.update({
    where: { id: params.eventModuleId },
    data: {
      configJson: parsed.data.configJson as any,
    },
  });

  clearResolverCache();

  await createAuditLog({
    action: AUDIT_ACTIONS.MODULE_CONFIGURED,
    actorUserId: session!.user.id,
    actorRole: 'ADMIN',
    metadata: {
      eventNightId: eventModule.eventNightId,
      moduleKey: eventModule.module.key,
      configKeys: Object.keys(parsed.data.configJson),
    },
  });

  return NextResponse.json({ eventModule: updated });
}
