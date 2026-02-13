import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { verifyHash, hashIP } from '@/lib/security/crypto';
import { rateLimitGameJoin } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { checkGameplayConsents, checkUserActive } from '@/lib/game/scoring-service';

const joinEventSchema = z.object({
  joinCode: z.string().min(1, 'Codice serata obbligatorio.').max(20),
  tableCode: z.string().length(6, 'Codice tavolo deve essere 6 caratteri.').optional(),
});

/**
 * POST /api/events/join — join an active event via joinCode, optionally a specific table.
 * Enforces: auth, soft-delete, consents, rate-limit, LIVE state, single-table-per-event.
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Soft-delete check
  const isActive = await checkUserActive(userId);
  if (!isActive) {
    return NextResponse.json({ error: 'Account disabilitato.' }, { status: 403 });
  }

  // Consent enforcement
  const hasConsents = await checkGameplayConsents(userId);
  if (!hasConsents) {
    return NextResponse.json(
      { error: 'Devi accettare i consensi obbligatori.', code: 'CONSENTS_REQUIRED' },
      { status: 403 }
    );
  }

  // Rate limit
  const allowed = await rateLimitGameJoin(`join:${userId}:${hashIP(ip)}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Troppi tentativi. Riprova tra qualche minuto.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = joinEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { joinCode, tableCode } = parsed.data;

  // Find active event by joinCode (LIVE enforcement)
  const event = await prisma.eventNight.findFirst({
    where: { joinCode, status: 'LIVE' },
    include: { tables: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: 'Codice serata non valido o serata non attiva.' },
      { status: 404 }
    );
  }

  // Prevent multi-table: check if user is already at a table for THIS event
  const existingMembership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      leftAt: null,
      table: { eventNightId: event.id },
    },
    include: { table: { select: { name: true } } },
  });

  if (existingMembership) {
    return NextResponse.json({
      success: true,
      eventId: event.id,
      tableId: existingMembership.tableId,
      tableName: existingMembership.table.name,
      message: 'Sei già al tavolo.',
    });
  }

  // If tableCode provided, verify it against tables
  let targetTable = null;
  if (tableCode) {
    for (const table of event.tables) {
      if (verifyHash(tableCode, table.joinCodeHash, table.joinCodeSalt)) {
        targetTable = table;
        break;
      }
    }
    if (!targetTable) {
      return NextResponse.json(
        { error: 'Codice tavolo non valido.' },
        { status: 400 }
      );
    }
  } else {
    // Auto-assign to table with fewest active members
    const tablesWithCounts = await prisma.table.findMany({
      where: { eventNightId: event.id, isActive: true },
      include: { _count: { select: { memberships: { where: { leftAt: null } } } } },
    });
    tablesWithCounts.sort((a, b) => a._count.memberships - b._count.memberships);
    targetTable = tablesWithCounts[0];
  }

  if (!targetTable) {
    return NextResponse.json(
      { error: 'Nessun tavolo disponibile per questa serata.' },
      { status: 400 }
    );
  }

  // Create membership atomically — the @@unique([tableId, userId]) constraint
  // prevents duplicate joins to the same table. For cross-table prevention within
  // an event, we rely on the server-side check above since eventNightId is not
  // on TableMembership directly.
  await prisma.tableMembership.create({
    data: { tableId: targetTable.id, userId },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.TABLE_JOIN,
    actorUserId: userId,
    metadata: { eventId: event.id, tableId: targetTable.id },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    eventId: event.id,
    tableId: targetTable.id,
    tableName: targetTable.name,
  });
}
