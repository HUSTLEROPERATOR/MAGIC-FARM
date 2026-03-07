import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { moduleExecuteSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { executeModule } from '@/lib/modules/registry';
import { rateLimitModuleExecute } from '@/lib/security/rate-limit';

interface RouteParams {
  params: { eventId: string; moduleKey: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;

  // Rate limit
  const allowed = await rateLimitModuleExecute(userId);
  if (!allowed) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra poco.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = moduleExecuteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { roundId, input } = parsed.data;
  const { eventId, moduleKey } = params;

  // Check event is LIVE
  const event = await prisma.eventNight.findUnique({
    where: { id: eventId },
    select: { status: true, currentRoundId: true },
  });
  if (!event || event.status !== 'LIVE') {
    return NextResponse.json({ error: 'Evento non attivo' }, { status: 400 });
  }

  // Check round is ACTIVE
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { status: true, eventNightId: true },
  });
  if (!round || round.status !== 'ACTIVE' || round.eventNightId !== eventId) {
    return NextResponse.json({ error: 'Round non attivo' }, { status: 400 });
  }

  // Idempotency: check existing completed interaction
  const existing = await prisma.moduleInteraction.findFirst({
    where: {
      eventNightId: eventId,
      roundId,
      moduleKey,
      userId,
      actor: 'USER',
      status: 'COMPLETED',
    },
  });
  if (existing) {
    return NextResponse.json({
      result: { success: true, data: existing.state, cached: true },
      interaction: existing,
    });
  }

  // Load config from EventModule
  const eventModule = await prisma.eventModule.findFirst({
    where: {
      eventNightId: eventId,
      module: { key: moduleKey },
      enabled: true,
    },
    include: { module: true },
  });
  if (!eventModule) {
    return NextResponse.json({ error: 'Modulo non attivo' }, { status: 404 });
  }

  // Execute
  const ctx = { eventNightId: eventId, roundId, userId };
  const result = await executeModule(moduleKey, ctx, eventModule.configJson, input);

  if (!result.success) {
    await createAuditLog({
      action: AUDIT_ACTIONS.MODULE_EXECUTION_BLOCKED,
      actorUserId: userId,
      metadata: { eventNightId: eventId, moduleKey, code: result.code, error: result.error },
    });

    // Create blocked interaction
    await prisma.moduleInteraction.upsert({
      where: {
        eventNightId_roundId_moduleKey_actor_userId_tableId: {
          eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId, tableId: '',
        },
      },
      create: {
        eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId,
        status: 'BLOCKED',
        state: { code: result.code, error: result.error } as Prisma.InputJsonValue,
      },
      update: {
        status: 'BLOCKED',
        state: { code: result.code, error: result.error } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ result }, { status: 400 });
  }

  // Determine if completed (check for multi-step)
  const isMultiStep = result.data?.isLastStep === false;
  const status = isMultiStep ? 'IN_PROGRESS' : 'COMPLETED';

  const stateValue = result.data
    ? (result.data as Prisma.InputJsonValue)
    : Prisma.DbNull;

  const interaction = await prisma.moduleInteraction.upsert({
    where: {
      eventNightId_roundId_moduleKey_actor_userId_tableId: {
        eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId, tableId: '',
      },
    },
    create: {
      eventNightId: eventId, roundId, moduleKey, actor: 'USER', userId,
      status,
      state: stateValue,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
    update: {
      status,
      state: stateValue,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  // Apply scoreDelta once on completion
  if (status === 'COMPLETED' && result.audit?.scoreDelta && typeof result.audit.scoreDelta === 'number' && result.audit.scoreDelta > 0) {
    await prisma.leaderboardEntry.upsert({
      where: { userId },
      create: { userId, points: result.audit.scoreDelta as number },
      update: { points: { increment: result.audit.scoreDelta as number } },
    });
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.MODULE_EXECUTED,
    actorUserId: userId,
    metadata: {
      eventNightId: eventId, moduleKey, roundId,
      scoreDelta: result.audit?.scoreDelta ?? 0,
    },
  });

  return NextResponse.json({ result, interaction });
}
