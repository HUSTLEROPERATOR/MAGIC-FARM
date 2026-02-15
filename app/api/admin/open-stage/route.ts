import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/rbac';

/**
 * GET /api/admin/open-stage — list all applications
 */
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const applications = await prisma.openStageApplication.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ applications });
}
