import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { rateLimitSubmission } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { hashIP } from '@/lib/security/crypto';

const aliasSchema = z.object({
  alias: z
    .string()
    .min(3, 'L\'alias deve avere almeno 3 caratteri.')
    .max(30, 'L\'alias non può superare i 30 caratteri.')
    .regex(
      /^[a-zA-Z0-9_\-\.]+$/,
      'L\'alias può contenere solo lettere, numeri, underscore, trattini e punti.'
    ),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato.' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limit by user id and ip
    const identifier = `alias:${session.user.id}:${hashIP(ip)}`;
    const allowed = await rateLimitSubmission(identifier);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = aliasSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Normalize alias: trim and lowercase
    const alias = result.data.alias.trim().toLowerCase();

    // Re-validate after normalization
    if (alias.length < 3 || alias.length > 30 || !/^[a-z0-9_\-\.]+$/.test(alias)) {
      return NextResponse.json(
        { error: 'L\'alias non è valido dopo la normalizzazione.' },
        { status: 400 }
      );
    }

    await createAuditLog({
      action: AUDIT_ACTIONS.ALIAS_ATTEMPT,
      actorUserId: session.user.id,
      ipAddress: ip,
      userAgent,
    });

    // Check if alias is already taken (use generic message to prevent enumeration)
    const existingUser = await prisma.user.findUnique({
      where: { alias },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ALIAS_SET_CONFLICT,
        actorUserId: session.user.id,
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        { error: 'Questo alias non è disponibile. Scegline un altro.' },
        { status: 409 }
      );
    }

    // Check if current user already has an alias
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { alias: true },
    });

    if (currentUser?.alias) {
      return NextResponse.json(
        { error: 'Hai già un alias impostato.' },
        { status: 400 }
      );
    }

    // Update user with normalized alias
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { alias },
      select: {
        id: true,
        alias: true,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.ALIAS_SET_SUCCESS,
      actorUserId: session.user.id,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[API] Error setting alias:', error);

    await createAuditLog({
      action: AUDIT_ACTIONS.ALIAS_SET_FAILURE,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    }).catch(() => {});

    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
