import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockConsume } = vi.hoisted(() => ({
  mockConsume: vi.fn(),
}));

vi.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: vi.fn().mockImplementation(() => ({
    consume: mockConsume,
    get: vi.fn().mockResolvedValue(null),
  })),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: { auditLog: { create: vi.fn().mockResolvedValue({}) } },
}));

vi.mock('@/lib/security/crypto', () => ({
  hashIP: vi.fn((ip: string) => `hashed_${ip}`),
}));

import {
  rateLimitLogin,
  rateLimitSubmission,
  rateLimitGameJoin,
  rateLimitHint,
  rateLimitClueBoard,
  rateLimitHostExport,
  rateLimitPuzzleCooldown,
  rateLimitIPSubmissions,
  rateLimitModuleExecute,
  getRemainingPoints,
} from '@/lib/security/rate-limit';

// Helper: simulate exhaustion by rejecting consume
function exhaustLimiter() {
  mockConsume.mockRejectedValueOnce(new Error('Rate limit exceeded'));
}

describe('rateLimitLogin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when under the limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });
    expect(await rateLimitLogin('user@test.it')).toBe(true);
  });

  it('returns false when limit exceeded', async () => {
    exhaustLimiter();
    expect(await rateLimitLogin('user@test.it')).toBe(false);
  });

  it('passes the identifier to consume', async () => {
    mockConsume.mockResolvedValue({});
    await rateLimitLogin('myid');
    expect(mockConsume).toHaveBeenCalledWith('myid');
  });
});

describe('rateLimitSubmission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when under the limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 4 });
    expect(await rateLimitSubmission('u1:event1')).toBe(true);
  });

  it('returns false when limit exceeded', async () => {
    exhaustLimiter();
    expect(await rateLimitSubmission('u1:event1')).toBe(false);
  });

  it('allows independent identifiers', async () => {
    mockConsume.mockResolvedValue({});
    expect(await rateLimitSubmission('user1')).toBe(true);
    expect(await rateLimitSubmission('user2')).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('user1');
    expect(mockConsume).toHaveBeenCalledWith('user2');
  });
});

describe('rateLimitGameJoin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when allowed', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 2 });
    expect(await rateLimitGameJoin('user1')).toBe(true);
  });

  it('returns false when exhausted', async () => {
    exhaustLimiter();
    expect(await rateLimitGameJoin('user1')).toBe(false);
  });
});

describe('rateLimitHint', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true within limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 2 });
    expect(await rateLimitHint('user1:event1')).toBe(true);
  });

  it('returns false when exhausted', async () => {
    exhaustLimiter();
    expect(await rateLimitHint('user1:event1')).toBe(false);
  });

  it('blocks after repeated calls (simulated)', async () => {
    mockConsume.mockResolvedValueOnce({}).mockResolvedValueOnce({}).mockResolvedValueOnce({});
    for (let i = 0; i < 3; i++) expect(await rateLimitHint('u')).toBe(true);
    exhaustLimiter();
    expect(await rateLimitHint('u')).toBe(false);
  });
});

describe('rateLimitClueBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true within limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 19 });
    expect(await rateLimitClueBoard('user1')).toBe(true);
  });

  it('returns false when exhausted', async () => {
    exhaustLimiter();
    expect(await rateLimitClueBoard('user1')).toBe(false);
  });
});

describe('rateLimitHostExport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true within limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 9 });
    expect(await rateLimitHostExport('host1')).toBe(true);
  });

  it('returns false when exhausted', async () => {
    exhaustLimiter();
    expect(await rateLimitHostExport('host1')).toBe(false);
  });

  it('treats different hosts independently', async () => {
    mockConsume.mockResolvedValue({});
    expect(await rateLimitHostExport('host-a')).toBe(true);
    expect(await rateLimitHostExport('host-b')).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('host-a');
    expect(mockConsume).toHaveBeenCalledWith('host-b');
  });
});

describe('rateLimitPuzzleCooldown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on first attempt', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 0 });
    expect(await rateLimitPuzzleCooldown('user1', 'puzzle1')).toBe(true);
  });

  it('returns false when cooldown active', async () => {
    exhaustLimiter();
    expect(await rateLimitPuzzleCooldown('user1', 'puzzle1')).toBe(false);
  });

  it('uses composite key userId:puzzleId', async () => {
    mockConsume.mockResolvedValue({});
    await rateLimitPuzzleCooldown('user-x', 'puzzle-y');
    expect(mockConsume).toHaveBeenCalledWith('user-x:puzzle-y');
  });

  it('allows same user on different puzzles independently', async () => {
    mockConsume.mockResolvedValue({});
    expect(await rateLimitPuzzleCooldown('u1', 'p1')).toBe(true);
    expect(await rateLimitPuzzleCooldown('u1', 'p2')).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('u1:p1');
    expect(mockConsume).toHaveBeenCalledWith('u1:p2');
  });
});

describe('rateLimitIPSubmissions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true within limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 29 });
    expect(await rateLimitIPSubmissions('hashed_ip_abc')).toBe(true);
  });

  it('returns false when exhausted', async () => {
    exhaustLimiter();
    expect(await rateLimitIPSubmissions('hashed_ip_abc')).toBe(false);
  });

  it('passes ipHash directly to consume', async () => {
    mockConsume.mockResolvedValue({});
    await rateLimitIPSubmissions('abc123hash');
    expect(mockConsume).toHaveBeenCalledWith('abc123hash');
  });
});

describe('rateLimitModuleExecute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true within limit', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 2 });
    expect(await rateLimitModuleExecute('user1')).toBe(true);
  });

  it('returns false when 3-per-10s limit exceeded', async () => {
    exhaustLimiter();
    expect(await rateLimitModuleExecute('user1')).toBe(false);
  });

  it('allows 3 executions then blocks on 4th (simulated)', async () => {
    mockConsume
      .mockResolvedValueOnce({ remainingPoints: 2 })
      .mockResolvedValueOnce({ remainingPoints: 1 })
      .mockResolvedValueOnce({ remainingPoints: 0 });
    for (let i = 0; i < 3; i++) expect(await rateLimitModuleExecute('u1')).toBe(true);
    exhaustLimiter();
    expect(await rateLimitModuleExecute('u1')).toBe(false);
  });
});

describe('getRemainingPoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 0 when no entry found', async () => {
    // RateLimiterMemory.get is mocked to return null
    const points = await getRemainingPoints('login', 'user1');
    expect(points).toBe(0);
  });
});
