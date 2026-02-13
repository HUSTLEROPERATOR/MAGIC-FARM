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
 * Get remaining points for a rate limiter
 */
export async function getRemainingPoints(
  limiterType: 'login' | 'submit' | 'gameJoin' | 'clueBoard',
  identifier: string
): Promise<number> {
  const limiter = {
    login: loginLimiter,
    submit: submitLimiter,
    gameJoin: gameJoinLimiter,
    clueBoard: clueBoardLimiter,
  }[limiterType];

  try {
    const res = await limiter.get(identifier);
    return res ? res.remainingPoints : 0;
  } catch {
    return 0;
  }
}
