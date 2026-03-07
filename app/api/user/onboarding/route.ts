import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validations/schemas';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { generateConsentEvidenceHash, hashIP } from '@/lib/security/crypto';

const PRIVACY_VERSION = '1.0';
const MARKETING_VERSION = '1.0';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato.' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
    }

    // Validate with the existing registerSchema (minus email, which comes from session)
    const result = registerSchema.omit({ email: true }).safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, privacyAccepted, marketingOptIn } = result.data;

    if (!privacyAccepted) {
      return NextResponse.json(
        { error: 'Devi accettare la Privacy Policy per continuare.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const now = new Date();
    const evidenceHash = generateConsentEvidenceHash(ip, userAgent, now);
    const ipHash = hashIP(ip);

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    // Upsert consent record
    const existingConsent = await prisma.consent.findFirst({
      where: { userId: session.user.id },
    });

    const consentData = {
      privacyAcceptedAt: now,
      privacyVersion: PRIVACY_VERSION,
      ...(marketingOptIn
        ? { marketingOptInAt: now, marketingVersion: MARKETING_VERSION, marketingOptOutAt: null }
        : { marketingOptOutAt: now, marketingVersion: MARKETING_VERSION, marketingOptInAt: null }),
      evidenceHash,
      ipAddressHash: ipHash,
      userAgent,
    };

    if (existingConsent) {
      await prisma.consent.update({
        where: { id: existingConsent.id },
        data: consentData,
      });
    } else {
      await prisma.consent.create({
        data: {
          userId: session.user.id,
          ...consentData,
        },
      });
    }

    // Audit logs
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_COMPLETED,
      actorUserId: session.user.id,
      ipAddress: ip,
      userAgent,
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.CONSENT_UPDATED,
      actorUserId: session.user.id,
      metadata: {
        privacyVersion: PRIVACY_VERSION,
        marketingOptIn: !!marketingOptIn,
        marketingVersion: MARKETING_VERSION,
      },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      onboardingComplete: true,
    });
  } catch (error) {
    console.error('[API] Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
