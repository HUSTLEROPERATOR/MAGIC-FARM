import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { tableCreationSchema } from '@/lib/validations/schemas';
import { generateJoinCode, hashWithSalt } from '@/lib/security/crypto';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

/**
 * POST /api/admin/tables — create a table for an event
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = tableCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const joinCode = generateJoinCode();
  const { hash, salt } = hashWithSalt(joinCode);

  const table = await prisma.table.create({
    data: {
      eventNightId: parsed.data.eventNightId,
      name: parsed.data.name,
      joinCodeHash: hash,
      joinCodeSalt: salt,
    },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_TABLE_CREATE,
    actorUserId: session!.user.id,
    metadata: { tableId: table.id, eventId: parsed.data.eventNightId },
  });

  // Return the plaintext joinCode only at creation time
  return NextResponse.json({ table, joinCode }, { status: 201 });
}
