import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { moduleToggleSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { handleModuleEnabled, clearResolverCache } from '@/lib/modules/resolver';

interface RouteParams {
  params: { eventModuleId: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = moduleToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { enabled } = parsed.data;

  const eventModule = await prisma.eventModule.findUnique({
    where: { id: params.eventModuleId },
    include: { module: true },
  });

  if (!eventModule) {
    return NextResponse.json({ error: 'Modulo non trovato' }, { status: 404 });
  }

  // Check global disable
  if (enabled && !eventModule.module.isGlobalEnabled) {
    return NextResponse.json({ error: 'Modulo disattivato globalmente' }, { status: 403 });
  }

  const updated = await prisma.eventModule.update({
    where: { id: params.eventModuleId },
    data: {
      enabled,
      toggledBy: session!.user.id,
      toggledAt: new Date(),
    },
    include: { module: true },
  });

  // If toggling ON, call handleModuleEnabled
  if (enabled) {
    await handleModuleEnabled(updated.eventNightId, updated.module.key);
  }

  clearResolverCache();

  await createAuditLog({
    action: enabled ? AUDIT_ACTIONS.MODULE_ENABLED : AUDIT_ACTIONS.MODULE_DISABLED,
    actorUserId: session!.user.id,
    actorRole: 'ADMIN',
    metadata: { eventNightId: updated.eventNightId, moduleKey: updated.module.key, enabled },
  });

  return NextResponse.json({ eventModule: updated });
}
