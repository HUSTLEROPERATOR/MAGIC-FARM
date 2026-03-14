import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getServerSession before importing rbac
const mockGetServerSession = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth/auth', () => ({
  authOptions: {},
}));

import { requireAuth, requireAdmin } from '@/lib/auth/rbac';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns response 401 when no session exists', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const { session, response } = await requireAuth();
    expect(session).toBeNull();
    expect(response).not.toBeNull();
    const json = await response!.json();
    expect(json.error).toBe('Non autorizzato.');
    expect(response!.status).toBe(401);
  });

  it('returns response 401 when session has no user.id', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });
    const { session, response } = await requireAuth();
    expect(session).toBeNull();
    expect(response!.status).toBe(401);
  });

  it('returns session and null response when authenticated', async () => {
    const fakeSession = { user: { id: 'user-1', role: 'PLAYER' } };
    mockGetServerSession.mockResolvedValue(fakeSession);
    const { session, response } = await requireAuth();
    expect(response).toBeNull();
    expect(session).toBe(fakeSession);
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const { session, response } = await requireAdmin();
    expect(session).toBeNull();
    expect(response!.status).toBe(401);
  });

  it('returns 403 when authenticated but role is PLAYER', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'PLAYER' } });
    const { session, response } = await requireAdmin();
    expect(session).toBeNull();
    expect(response).not.toBeNull();
    const json = await response!.json();
    expect(json.error).toBe('Accesso negato.');
    expect(response!.status).toBe(403);
  });

  it('returns 403 when role is HOST', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'HOST' } });
    const { session, response } = await requireAdmin();
    expect(session).toBeNull();
    expect(response!.status).toBe(403);
  });

  it('returns session and null response when role is ADMIN', async () => {
    const fakeSession = { user: { id: 'admin-1', role: 'ADMIN' } };
    mockGetServerSession.mockResolvedValue(fakeSession);
    const { session, response } = await requireAdmin();
    expect(response).toBeNull();
    expect(session).toBe(fakeSession);
  });
});
