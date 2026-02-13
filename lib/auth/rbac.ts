import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

/**
 * Get the current session and verify the user is authenticated.
 * Returns { session, response } — if response is set, return it immediately.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 }),
    };
  }
  return { session, response: null };
}

/**
 * Get the current session and verify the user has ADMIN role.
 * Returns { session, response } — if response is set, return it immediately.
 */
export async function requireAdmin() {
  const { session, response } = await requireAuth();
  if (response) return { session: null, response };

  if (session!.user.role !== 'ADMIN') {
    return {
      session: null,
      response: NextResponse.json({ error: 'Accesso negato.' }, { status: 403 }),
    };
  }
  return { session: session!, response: null };
}
