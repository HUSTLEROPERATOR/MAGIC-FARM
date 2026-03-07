import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

/**
 * PATCH /api/admin/open-stage/[id] — update application status and send email
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { status } = parsed.data;
  const { id } = params;

  try {
    const application = await prisma.openStageApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Candidatura non trovata' },
        { status: 404 }
      );
    }

    const updatedApplication = await prisma.openStageApplication.update({
      where: { id },
      data: { status },
    });

    // Send email notification
    if (status === 'APPROVED') {
      await sendApprovalEmail(updatedApplication);
    }

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento' },
      { status: 500 }
    );
  }
}

async function sendApprovalEmail(application: any) {
  // Import the email function
  const { sendOpenStageApprovalEmail } = await import('@/lib/email/open-stage-email');
  
  try {
    await sendOpenStageApprovalEmail({
      to: application.email,
      stageName: application.stageName,
      realName: application.realName,
    });
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
}
