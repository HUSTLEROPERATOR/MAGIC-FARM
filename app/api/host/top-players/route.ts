import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { rateLimitHostExport } from '@/lib/security/rate-limit';
import { hashIP } from '@/lib/security/crypto';

/**
 * GET /api/host/top-players?eventId=xxx&limit=20
 *
 * Returns top players for a given event, with strict consent + privacy enforcement:
 * - Only users with consentShareWithHost = true are included.
 * - NEVER exposes raw email. Only alias + score + consent flags.
 * - Response is watermarked with export metadata for traceability.
 * - Rate limited: 10 requests per 10 minutes.
 * - To contact players, use POST /api/host/invite instead.
 *
 * Authorization: ADMIN only (TODO: add HOST role gate when implemented).
 */
export async function GET(request: NextRequest) {
  // TODO: gate to ADMIN or HOST role when HOST role is implemented
  const { session, response } = await requireAdmin();
  if (response) return response;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipHash = hashIP(ip);

  // ── Rate limit: 10 exports per 10 minutes ──
  const rateLimitKey = `export:${session!.user.id}:${ipHash}`;
  const allowed = await rateLimitHostExport(rateLimitKey);
  if (!allowed) {
    await createAuditLog({
      action: AUDIT_ACTIONS.HOST_EXPORT_RATE_LIMIT,
      actorUserId: session!.user.id,
      actorRole: session!.user.role,
      metadata: { ipHash },
      ipAddress: ip,
      userAgent,
    });
    return NextResponse.json(
      { error: 'Troppe richieste di export. Riprova tra qualche minuto.' },
      { status: 429 },
    );
  }

  const eventId = request.nextUrl.searchParams.get('eventId');
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100);

  if (!eventId) {
    return NextResponse.json(
      { error: 'eventId è obbligatorio.' },
      { status: 400 },
    );
  }

  // Verify event exists
  const event = await prisma.eventNight.findUnique({
    where: { id: eventId },
    select: { id: true, name: true },
  });
  if (!event) {
    return NextResponse.json(
      { error: 'Evento non trovato.' },
      { status: 404 },
    );
  }

  // Get correct submissions for this event, aggregated per user
  const submissions = await prisma.submission.groupBy({
    by: ['userId'],
    where: {
      isCorrect: true,
      puzzle: { round: { eventNightId: eventId } },
    },
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: 'desc' } },
    take: limit * 3, // over-fetch since we'll filter by consent
  });

  const userIds = submissions.map((s) => s.userId);

  // Load users with their latest consent status — NO email in select, EVER
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, deletedAt: null },
    select: {
      id: true,
      alias: true,
      // firstName intentionally excluded from export for privacy
      consents: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Build result: only users who opted in to share with host
  // Limited fields: only alias + totalPoints + canReceiveInvites (no userId exposed)
  let rank = 1;
  const topPlayers = submissions
    .map((entry) => {
      const user = userMap.get(entry.userId);
      if (!user) return null;

      const consent = user.consents[0];
      // STRICT: only include if user explicitly consented to share data with host
      if (!consent?.consentShareWithHost) return null;

      const totalPoints = entry._sum.pointsAwarded ?? 0;

      return {
        // Only expose alias (public name) — never email, never real name in export
        username: user.alias || 'Anonimo',
        totalPoints,
        canReceiveInvites: consent.consentHostMarketing === true,
      };
    })
    .filter(Boolean)
    .slice(0, limit);

  // Tie-aware ranking
  const ranked = topPlayers.map((player, index, arr) => {
    if (index > 0 && player!.totalPoints < arr[index - 1]!.totalPoints) {
      rank = index + 1;
    }
    return { ...player, rank };
  });

  // Generate watermark for traceability
  const exportTimestamp = new Date().toISOString();
  const watermark = `Export by ${session!.user.alias || session!.user.id} at ${exportTimestamp}`;

  // Audit: log the export attempt with full metadata
  await createAuditLog({
    action: AUDIT_ACTIONS.HOST_EXPORT_ATTEMPT,
    actorUserId: session!.user.id,
    actorRole: session!.user.role,
    metadata: {
      eventId,
      eventName: event.name,
      resultCount: ranked.length,
      exportTimestamp,
      ipHash,
    },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({
    eventId,
    eventName: event.name,
    topPlayers: ranked,
    _export: {
      watermark,
      generatedAt: exportTimestamp,
      fieldsIncluded: ['rank', 'username', 'totalPoints', 'canReceiveInvites'],
      fieldsExcluded: ['email', 'userId', 'firstName', 'lastName', 'ip'],
    },
    note: 'Nessun dato di contatto esposto. Questo export è tracciato e watermarked. Per contattare i giocatori, usa POST /api/host/invite.',
  });
}
