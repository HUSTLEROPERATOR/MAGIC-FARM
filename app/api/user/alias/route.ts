import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

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

    const body = await request.json();
    const result = aliasSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { alias } = result.data;

    // Check if alias is already taken
    const existingUser = await prisma.user.findUnique({
      where: { alias },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Questo alias è già in uso. Scegline un altro.' },
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

    // Update user with new alias
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { alias },
      select: {
        id: true,
        alias: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[API] Error setting alias:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore interno.' },
      { status: 500 }
    );
  }
}
