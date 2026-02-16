import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiters for different actions
const loginLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
  duration: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '900'), // 15 minutes
});

const submitLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_SUBMIT_MAX || '5'),
  duration: parseInt(process.env.RATE_LIMIT_SUBMIT_WINDOW || '30'), // 5 per 30 seconds
});

const gameJoinLimiter = new RateLimiterMemory({
  points: 3,
  duration: 300, // 5 minutes
});

const hintLimiter = new RateLimiterMemory({
  points: 3,
  duration: 300, // 3 hint requests per 5 minutes
});

const clueBoardLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60, // 20 messages per minute
});

const hostInviteLimiter = new RateLimiterMemory({
  points: 5,
  duration: 600, // 5 requests per 10 minutes
});

const hostExportLimiter = new RateLimiterMemory({
  points: 10,
  duration: 600, // 10 exports per 10 minutes
});

/**
 * Per-puzzle submission cooldown: 1 attempt per 5 seconds per user+puzzle.
 * Prevents rapid-fire brute-force on a single puzzle.
 */
const puzzleCooldownLimiter = new RateLimiterMemory({
  points: 1,
  duration: 5, // 1 attempt per 5 seconds per puzzle
});

/**
 * IP-based submission limiter: 30 submissions per 5 minutes from same IP.
 * Detects multi-account abuse from the same IP.
 */
const moduleExecuteLimiter = new RateLimiterMemory({
  points: 3,
  duration: 10, // 3 executions per 10 seconds
});

const ipSubmitLimiter = new RateLimiterMemory({
  points: 30,
  duration: 300, // 30 per 5 minutes — generous for shared networks
});

/**
 * Rate limit login attempts
 */
export async function rateLimitLogin(identifier: string): Promise<boolean> {
  try {
    await loginLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit answer submissions
 */
export async function rateLimitSubmission(identifier: string): Promise<boolean> {
  try {
    await submitLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit game join attempts
 */
export async function rateLimitGameJoin(identifier: string): Promise<boolean> {
  try {
    await gameJoinLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit hint requests
 */
export async function rateLimitHint(identifier: string): Promise<boolean> {
  try {
    await hintLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit clue board messages
 */
export async function rateLimitClueBoard(identifier: string): Promise<boolean> {
  try {
    await clueBoardLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit host invite requests (5 per 10 minutes)
 */
export async function rateLimitHostInvite(identifier: string): Promise<boolean> {
  try {
    await hostInviteLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit host export/top-players requests (10 per 10 minutes)
 */
export async function rateLimitHostExport(identifier: string): Promise<boolean> {
  try {
    await hostExportLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

/**
 * Per-puzzle submission cooldown: 1 attempt per 5 seconds per user+puzzle.
 * Returns false if the user must wait.
 */
export async function rateLimitPuzzleCooldown(userId: string, puzzleId: string): Promise<boolean> {
  try {
    await puzzleCooldownLimiter.consume(`${userId}:${puzzleId}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * IP-based submission limiter: 30 per 5 minutes from same IP hash.
 * Returns false if too many submissions from this IP.
 */
export async function rateLimitIPSubmissions(ipHash: string): Promise<boolean> {
  try {
    await ipSubmitLimiter.consume(ipHash);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit module executions: 3 per 10 seconds per user
 */
export async function rateLimitModuleExecute(userId: string): Promise<boolean> {
  try {
    await moduleExecuteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get remaining points for a rate limiter
 */
export async function getRemainingPoints(
  limiterType: 'login' | 'submit' | 'gameJoin' | 'clueBoard' | 'hostInvite' | 'hostExport',
  identifier: string
): Promise<number> {
  const limiter = {
    login: loginLimiter,
    submit: submitLimiter,
    gameJoin: gameJoinLimiter,
    clueBoard: clueBoardLimiter,
    hostInvite: hostInviteLimiter,
    hostExport: hostExportLimiter,
  }[limiterType];

  try {
    const res = await limiter.get(identifier);
    return res ? res.remainingPoints : 0;
  } catch {
    return 0;
  }
}
