// Trail building and in-trail behavior.
//
// A trail is a short run of TRAIL_LENGTH words. Words the child has missed in
// past sessions are gently favored so they come around again — never flagged,
// never punished, just quietly back in rotation. A word missed during the
// trail is re-queued a couple of rounds later so the child gets a fresh,
// low-stakes second try before the egg hatches.

import { CHOICES_PER_ROUND, TRAIL_LENGTH, type WordEntry } from "../../shared/words";
import type { PracticeStats } from "./storage";

export interface TrailRound {
  word: WordEntry;
  /** All choices, shuffled, including the correct word. */
  choices: string[];
  /** True when this round is a gentle retry of a word missed earlier in the trail. */
  isRetry: boolean;
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Similarity used to pick tempting-but-fair lookalike choices. */
function lookalikeScore(target: string, candidate: string): number {
  const t = target.toLowerCase();
  const c = candidate.toLowerCase();
  let score = 0;
  if (t[0] === c[0]) score += 3;
  if (t[t.length - 1] === c[c.length - 1]) score += 2;
  score += Math.max(0, 3 - Math.abs(t.length - c.length));
  const shared = new Set([...t].filter((ch) => c.includes(ch)));
  score += Math.min(shared.size, 4);
  return score;
}

/**
 * Choose the words for a trail: mostly weighted toward words the child has
 * missed before or seen least, with some randomness so trails feel new.
 */
export function pickTrailWords(
  pool: WordEntry[],
  practice: Record<string, PracticeStats>,
  length: number = TRAIL_LENGTH,
  random: () => number = Math.random,
): WordEntry[] {
  const weighted = pool.map((entry) => {
    const stats = practice[entry.word];
    const missedBoost = stats ? Math.min(stats.missed, 4) * 3 : 0;
    const noveltyBoost = stats ? Math.max(0, 3 - stats.seen) : 3;
    return { entry, weight: 1 + missedBoost + noveltyBoost + random() * 4 };
  });
  weighted.sort((a, b) => b.weight - a.weight);
  return weighted.slice(0, Math.min(length, pool.length)).map((w) => w.entry);
}

/** Build the multiple-choice options for one round. */
export function buildChoices(
  target: WordEntry,
  pool: WordEntry[],
  count: number = CHOICES_PER_ROUND,
  random: () => number = Math.random,
): string[] {
  const others = pool
    .map((e) => e.word)
    .filter((w) => w.toLowerCase() !== target.word.toLowerCase());
  const ranked = shuffle(others, random)
    .map((w) => ({ w, s: lookalikeScore(target.word, w) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count - 1)
    .map((x) => x.w);
  return shuffle([target.word, ...ranked], random);
}

export function buildTrail(
  pool: WordEntry[],
  practice: Record<string, PracticeStats>,
  random: () => number = Math.random,
  /** Extra words to draw lookalike choices from (used for short custom lists). */
  distractorPool: WordEntry[] = pool,
): TrailRound[] {
  const words = pickTrailWords(pool, practice, TRAIL_LENGTH, random);
  return words.map((word) => ({
    word,
    choices: buildChoices(word, distractorPool, CHOICES_PER_ROUND, random),
    isRetry: false,
  }));
}

/**
 * Re-queue a missed word so it returns a little later in the trail
 * (2 rounds ahead, or at the end if the trail is nearly over). The trail
 * grows by one round; the egg still needs the same number of correct answers.
 */
export function requeueMissedWord(
  rounds: TrailRound[],
  currentIndex: number,
  pool: WordEntry[],
  random: () => number = Math.random,
): TrailRound[] {
  const missed = rounds[currentIndex];
  // One retry per word: a missed retry ends gently instead of looping forever.
  if (missed.isRetry) return rounds;
  const alreadyRetried = rounds.some(
    (r, i) => i > currentIndex && r.isRetry && r.word.word === missed.word.word,
  );
  if (alreadyRetried) return rounds;
  const retry: TrailRound = {
    word: missed.word,
    choices: buildChoices(missed.word, pool, CHOICES_PER_ROUND, random),
    isRetry: true,
  };
  const insertAt = Math.min(currentIndex + 3, rounds.length);
  const next = rounds.slice();
  next.splice(insertAt, 0, retry);
  return next;
}
