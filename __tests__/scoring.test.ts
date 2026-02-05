import { describe, it, expect } from 'vitest';
import { calculateScore, detectSuspiciousActivity, calculateRankings } from '@/lib/game/scoring';

describe('calculateScore', () => {
  it('should return 0 for incorrect answers', () => {
    const score = calculateScore({
      isCorrect: false,
      timeToSolveMs: 60000,
      hintsUsed: 0,
      attemptsCount: 1,
    });
    expect(score).toBe(0);
  });

  it('should return base points for correct answer with no bonuses/penalties', () => {
    const score = calculateScore(
      {
        isCorrect: true,
        timeToSolveMs: 1800000, // Max time, so no time bonus
        hintsUsed: 0,
        attemptsCount: 1,
      },
      { timeBonusEnabled: false }
    );
    expect(score).toBe(100);
  });

  it('should add time bonus for fast solves', () => {
    const score = calculateScore({
      isCorrect: true,
      timeToSolveMs: 0, // Instant solve
      hintsUsed: 0,
      attemptsCount: 1,
    });
    // Base 100 + max time bonus 50 = 150
    expect(score).toBe(150);
  });

  it('should apply hint penalty', () => {
    const score = calculateScore(
      {
        isCorrect: true,
        timeToSolveMs: 1800000,
        hintsUsed: 3,
        attemptsCount: 1,
      },
      { timeBonusEnabled: false }
    );
    // Base 100 - (3 * 10) = 70
    expect(score).toBe(70);
  });

  it('should apply attempt penalty (first attempt free)', () => {
    const score = calculateScore(
      {
        isCorrect: true,
        timeToSolveMs: 1800000,
        hintsUsed: 0,
        attemptsCount: 4,
      },
      { timeBonusEnabled: false }
    );
    // Base 100 - (3 * 5) = 85
    expect(score).toBe(85);
  });

  it('should add cross-table bonus', () => {
    const score = calculateScore(
      {
        isCorrect: true,
        timeToSolveMs: 1800000,
        hintsUsed: 0,
        attemptsCount: 1,
        isCrossTable: true,
      },
      { timeBonusEnabled: false }
    );
    // Base 100 + cross-table 25 = 125
    expect(score).toBe(125);
  });

  it('should enforce minimum score of 1 for correct answers', () => {
    const score = calculateScore(
      {
        isCorrect: true,
        timeToSolveMs: 1800000,
        hintsUsed: 20, // Heavy penalty
        attemptsCount: 10,
      },
      { timeBonusEnabled: false }
    );
    // Would be negative, but minimum is 1
    expect(score).toBe(1);
  });

  it('should use custom config', () => {
    const score = calculateScore(
      {
        isCorrect: true,
        timeToSolveMs: 1800000,
        hintsUsed: 0,
        attemptsCount: 1,
      },
      { basePoints: 200, timeBonusEnabled: false }
    );
    expect(score).toBe(200);
  });
});

describe('detectSuspiciousActivity', () => {
  it('should return null for empty submissions', () => {
    expect(detectSuspiciousActivity([])).toBeNull();
  });

  it('should detect suspicious speed', () => {
    const now = new Date();
    const submissions = Array.from({ length: 5 }, (_, i) => ({
      submittedAt: new Date(now.getTime() + i * 1000),
      timeToSolveMs: 2000,
      isCorrect: true,
    }));

    expect(detectSuspiciousActivity(submissions)).toBe('SUSPICIOUS_SPEED');
  });

  it('should detect rapid attempts', () => {
    const now = new Date();
    const submissions = Array.from({ length: 10 }, (_, i) => ({
      submittedAt: new Date(now.getTime() + i * 500), // 500ms apart
      timeToSolveMs: 30000,
      isCorrect: false,
    }));

    expect(detectSuspiciousActivity(submissions)).toBe('RAPID_ATTEMPTS');
  });

  it('should return null for legitimate submissions', () => {
    const now = new Date();
    const submissions = [
      { submittedAt: new Date(now.getTime()), timeToSolveMs: 60000, isCorrect: true },
      { submittedAt: new Date(now.getTime() + 120000), timeToSolveMs: 45000, isCorrect: true },
    ];

    expect(detectSuspiciousActivity(submissions)).toBeNull();
  });
});

describe('calculateRankings', () => {
  it('should rank by total points descending', () => {
    const entries = [
      { userId: '1', alias: 'a', totalPoints: 100, puzzlesSolved: 2, averageTime: 30000 },
      { userId: '2', alias: 'b', totalPoints: 200, puzzlesSolved: 3, averageTime: 20000 },
      { userId: '3', alias: 'c', totalPoints: 150, puzzlesSolved: 2, averageTime: 25000 },
    ];

    const ranked = calculateRankings(entries);
    expect(ranked[0].userId).toBe('2');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].userId).toBe('3');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].userId).toBe('1');
    expect(ranked[2].rank).toBe(3);
  });

  it('should handle ties (same points, same time = same rank)', () => {
    const entries = [
      { userId: '1', alias: 'a', totalPoints: 100, puzzlesSolved: 2, averageTime: 30000 },
      { userId: '2', alias: 'b', totalPoints: 100, puzzlesSolved: 2, averageTime: 30000 },
    ];

    const ranked = calculateRankings(entries);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
  });

  it('should break ties by average time', () => {
    const entries = [
      { userId: '1', alias: 'a', totalPoints: 100, puzzlesSolved: 2, averageTime: 30000 },
      { userId: '2', alias: 'b', totalPoints: 100, puzzlesSolved: 2, averageTime: 20000 },
    ];

    const ranked = calculateRankings(entries);
    expect(ranked[0].userId).toBe('2'); // Faster avg time
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].userId).toBe('1');
    expect(ranked[1].rank).toBe(2);
  });
});
