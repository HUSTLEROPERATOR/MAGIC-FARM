import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuditLogCreate = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  default: {
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/lib/security/crypto', () => ({
  hashIP: vi.fn((ip: string) => `hashed_${ip}`),
}));

import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { hashIP } from '@/lib/security/crypto';

describe('createAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  it('creates a log entry with minimal fields', async () => {
    await createAuditLog({ action: 'USER_LOGIN' });
    expect(mockAuditLogCreate).toHaveBeenCalledOnce();
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.action).toBe('USER_LOGIN');
  });

  it('passes actorUserId and actorRole when provided', async () => {
    await createAuditLog({ action: 'ADMIN_EVENT_CREATE', actorUserId: 'u1', actorRole: 'ADMIN' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.actorUserId).toBe('u1');
    expect(call.data.actorRole).toBe('ADMIN');
  });

  it('sets actorUserId and actorRole to null when omitted', async () => {
    await createAuditLog({ action: 'USER_LOGIN' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.actorUserId).toBeNull();
    expect(call.data.actorRole).toBeNull();
  });

  it('hashes the IP address via hashIP and stores the hash, not the raw IP', async () => {
    await createAuditLog({ action: 'GAME_JOIN', ipAddress: '1.2.3.4' });
    // hashIP must have been called with the raw IP
    expect(hashIP).toHaveBeenCalledWith('1.2.3.4');
    const call = mockAuditLogCreate.mock.calls[0][0];
    // The stored hash is the return value of hashIP, not the raw IP
    expect(call.data.ipHash).toBe('hashed_1.2.3.4');
    // The raw IP address field is NOT present in the Prisma data object
    expect(Object.keys(call.data)).not.toContain('ipAddress');
  });

  it('injects requestId into metaJson when provided', async () => {
    await createAuditLog({ action: 'USER_LOGIN', requestId: 'req-42' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.metaJson.requestId).toBe('req-42');
  });

  it('auto-generates requestId when not provided', async () => {
    await createAuditLog({ action: 'USER_LOGIN' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.metaJson.requestId).toBeTruthy();
    expect(typeof call.data.metaJson.requestId).toBe('string');
  });

  it('injects ipHash into metaJson when IP is provided', async () => {
    await createAuditLog({ action: 'GAME_JOIN', ipAddress: '10.0.0.1' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.metaJson.ipHash).toBe('hashed_10.0.0.1');
  });

  it('includes custom metadata merged with injected fields', async () => {
    await createAuditLog({ action: 'ANSWER_SUBMITTED', metadata: { puzzleId: 'p1', score: 100 } });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.metaJson.puzzleId).toBe('p1');
    expect(call.data.metaJson.score).toBe(100);
    expect(call.data.metaJson.requestId).toBeTruthy();
  });

  it('stores userAgent when provided', async () => {
    await createAuditLog({ action: 'USER_LOGIN', userAgent: 'Mozilla/5.0' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.userAgent).toBe('Mozilla/5.0');
  });

  it('sets userAgent to null when omitted', async () => {
    await createAuditLog({ action: 'USER_LOGIN' });
    const call = mockAuditLogCreate.mock.calls[0][0];
    expect(call.data.userAgent).toBeNull();
  });

  it('does not throw when prisma.create fails', async () => {
    mockAuditLogCreate.mockRejectedValueOnce(new Error('DB connection failed'));
    await expect(createAuditLog({ action: 'USER_LOGIN' })).resolves.not.toThrow();
  });

  it('does not throw on any failure — never breaks the app', async () => {
    mockAuditLogCreate.mockRejectedValue(new Error('Persistent failure'));
    for (let i = 0; i < 3; i++) {
      await expect(createAuditLog({ action: 'GAME_JOIN' })).resolves.not.toThrow();
    }
  });
});

describe('AUDIT_ACTIONS', () => {
  it('has all authentication actions', () => {
    expect(AUDIT_ACTIONS.USER_LOGIN).toBe('USER_LOGIN');
    expect(AUDIT_ACTIONS.USER_LOGOUT).toBe('USER_LOGOUT');
    expect(AUDIT_ACTIONS.USER_REGISTER).toBe('USER_REGISTER');
    expect(AUDIT_ACTIONS.EMAIL_VERIFIED).toBe('EMAIL_VERIFIED');
  });

  it('has all game actions', () => {
    expect(AUDIT_ACTIONS.GAME_JOIN).toBe('GAME_JOIN');
    expect(AUDIT_ACTIONS.TABLE_JOIN).toBe('TABLE_JOIN');
    expect(AUDIT_ACTIONS.ANSWER_SUBMITTED).toBe('ANSWER_SUBMITTED');
    expect(AUDIT_ACTIONS.HINT_REQUESTED).toBe('HINT_REQUESTED');
  });

  it('has all admin actions', () => {
    expect(AUDIT_ACTIONS.ADMIN_EVENT_CREATE).toBe('ADMIN_EVENT_CREATE');
    expect(AUDIT_ACTIONS.ADMIN_PUZZLE_CREATE).toBe('ADMIN_PUZZLE_CREATE');
    expect(AUDIT_ACTIONS.ADMIN_USER_BANNED).toBe('ADMIN_USER_BANNED');
  });

  it('has all module actions', () => {
    expect(AUDIT_ACTIONS.MODULE_ENABLED).toBe('MODULE_ENABLED');
    expect(AUDIT_ACTIONS.MODULE_DISABLED).toBe('MODULE_DISABLED');
    expect(AUDIT_ACTIONS.MODULE_CONFIGURED).toBe('MODULE_CONFIGURED');
    expect(AUDIT_ACTIONS.MODULE_EXECUTED).toBe('MODULE_EXECUTED');
    expect(AUDIT_ACTIONS.MODULE_EXECUTION_BLOCKED).toBe('MODULE_EXECUTION_BLOCKED');
  });

  it('has host operations', () => {
    expect(AUDIT_ACTIONS.HOST_INVITE_SENT).toBe('HOST_INVITE_SENT');
    expect(AUDIT_ACTIONS.HOST_INVITE_RATE_LIMIT).toBe('HOST_INVITE_RATE_LIMIT');
  });

  it('has mentalism actions', () => {
    expect(AUDIT_ACTIONS.MENTALISM_FIRMA_LOCKED).toBe('MENTALISM_FIRMA_LOCKED');
    expect(AUDIT_ACTIONS.MENTALISM_FIRMA_REVEALED).toBe('MENTALISM_FIRMA_REVEALED');
    expect(AUDIT_ACTIONS.MENTALISM_THOUGHT_SUBMITTED).toBe('MENTALISM_THOUGHT_SUBMITTED');
  });

  it('has anti-cheat actions', () => {
    expect(AUDIT_ACTIONS.SUBMISSION_COOLDOWN_BLOCKED).toBe('SUBMISSION_COOLDOWN_BLOCKED');
    expect(AUDIT_ACTIONS.SUBMISSION_IP_PATTERN_BLOCKED).toBe('SUBMISSION_IP_PATTERN_BLOCKED');
  });

  it('action values equal their keys (no accidental remapping)', () => {
    for (const [key, value] of Object.entries(AUDIT_ACTIONS)) {
      expect(value).toBe(key);
    }
  });
});
