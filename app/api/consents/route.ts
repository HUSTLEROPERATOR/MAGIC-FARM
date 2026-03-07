import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { generateConsentEvidenceHash, hashIP } from '@/lib/security/crypto';

const consentSchema = z.object({
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Devi accettare la privacy policy.' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Devi accettare i termini di servizio.' }),
  }),
  marketingOptIn: z.boolean().optional(),
  // Granular GDPR consents
  consentPlatform: z.literal(true, {
    errorMap: () => ({ message: 'Il consenso piattaforma è obbligatorio per giocare.' }),
  }),
  consentControllerMarketing: z.boolean().optional(),
  consentShareWithHost: z.boolean().optional(),
  consentHostMarketing: z.boolean().optional(),
});

/**
 * GET /api/consents — get current consent status
 */
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const consent = await prisma.consent.findFirst({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    consent: consent
      ? {
          privacyAccepted: !!consent.privacyAcceptedAt,
          privacyVersion: consent.privacyVersion,
          termsAccepted: !!consent.termsAcceptedAt,
          termsVersion: consent.termsVersion,
          marketingOptIn: !!consent.marketingOptInAt,
          marketingVersion: consent.marketingVersion,
          consentPlatform: consent.consentPlatform,
          consentControllerMarketing: consent.consentControllerMarketing,
          consentShareWithHost: consent.consentShareWithHost,
          consentHostMarketing: consent.consentHostMarketing,
        }
      : null,
  });
}

/**
 * POST /api/consents — accept/update consents
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
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const now = new Date();
  const evidenceHash = generateConsentEvidenceHash(ip, userAgent, now);
  const ipHash = hashIP(ip);

  const consentData = {
    privacyAcceptedAt: now,
    privacyVersion: '2.0',
    termsAcceptedAt: now,
    termsVersion: '2.0',
    marketingOptInAt: parsed.data.marketingOptIn ? now : null,
    marketingVersion: parsed.data.marketingOptIn ? '1.0' : null,
    consentPlatform: true, // always true at this point (validated by schema)
    consentControllerMarketing: !!parsed.data.consentControllerMarketing,
    consentShareWithHost: !!parsed.data.consentShareWithHost,
    // Host marketing only meaningful if share-with-host is enabled
    consentHostMarketing: parsed.data.consentShareWithHost ? !!parsed.data.consentHostMarketing : false,
    evidenceHash,
    ipAddressHash: ipHash,
    userAgent,
  };

  const existingConsent = await prisma.consent.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (existingConsent) {
    await prisma.consent.update({
      where: { id: existingConsent.id },
      data: consentData,
    });
  } else {
    await prisma.consent.create({
      data: { userId, ...consentData },
    });
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.CONSENT_UPDATED,
    actorUserId: userId,
    actorRole: session!.user.role,
    metadata: {
      privacyVersion: '2.0',
      termsVersion: '2.0',
      marketingOptIn: !!parsed.data.marketingOptIn,
      consentPlatform: true,
      consentControllerMarketing: !!parsed.data.consentControllerMarketing,
      consentShareWithHost: !!parsed.data.consentShareWithHost,
      consentHostMarketing: parsed.data.consentShareWithHost ? !!parsed.data.consentHostMarketing : false,
    },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
