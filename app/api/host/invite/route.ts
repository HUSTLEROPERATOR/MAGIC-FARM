import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { rateLimitHostInvite } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { generateInviteBatchId, isDuplicateInviteBatch } from '@/lib/security/invite-idempotency';
import { isEmailEligibleForInvite } from '@/lib/security/email-blocklist';
import { hashIP } from '@/lib/security/crypto';
import nodemailer from 'nodemailer';

const inviteSchema = z.object({
  eventId: z.string().min(1, 'eventId è richiesto'),
  userIds: z.array(z.string().min(1)).min(1, 'Seleziona almeno un giocatore').max(50),
  messageTemplate: z.string().min(10, 'Il messaggio deve avere almeno 10 caratteri').max(2000),
  turnstileToken: z.string().optional(),
});

/**
 * POST /api/host/invite
 *
 * Privacy-safe host communication with hardened security:
 * - Idempotency: duplicate batches (same host+event+users) rejected within 10 min.
 * - Turnstile: anti-bot token required (optional in dev).
 * - Email eligibility: verified email required + disposable domains blocked.
 * - Consent gate: consentShareWithHost + consentHostMarketing required.
 * - Every invite is fully audit-logged with requestId, ipHash, and failure reasons.
 *
 * Authorization: ADMIN only (TODO: add HOST role when implemented).
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const hostId = session!.user.id;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipHash = hashIP(ip);

  // Rate limit: max 5 requests per 10 minutes per host+IP
  const rateLimitKey = `${hostId}_${ipHash}`;
  const allowed = await rateLimitHostInvite(rateLimitKey);
  if (!allowed) {
    await createAuditLog({
      action: AUDIT_ACTIONS.HOST_INVITE_RATE_LIMIT,
      actorUserId: hostId,
      actorRole: 'HOST',
      metadata: { ipHash, userId: hostId },
      ipAddress: ip,
      userAgent,
    });
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche minuto.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const { eventId, userIds, messageTemplate, turnstileToken } = parsed.data;

  // ── Turnstile anti-bot verification ──
  const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstileResult.success) {
    await createAuditLog({
      action: AUDIT_ACTIONS.HOST_INVITE_TURNSTILE_FAIL,
      actorUserId: hostId,
      actorRole: 'HOST',
      metadata: { ipHash, error: turnstileResult.error },
      ipAddress: ip,
      userAgent,
    });
    return NextResponse.json(
      { error: 'Verifica anti-bot fallita. Ricarica la pagina e riprova.' },
      { status: 403 },
    );
  }

  // ── Idempotency check ──
  const batchId = generateInviteBatchId(hostId, eventId, userIds);
  const isDuplicate = await isDuplicateInviteBatch(batchId);
  if (isDuplicate) {
    await createAuditLog({
      action: AUDIT_ACTIONS.HOST_INVITE_DUPLICATE,
      actorUserId: hostId,
      actorRole: 'HOST',
      metadata: { eventId, inviteBatchId: batchId, ipHash },
      ipAddress: ip,
      userAgent,
    });
    return NextResponse.json(
      { error: 'Questi inviti sono già stati inviati. Attendi 10 minuti per reinviare allo stesso gruppo.' },
      { status: 409 },
    );
  }

  // Verify event exists
  const event = await prisma.eventNight.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, hostName: true, venueName: true },
  });
  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato.' }, { status: 404 });
  }

  // Load users including emailVerified for eligibility check
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      firstName: true,
      alias: true,
      consents: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // ── Eligibility checks with aggregate failure reasons ──
  const failureReasons: Record<string, number> = {};
  const addFailure = (reason: string) => {
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  };

  const eligible: typeof users = [];

  for (const u of users) {
    const consent = u.consents[0];

    // Consent check
    if (!consent?.consentShareWithHost || !consent?.consentHostMarketing) {
      addFailure('NO_CONSENT');
      continue;
    }

    // Verified email check
    if (!u.emailVerified) {
      addFailure('EMAIL_NOT_VERIFIED');
      continue;
    }

    // Disposable domain check
    const emailCheck = isEmailEligibleForInvite(u.email, u.emailVerified);
    if (!emailCheck.eligible) {
      addFailure(emailCheck.reason || 'EMAIL_INELIGIBLE');
      continue;
    }

    eligible.push(u);
  }

  const skippedCount = userIds.length - eligible.length;

  // Send emails via platform (host never touches email addresses)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const from = process.env.SMTP_FROM || 'Magic Farm <noreply@magic-farm.local>';
  const hostLabel = event.hostName || 'L\'organizzatore';
  const venueLabel = event.venueName || 'Magic Farm';

  let sentCount = 0;
  let failedCount = 0;
  const sendFailureReasons: Record<string, number> = {};

  for (const user of eligible) {
    const displayName = user.firstName || user.alias || 'Giocatore';
    const subject = `${hostLabel} ti invita — ${venueLabel}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6b2c91;">Magic Farm — Invito dall'Host</h2>
        <p>Ciao ${displayName},</p>
        <div style="background: #f9f5ff; border-left: 4px solid #6b2c91; padding: 16px; margin: 16px 0; white-space: pre-wrap;">${messageTemplate}</div>
        <p style="color: #666; font-size: 13px;">
          Questo messaggio è stato inviato tramite la piattaforma Magic Farm per conto di ${hostLabel} (${venueLabel}).
          Non abbiamo condiviso il tuo indirizzo email con l'organizzatore.
        </p>
        <p style="color: #999; font-size: 11px;">
          Ricevi questa email perché hai acconsentito a ricevere comunicazioni dall'host.
          Puoi revocare questo consenso in qualsiasi momento dal tuo profilo su Magic Farm.
        </p>
      </div>
    `;

    const text = `Ciao ${displayName},\n\n${messageTemplate}\n\n---\nInviato tramite Magic Farm per conto di ${hostLabel} (${venueLabel}).\nPuoi revocare il consenso dal tuo profilo.`;

    try {
      await transporter.sendMail({ from, to: user.email, subject, text, html });
      sentCount++;
    } catch (err) {
      console.error(`[Host Invite] Failed to send to user ${user.id}:`, err);
      failedCount++;
      const errMsg = err instanceof Error ? err.message.slice(0, 50) : 'UNKNOWN';
      sendFailureReasons[errMsg] = (sendFailureReasons[errMsg] || 0) + 1;
    }
  }

  // Audit log — always, with full failure breakdown
  await createAuditLog({
    action: AUDIT_ACTIONS.HOST_INVITE_SENT,
    actorUserId: hostId,
    actorRole: session!.user.role,
    metadata: {
      eventId,
      eventName: event.name,
      inviteBatchId: batchId,
      requestedUserCount: userIds.length,
      eligibleCount: eligible.length,
      sentCount,
      failedCount,
      skippedNoConsent: skippedCount,
      eligibilityFailures: failureReasons,
      sendFailures: Object.keys(sendFailureReasons).length > 0 ? sendFailureReasons : undefined,
      ipHash,
    },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    sentCount,
    skippedCount,
    failedCount,
    note: `${sentCount} inviti inviati. ${skippedCount} utenti esclusi. ${failedCount} errori di invio.`,
  });
}
