import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted so the mock fn is available when vi.mock factory runs (hoisted)
const { mockConsume } = vi.hoisted(() => ({
  mockConsume: vi.fn(),
}));

vi.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: vi.fn().mockImplementation(() => ({
    consume: mockConsume,
    get: vi.fn().mockResolvedValue(null),
  })),
}));

// Mock prisma
vi.mock('@/lib/db/prisma', () => ({
  default: {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock crypto
vi.mock('@/lib/security/crypto', () => ({
  hashIP: vi.fn((ip: string) => `hashed_${ip}`),
}));

import { rateLimitSubmission, rateLimitGameJoin } from '@/lib/security/rate-limit';

describe('Submit Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within the limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });
    const allowed = await rateLimitSubmission('user1');
    expect(allowed).toBe(true);
  });

  it('should block when limit is exceeded', async () => {
    mockConsume.mockRejectedValueOnce(new Error('Rate limit exceeded'));
    const blocked = await rateLimitSubmission('user1');
    expect(blocked).toBe(false);
  });

  it('should use the provided identifier as key', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 3 });
    await rateLimitSubmission('userA');
    expect(mockConsume).toHaveBeenCalledWith('userA');
  });

  it('should treat different users independently', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });
    const allowedA = await rateLimitSubmission('userA');
    const allowedB = await rateLimitSubmission('userB');
    expect(allowedA).toBe(true);
    expect(allowedB).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('userA');
    expect(mockConsume).toHaveBeenCalledWith('userB');
  });
});

describe('Game Join Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within the limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 2 });
    const allowed = await rateLimitGameJoin('user1');
    expect(allowed).toBe(true);
  });

  it('should block when limit is exceeded', async () => {
    mockConsume.mockRejectedValueOnce(new Error('Rate limit exceeded'));
    const blocked = await rateLimitGameJoin('user1');
    expect(blocked).toBe(false);
  });

  it('should use the provided identifier as key', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 2 });
    await rateLimitGameJoin('userA');
    expect(mockConsume).toHaveBeenCalledWith('userA');
  });

  it('should treat different users independently', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 2 });
    const allowedA = await rateLimitGameJoin('userA');
    const allowedB = await rateLimitGameJoin('userB');
    expect(allowedA).toBe(true);
    expect(allowedB).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('userA');
    expect(mockConsume).toHaveBeenCalledWith('userB');
  });
});

describe('Audit log actions for anti-cheat', () => {
  it('should include SUSPICIOUS_ACTIVITY_DETECTED in AUDIT_ACTIONS', async () => {
    const { AUDIT_ACTIONS } = await import('@/lib/audit/logger');
    expect(AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY_DETECTED).toBe('SUSPICIOUS_ACTIVITY_DETECTED');
  });
});
