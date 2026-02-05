import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimitLogin } from '@/lib/security/rate-limit';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { hashIP } from '@/lib/security/crypto';

const emailSchema = z.object({
  email: z.string().email('Indirizzo email non valido.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = emailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limit by ip+email combination
    const identifier = `${hashIP(ip)}:${hashIP(email.toLowerCase())}`;
    const allowed = await rateLimitLogin(identifier);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche minuto.' },
        { status: 429 }
      );
    }

    // Audit log the request (store email hash, not plaintext)
    await createAuditLog({
      action: AUDIT_ACTIONS.AUTH_MAGIC_LINK_REQUESTED,
      metadata: { emailHash: hashIP(email.toLowerCase()) },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Error in request-link:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
