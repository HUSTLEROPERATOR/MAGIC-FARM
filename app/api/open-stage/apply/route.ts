import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const applicationSchema = z.object({
  stageName: z.string().min(1, 'Il nome d\'arte è obbligatorio').max(100),
  realName: z.string().min(1, 'Il nome reale è obbligatorio').max(100),
  email: z.string().email('Email non valida'),
  phone: z.string().min(5, 'Il telefono è obbligatorio').max(50),
  description: z.string().min(10, 'La descrizione deve contenere almeno 10 caratteri').max(300, 'La descrizione non può superare i 300 caratteri'),
  videoUrl: z.string().url('URL non valido').nullable().optional(),
});

/**
 * POST /api/open-stage/apply — submit a performer application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { stageName, realName, email, phone, description, videoUrl } = parsed.data;

    // Check for duplicate email within the last 30 days
    const recentApplication = await prisma.openStageApplication.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentApplication) {
      return NextResponse.json(
        { error: 'Hai già inviato una candidatura recente. Attendi la risposta prima di candidarti nuovamente.' },
        { status: 400 }
      );
    }

    const application = await prisma.openStageApplication.create({
      data: {
        stageName,
        realName,
        email,
        phone,
        description,
        videoUrl: videoUrl || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Candidatura ricevuta con successo',
        applicationId: application.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'invio della candidatura' },
      { status: 500 }
    );
  }
}
