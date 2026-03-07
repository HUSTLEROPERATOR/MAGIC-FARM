import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { hashIP, generateConsentEvidenceHash } from '@/lib/security/crypto';

const revokeSchema = z.object({
  consentShareWithHost: z.boolean().optional(),
  consentHostMarketing: z.boolean().optional(),
  consentControllerMarketing: z.boolean().optional(),
});

/**
 * POST /api/consents/revoke
 *
 * Allows users to selectively revoke optional consents with immediate effect.
 * When consentShareWithHost is revoked:
 *   - User is removed from host leaderboard queries
 *   - consentHostMarketing is also automatically revoked
 * When consentHostMarketing is revoked:
 *   - User will no longer receive host invite emails
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session!.user.id;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Load current consent
  const currentConsent = await prisma.consent.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!currentConsent) {
    return NextResponse.json(
      { error: 'Nessun consenso trovato.' },
      { status: 404 },
    );
  }

  // Build update payload — only revoke what's explicitly requested
  const updateData: Record<string, unknown> = {};
  const revokedFields: string[] = [];

  if (data.consentShareWithHost === false) {
    updateData.consentShareWithHost = false;
    // Auto-revoke host marketing when share-with-host is revoked
    updateData.consentHostMarketing = false;
    revokedFields.push('consentShareWithHost', 'consentHostMarketing');
  }

  if (data.consentHostMarketing === false) {
    updateData.consentHostMarketing = false;
    revokedFields.push('consentHostMarketing');
  }

  if (data.consentControllerMarketing === false) {
    updateData.consentControllerMarketing = false;
    updateData.marketingOptOutAt = new Date();
    revokedFields.push('consentControllerMarketing');
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'Nessun consenso da revocare specificato.' },
      { status: 400 },
    );
  }

  // Update evidence
  const now = new Date();
  updateData.evidenceHash = generateConsentEvidenceHash(ip, userAgent, now);
  updateData.ipAddressHash = hashIP(ip);
  updateData.userAgent = userAgent;

  await prisma.consent.update({
    where: { id: currentConsent.id },
    data: updateData,
  });

  // Audit log
  await createAuditLog({
    action: AUDIT_ACTIONS.CONSENT_REVOKED,
    actorUserId: userId,
    actorRole: session!.user.role,
    metadata: {
      revokedFields,
      requestId: crypto.randomUUID(),
      ipHash: hashIP(ip),
    },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    revokedFields,
    message: `Consensi revocati: ${revokedFields.join(', ')}. Effetto immediato.`,
  });
}
