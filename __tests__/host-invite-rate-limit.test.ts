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

import { rateLimitHostInvite } from '@/lib/security/rate-limit';

describe('Host Invite Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within the limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });
    const allowed = await rateLimitHostInvite('user1_127.0.0.1');
    expect(allowed).toBe(true);
  });

  it('should allow up to 5 requests', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 0 });

    for (let i = 0; i < 5; i++) {
      const allowed = await rateLimitHostInvite('user1_127.0.0.1');
      expect(allowed).toBe(true);
    }
    expect(mockConsume).toHaveBeenCalledTimes(5);
  });

  it('should block the 6th request (return 429 scenario)', async () => {
    // First 5 succeed
    mockConsume.mockResolvedValue({ remainingPoints: 0 });
    for (let i = 0; i < 5; i++) {
      const allowed = await rateLimitHostInvite('user1_127.0.0.1');
      expect(allowed).toBe(true);
    }

    // 6th call rejected by rate-limiter-flexible
    mockConsume.mockRejectedValueOnce(new Error('Rate limit exceeded'));
    const blocked = await rateLimitHostInvite('user1_127.0.0.1');
    expect(blocked).toBe(false);
  });

  it('should use composite key userId_ip', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });

    await rateLimitHostInvite('hostA_192.168.1.1');

    expect(mockConsume).toHaveBeenCalledWith('hostA_192.168.1.1');
  });

  it('should reset after window expires (simulated)', async () => {
    // First 5 succeed
    mockConsume.mockResolvedValue({ remainingPoints: 0 });
    for (let i = 0; i < 5; i++) {
      await rateLimitHostInvite('user1_127.0.0.1');
    }

    // 6th blocked
    mockConsume.mockRejectedValueOnce(new Error('Rate limit exceeded'));
    const blocked = await rateLimitHostInvite('user1_127.0.0.1');
    expect(blocked).toBe(false);

    // After window reset, consume succeeds again
    mockConsume.mockResolvedValue({ remainingPoints: 4 });
    const allowedAgain = await rateLimitHostInvite('user1_127.0.0.1');
    expect(allowedAgain).toBe(true);
  });

  it('should treat different users independently', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });

    const allowedA = await rateLimitHostInvite('userA_10.0.0.1');
    const allowedB = await rateLimitHostInvite('userB_10.0.0.2');

    expect(allowedA).toBe(true);
    expect(allowedB).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('userA_10.0.0.1');
    expect(mockConsume).toHaveBeenCalledWith('userB_10.0.0.2');
  });
});

describe('Audit log on rate limit block', () => {
  it('should include HOST_INVITE_RATE_LIMIT in AUDIT_ACTIONS', async () => {
    const { AUDIT_ACTIONS } = await import('@/lib/audit/logger');
    expect(AUDIT_ACTIONS.HOST_INVITE_RATE_LIMIT).toBe('HOST_INVITE_RATE_LIMIT');
  });
});
