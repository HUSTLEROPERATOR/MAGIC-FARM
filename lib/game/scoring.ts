/**
 * Scoring System for Magic Farm
 * 
 * Calculates points based on:
 * - Correctness (mandatory)
 * - Time to solve (bonus for speed)
 * - Hints used (penalty)
 * - Number of attempts (penalty)
 * - Cross-table collaboration (bonus)
 */

interface ScoringConfig {
  basePoints: number;
  timeBonusEnabled?: boolean;
  maxTimeMs?: number;
  hintPenalty?: number;
  attemptPenalty?: number;
  crossTableBonus?: number;
}

interface SubmissionMetrics {
  isCorrect: boolean;
  timeToSolveMs: number;
  hintsUsed: number;
  attemptsCount: number;
  isCrossTable?: boolean;
}

const DEFAULT_CONFIG: ScoringConfig = {
  basePoints: 100,
  timeBonusEnabled: true,
  maxTimeMs: 1800000, // 30 minutes
  hintPenalty: 10,
  attemptPenalty: 5,
  crossTableBonus: 25,
};

/**
 * Calculate points for a submission
 */
export function calculateScore(
  metrics: SubmissionMetrics,
  config: Partial<ScoringConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // No points for incorrect answers
  if (!metrics.isCorrect) {
    return 0;
  }

  let points = cfg.basePoints;

  // Time bonus: faster solves get more points
  if (cfg.timeBonusEnabled && cfg.maxTimeMs) {
    const timeRatio = Math.max(0, 1 - metrics.timeToSolveMs / cfg.maxTimeMs);
    const timeBonus = Math.floor(timeRatio * 50); // Up to 50 bonus points
    points += timeBonus;
  }

  // Hint penalty
  if (cfg.hintPenalty) {
    points -= metrics.hintsUsed * cfg.hintPenalty;
  }

  // Attempt penalty (first attempt is free)
  if (cfg.attemptPenalty && metrics.attemptsCount > 1) {
    points -= (metrics.attemptsCount - 1) * cfg.attemptPenalty;
  }

  // Cross-table collaboration bonus
  if (metrics.isCrossTable && cfg.crossTableBonus) {
    points += cfg.crossTableBonus;
  }

  // Minimum points is 1 (if correct)
  return Math.max(1, points);
}

/**
 * Detect suspicious submission patterns for anti-cheat
 */
export function detectSuspiciousActivity(
  submissions: Array<{
    submittedAt: Date;
    timeToSolveMs: number;
    isCorrect: boolean;
  }>
): string | null {
  if (submissions.length === 0) return null;

  const correctSubmissions = submissions.filter((s) => s.isCorrect);

  // Too fast (less than 5 seconds consistently)
  const avgSolveTime =
    correctSubmissions.reduce((sum, s) => sum + s.timeToSolveMs, 0) /
    correctSubmissions.length;
  if (correctSubmissions.length > 2 && avgSolveTime < 5000) {
    return 'SUSPICIOUS_SPEED';
  }

  // Too many rapid attempts
  const rapidAttempts = submissions.filter((s, i) => {
    if (i === 0) return false;
    const prevSubmission = submissions[i - 1];
    const timeDiff = s.submittedAt.getTime() - prevSubmission.submittedAt.getTime();
    return timeDiff < 2000; // Less than 2 seconds between attempts
  });
  if (rapidAttempts.length > 5) {
    return 'RAPID_ATTEMPTS';
  }

  // Perfect score pattern (might indicate answer sharing)
  const perfectScores = correctSubmissions.filter((s) => s.timeToSolveMs < 10000);
  if (perfectScores.length > 3) {
    return 'PERFECT_PATTERN';
  }

  return null;
}

/**
 * Calculate leaderboard rankings
 */
export interface LeaderboardEntry {
  userId: string;
  alias: string;
  totalPoints: number;
  puzzlesSolved: number;
  averageTime: number;
  rank?: number;
}

export function calculateRankings(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  // Sort by total points (descending), then by average time (ascending)
  const sorted = [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.averageTime - b.averageTime;
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  const ranked: LeaderboardEntry[] = [];
  for (let index = 0; index < sorted.length; index++) {
    const entry = sorted[index];
    if (index > 0) {
      const prevRanked = ranked[index - 1];
      if (
        entry.totalPoints === prevRanked.totalPoints &&
        entry.averageTime === prevRanked.averageTime
      ) {
        // Same rank for ties
        ranked.push({ ...entry, rank: prevRanked.rank });
        continue;
      }
      currentRank = index + 1;
    }
    ranked.push({ ...entry, rank: currentRank });
  }
  return ranked;
}
