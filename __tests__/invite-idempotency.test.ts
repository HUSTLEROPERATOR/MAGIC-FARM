import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — devono essere definiti prima degli import del modulo
// ---------------------------------------------------------------------------
const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

import {
  generateInviteBatchId,
  isDuplicateInviteBatch,
} from '@/lib/security/invite-idempotency';

// ---------------------------------------------------------------------------
// generateInviteBatchId — funzione pura
// ---------------------------------------------------------------------------
describe('generateInviteBatchId', () => {
  const HOST = 'host-001';
  const EVENT = 'event-001';
  const USERS = ['user-a', 'user-b', 'user-c'];

  it('restituisce una stringa hex di 32 caratteri', () => {
    const id = generateInviteBatchId(HOST, EVENT, USERS);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('è deterministico: stesso input produce stesso output', () => {
    const id1 = generateInviteBatchId(HOST, EVENT, USERS);
    const id2 = generateInviteBatchId(HOST, EVENT, USERS);
    expect(id1).toBe(id2);
  });

  it("è indipendente dall'ordine degli userId", () => {
    const id1 = generateInviteBatchId(HOST, EVENT, ['user-a', 'user-b', 'user-c']);
    const id2 = generateInviteBatchId(HOST, EVENT, ['user-c', 'user-a', 'user-b']);
    expect(id1).toBe(id2);
  });

  it('produce ID diverso per host diverso', () => {
    const id1 = generateInviteBatchId('host-001', EVENT, USERS);
    const id2 = generateInviteBatchId('host-002', EVENT, USERS);
    expect(id1).not.toBe(id2);
  });

  it('produce ID diverso per event diverso', () => {
    const id1 = generateInviteBatchId(HOST, 'event-001', USERS);
    const id2 = generateInviteBatchId(HOST, 'event-002', USERS);
    expect(id1).not.toBe(id2);
  });

  it('produce ID diverso per set di utenti diversi', () => {
    const id1 = generateInviteBatchId(HOST, EVENT, ['user-a', 'user-b']);
    const id2 = generateInviteBatchId(HOST, EVENT, ['user-a', 'user-c']);
    expect(id1).not.toBe(id2);
  });

  it('funziona con un singolo utente', () => {
    const id = generateInviteBatchId(HOST, EVENT, ['solo-user']);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('funziona con lista utenti vuota', () => {
    const id = generateInviteBatchId(HOST, EVENT, []);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });
});

// ---------------------------------------------------------------------------
// isDuplicateInviteBatch — con Prisma mockato
// ---------------------------------------------------------------------------
describe('isDuplicateInviteBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ritorna true se esiste già un batch con lo stesso ID nella finestra di 10 minuti', async () => {
    mockFindFirst.mockResolvedValue({ id: 'existing-log-id' });

    const result = await isDuplicateInviteBatch('abc123batchid');
    expect(result).toBe(true);
  });

  it('ritorna false se non esiste nessun batch corrispondente', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await isDuplicateInviteBatch('nuovo-batch-id');
    expect(result).toBe(false);
  });

  it('chiama prisma.auditLog.findFirst con action HOST_INVITE_SENT', async () => {
    mockFindFirst.mockResolvedValue(null);

    await isDuplicateInviteBatch('test-batch-id');

    expect(mockFindFirst).toHaveBeenCalledOnce();
    const callArgs = mockFindFirst.mock.calls[0][0];
    expect(callArgs.where.action).toBe('HOST_INVITE_SENT');
  });

  it('chiama prisma con il batchId corretto nel filtro JSON', async () => {
    mockFindFirst.mockResolvedValue(null);

    const batchId = 'specific-batch-id-xyz';
    await isDuplicateInviteBatch(batchId);

    const callArgs = mockFindFirst.mock.calls[0][0];
    expect(callArgs.where.metaJson.path).toEqual(['inviteBatchId']);
    expect(callArgs.where.metaJson.equals).toBe(batchId);
  });

  it('filtra per finestra temporale (createdAt >= 10 minuti fa)', async () => {
    mockFindFirst.mockResolvedValue(null);

    const before = Date.now();
    await isDuplicateInviteBatch('batch-id');
    const after = Date.now();

    const callArgs = mockFindFirst.mock.calls[0][0];
    const windowStart: Date = callArgs.where.createdAt.gte;
    expect(windowStart).toBeInstanceOf(Date);

    // La finestra inizia circa 10 minuti fa
    const tenMinutesMs = 10 * 60 * 1000;
    expect(windowStart.getTime()).toBeGreaterThanOrEqual(before - tenMinutesMs - 100);
    expect(windowStart.getTime()).toBeLessThanOrEqual(after - tenMinutesMs + 100);
  });

  it('seleziona solo il campo id (query efficiente)', async () => {
    mockFindFirst.mockResolvedValue(null);

    await isDuplicateInviteBatch('batch-id');

    const callArgs = mockFindFirst.mock.calls[0][0];
    expect(callArgs.select).toEqual({ id: true });
  });
});
