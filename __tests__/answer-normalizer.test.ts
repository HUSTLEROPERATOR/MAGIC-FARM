import { describe, it, expect, vi } from 'vitest';
import { hashWithSalt } from '@/lib/security/crypto';
import {
  normalizeAnswer,
  levenshtein,
  isAnswerCorrect,
  generateAndCheckEditDistance1,
  MAX_FUZZY_LENGTH,
  MAX_VARIANTS,
  FUZZY_SKIP_LENGTH,
} from '@/lib/game/answer-normalizer';

/** Helper: hash a plaintext answer the same way the admin route does */
function hashAnswer(plaintext: string) {
  const normalized = plaintext.toLowerCase().trim();
  return hashWithSalt(normalized);
}

// ─── normalizeAnswer ─────────────────────────────────────────────

describe('normalizeAnswer', () => {
  it('lowercases and trims', () => {
    expect(normalizeAnswer('  HELLO  ')).toBe('hello');
  });

  it('strips leading Italian article', () => {
    expect(normalizeAnswer('un fiammifero')).toBe('fiammifero');
    expect(normalizeAnswer('il castello')).toBe('castello');
    expect(normalizeAnswer('la porta')).toBe('porta');
  });

  it('does NOT strip a single-word answer that happens to be an article', () => {
    expect(normalizeAnswer('uno')).toBe('uno');
  });

  it('removes punctuation and collapses spaces', () => {
    expect(normalizeAnswer('  ciao,  mondo!  ')).toBe('ciao mondo');
  });
});

// ─── levenshtein ─────────────────────────────────────────────────

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
  it('returns 1 for a single substitution', () => {
    expect(levenshtein('abc', 'aXc')).toBe(1);
  });
  it('returns 1 for a single insertion', () => {
    expect(levenshtein('abc', 'abXc')).toBe(1);
  });
  it('returns 1 for a single deletion', () => {
    expect(levenshtein('abc', 'ac')).toBe(1);
  });
});

// ─── isAnswerCorrect — deterministic matches ─────────────────────

describe('isAnswerCorrect — deterministic', () => {
  it('accepts exact match (case-insensitive)', () => {
    const { hash, salt } = hashAnswer('fiammifero');
    expect(isAnswerCorrect('Fiammifero', hash, salt)).toBe(true);
    expect(isAnswerCorrect('FIAMMIFERO', hash, salt)).toBe(true);
  });

  it('accepts "un fiammifero" when correct answer is "fiammifero"', () => {
    const { hash, salt } = hashAnswer('fiammifero');
    expect(isAnswerCorrect('un fiammifero', hash, salt)).toBe(true);
  });

  it('accepts "il castello" when correct answer is "castello"', () => {
    const { hash, salt } = hashAnswer('castello');
    expect(isAnswerCorrect('il castello', hash, salt)).toBe(true);
  });

  it('rejects a completely wrong answer', () => {
    const { hash, salt } = hashAnswer('fiammifero');
    expect(isAnswerCorrect('banana', hash, salt)).toBe(false);
  });
});

// ─── isAnswerCorrect — fuzzy matches ─────────────────────────────

describe('isAnswerCorrect — fuzzy (Levenshtein ≤ 1)', () => {
  it('accepts "fiammiffero" typo for "fiammifero"', () => {
    const { hash, salt } = hashAnswer('fiammifero');
    // "fiammiffero" has an extra 'f' → distance 1 from "fiammifero"
    expect(isAnswerCorrect('fiammiffero', hash, salt)).toBe(true);
  });

  it('accepts single-char substitution typo', () => {
    const { hash, salt } = hashAnswer('gatto');
    // "getto" → substitution a→e at index 1 → distance 1 → should match
    expect(isAnswerCorrect('getto', hash, salt)).toBe(true);
    // "gatso" → substitution t→s at index 3 → distance 1 → should match
    expect(isAnswerCorrect('gatso', hash, salt)).toBe(true);
  });

  it('does NOT run fuzzy for long input (> MAX_FUZZY_LENGTH chars)', () => {
    // Use a single long word > 20 chars
    const longWord = 'supercalifragilistica'; // 21 chars
    expect(longWord.length).toBeGreaterThan(MAX_FUZZY_LENGTH);
    const { hash, salt } = hashAnswer(longWord);
    // Try a typo version — should NOT match because fuzzy is skipped
    const typo = 'supercalifragilisticb'; // sub at last char
    expect(isAnswerCorrect(typo, hash, salt)).toBe(false);
    // Exact match should still work (deterministic phase)
    expect(isAnswerCorrect(longWord, hash, salt)).toBe(true);
  });

  it('does NOT run fuzzy for normalized length >= FUZZY_SKIP_LENGTH (15)', () => {
    // "intercettazione" is 15 chars — should be deterministic-only
    const answer = 'intercettazione'; // exactly 15 chars
    expect(answer.length).toBeGreaterThanOrEqual(FUZZY_SKIP_LENGTH);
    expect(answer.length).toBeLessThanOrEqual(MAX_FUZZY_LENGTH);
    const { hash, salt } = hashAnswer(answer);
    // A 1-edit typo should NOT match because fuzzy is skipped for length >= 15
    const typo = 'intercettazionx'; // sub at last char
    expect(isAnswerCorrect(typo, hash, salt)).toBe(false);
    // Exact match should still work (deterministic phase)
    expect(isAnswerCorrect(answer, hash, salt)).toBe(true);
  });
});

// ─── MAX_VARIANTS cap ────────────────────────────────────────────

describe('generateAndCheckEditDistance1 — MAX_VARIANTS cap', () => {
  it('returns null (bails out) when unique variants exceed MAX_VARIANTS', () => {
    // An 8-char string with unique chars generates ~550 unique variants,
    // which exceeds MAX_VARIANTS (500) → runtime bail-out
    const s = 'abcdefgh'; // length 8
    const result = generateAndCheckEditDistance1(s, () => false);
    expect(result).toBeNull();
  });

  it('does NOT bail out for very short strings', () => {
    // length 3: total unique variants well under 500 → should run fully
    let callCount = 0;
    const result = generateAndCheckEditDistance1('abc', () => {
      callCount++;
      return false;
    });
    expect(result).toBeNull(); // no match
    expect(callCount).toBeGreaterThan(0); // but it did run
    expect(callCount).toBeLessThanOrEqual(MAX_VARIANTS);
  });

  it('early-exits on first match', () => {
    let callCount = 0;
    const result = generateAndCheckEditDistance1('abc', (v) => {
      callCount++;
      return v === 'bc'; // first deletion
    });
    expect(result).toBe('bc');
    expect(callCount).toBe(1); // stopped immediately
  });
});

// ─── Verify hash call count is bounded ───────────────────────────

describe('isAnswerCorrect — bounded hash calls', () => {
  it('never exceeds MAX_VARIANTS + deterministic candidates hash calls', async () => {
    // Dynamically import so vitest resolves the alias
    const cryptoMod = await import('@/lib/security/crypto');
    const spy = vi.spyOn(cryptoMod, 'verifyHash');

    const { hash, salt } = hashAnswer('gatto');
    // Wrong answer forces full deterministic + fuzzy enumeration
    isAnswerCorrect('completely wrong answer', hash, salt);

    // Deterministic candidates: at most 3, fuzzy either skipped or <= MAX_VARIANTS
    expect(spy.mock.calls.length).toBeLessThanOrEqual(MAX_VARIANTS + 3);

    spy.mockRestore();
  });
});
