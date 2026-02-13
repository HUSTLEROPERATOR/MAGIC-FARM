import { verifyHash } from '@/lib/security/crypto';

/**
 * Answer Normalizer for Magic Farm
 *
 * Accepts small variations in user answers:
 * - Different casing
 * - Leading Italian articles (il, lo, la, i, gli, le, un, uno, una)
 * - Trailing/leading punctuation
 * - Multiple spaces
 * - Minor typos (Levenshtein distance <= 1, ONLY for short answers <= 2 words)
 *
 * Works with hash-based answer storage by generating candidate
 * normalizations and checking each against the stored hash.
 *
 * GUARDRAILS (CPU-safety):
 * - Fuzzy phase only for wordCount <= 2 AND normalized.length < FUZZY_SKIP_LENGTH (15)
 * - normalized.length must also be <= MAX_FUZZY_LENGTH (20)
 * - Normalized input must match ALLOWED_CHARS before fuzzy runs
 * - Variant generation is capped at MAX_VARIANTS (500) at runtime; exceeding → stop fuzzy
 * - Early-exit: stop as soon as a matching hash is found
 */

const ITALIAN_ARTICLES = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una'];

/** Characters used for fuzzy variant generation (Italian alphabet) */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzàèéìòù';

/** Maximum normalized length eligible for fuzzy matching */
export const MAX_FUZZY_LENGTH = 20;

/**
 * Answers whose normalized length reaches this threshold skip fuzzy entirely
 * (deterministic-only). Long inputs are phrases, not single-word typos.
 */
export const FUZZY_SKIP_LENGTH = 15;

/**
 * Maximum number of fuzzy variants before bailing out.
 * Enforced at runtime: generation stops once this many unique
 * candidates have been checked, bounding CPU work per submission.
 */
export const MAX_VARIANTS = 500;

/** Regex: only these characters are allowed for the fuzzy phase */
const ALLOWED_CHARS_RE = /^[a-z0-9àèéìòù ]+$/;

// ─── Normalization ───────────────────────────────────────────────

/**
 * Normalize an answer string:
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. Remove punctuation (keep letters, digits, spaces, accented chars)
 * 4. Collapse multiple spaces
 * 5. Remove a leading Italian article if present
 */
export function normalizeAnswer(input: string): string {
  let s = input.toLowerCase().trim();

  // Remove punctuation — keep word chars, spaces, and accented vowels
  s = s.replace(/[^\w\sàèéìòùáéíóú]/g, '');

  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim();

  // Strip leading Italian article (only the first word)
  const words = s.split(' ');
  if (words.length > 1 && ITALIAN_ARTICLES.includes(words[0])) {
    s = words.slice(1).join(' ');
  }

  return s.trim();
}

// ─── Levenshtein ─────────────────────────────────────────────────

/**
 * Compute Levenshtein edit distance between two strings.
 * Pure TypeScript, no dependencies.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use single-row optimisation for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

// ─── Fuzzy candidate generation ──────────────────────────────────

/**
 * Generate all strings within edit distance 1 of `s`.
 * Includes deletions, substitutions, insertions, and adjacent transpositions.
 *
 * Guardrails:
 * - Caller must ensure s.length <= MAX_FUZZY_LENGTH
 * - Returns `null` if unique variants checked exceeds MAX_VARIANTS (bail out)
 * - Early-exit via `checkFn`: if any generated variant passes, return immediately
 *
 * @param s          The normalized string
 * @param checkFn    Predicate to test each candidate; returns true on match
 * @returns          The matching variant string, or `null` (no match / cap exceeded)
 */
export function generateAndCheckEditDistance1(
  s: string,
  checkFn: (variant: string) => boolean,
): string | null {
  const len = s.length;
  const seen = new Set<string>();

  /** Try a variant; returns 'match' | 'cap' | 'continue' */
  const tryVariant = (v: string): 'match' | 'cap' | 'continue' => {
    if (v === s || seen.has(v)) return 'continue';
    seen.add(v);
    if (seen.size > MAX_VARIANTS) return 'cap';
    return checkFn(v) ? 'match' : 'continue';
  };

  // Deletions
  for (let i = 0; i < len; i++) {
    const v = s.slice(0, i) + s.slice(i + 1);
    const r = tryVariant(v);
    if (r === 'match') return v;
    if (r === 'cap') return null;
  }

  // Substitutions
  for (let i = 0; i < len; i++) {
    for (const c of ALPHABET) {
      if (c !== s[i]) {
        const v = s.slice(0, i) + c + s.slice(i + 1);
        const r = tryVariant(v);
        if (r === 'match') return v;
        if (r === 'cap') return null;
      }
    }
  }

  // Insertions
  for (let i = 0; i <= len; i++) {
    for (const c of ALPHABET) {
      const v = s.slice(0, i) + c + s.slice(i);
      const r = tryVariant(v);
      if (r === 'match') return v;
      if (r === 'cap') return null;
    }
  }

  // Adjacent transpositions
  for (let i = 0; i < len - 1; i++) {
    if (s[i] !== s[i + 1]) {
      const v = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
      const r = tryVariant(v);
      if (r === 'match') return v;
      if (r === 'cap') return null;
    }
  }

  return null;
}

// ─── Main validation ─────────────────────────────────────────────

/**
 * Check if the user's answer matches the hashed correct answer,
 * allowing small variations:
 *
 * Phase 1 — Deterministic candidates (always run):
 *   1a. Basic lowercase+trim  (backward-compatible)
 *   1b. Full normalization    (articles, punctuation, spaces)
 *   1c. Article-stripped only
 *
 * Phase 2 — Fuzzy matching (guarded):
 *   Runs ONLY when ALL conditions are met:
 *     • wordCount <= 2
 *     • normalized.length < FUZZY_SKIP_LENGTH (15)
 *     • normalized.length <= MAX_FUZZY_LENGTH (20)
 *     • normalized matches ALLOWED_CHARS_RE
 *   Variant generation is capped at MAX_VARIANTS (500) at runtime.
 *   Early-exit on first hash match.
 *
 * @param userInput  Raw answer typed by the user
 * @param answerHash SHA-256 hash of the correct (normalized) answer
 * @param answerSalt Salt used when hashing the correct answer
 * @returns true if any candidate matches
 */
export function isAnswerCorrect(
  userInput: string,
  answerHash: string,
  answerSalt: string,
): boolean {
  // ── Phase 1: deterministic candidates ──────────────────────────
  const candidates = new Set<string>();

  // 1a. Basic normalization (same as original code path)
  const basic = userInput.toLowerCase().trim();
  candidates.add(basic);

  // 1b. Full normalization (articles + punctuation + spaces)
  const normalized = normalizeAnswer(userInput);
  candidates.add(normalized);

  // 1c. Article-stripped but otherwise untouched (covers edge cases
  //     where punctuation was part of the stored hash)
  const words = basic.split(/\s+/);
  if (words.length > 1 && ITALIAN_ARTICLES.includes(words[0])) {
    candidates.add(words.slice(1).join(' '));
  }

  // Check deterministic candidates first (fast path, early-exit)
  for (const candidate of candidates) {
    if (verifyHash(candidate, answerHash, answerSalt)) {
      return true;
    }
  }

  // ── Phase 2: fuzzy matching (guarded) ──────────────────────────
  const wordCount = normalized.split(/\s+/).filter((w) => w.length > 0).length;

  if (
    wordCount <= 2 &&
    normalized.length > 0 &&
    normalized.length < FUZZY_SKIP_LENGTH &&
    normalized.length <= MAX_FUZZY_LENGTH &&
    ALLOWED_CHARS_RE.test(normalized)
  ) {
    const match = generateAndCheckEditDistance1(
      normalized,
      (variant) => verifyHash(variant, answerHash, answerSalt),
    );
    if (match !== null) {
      return true;
    }
  }

  return false;
}
