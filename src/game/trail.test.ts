import { describe, expect, it } from "vitest";
import { CHOICES_PER_ROUND, TRAIL_LENGTH, WORD_LEVELS } from "../../shared/words";
import { buildChoices, buildTrail, pickTrailWords, requeueMissedWord } from "./trail";

const pool = WORD_LEVELS[0].words;

describe("buildTrail", () => {
  it("builds TRAIL_LENGTH rounds with unique words", () => {
    const trail = buildTrail(pool, {});
    expect(trail).toHaveLength(TRAIL_LENGTH);
    const words = trail.map((r) => r.word.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it("every round's choices include the target exactly once, no duplicates", () => {
    const trail = buildTrail(pool, {});
    for (const round of trail) {
      expect(round.choices).toHaveLength(CHOICES_PER_ROUND);
      expect(round.choices.filter((c) => c === round.word.word)).toHaveLength(1);
      expect(new Set(round.choices).size).toBe(round.choices.length);
    }
  });

  it("works with a pool smaller than the trail (short custom lists)", () => {
    const tiny = [{ word: "cat" }, { word: "dog" }];
    const trail = buildTrail(tiny, {}, Math.random, [...tiny, ...pool]);
    expect(trail).toHaveLength(2);
    for (const round of trail) {
      expect(round.choices).toContain(round.word.word);
      expect(round.choices).toHaveLength(CHOICES_PER_ROUND);
    }
  });
});

describe("pickTrailWords", () => {
  it("favors words missed in past sessions", () => {
    const practice = Object.fromEntries(
      pool.map((w) => [w.word, { seen: 10, missed: 0 }]),
    );
    practice["was"] = { seen: 10, missed: 4 };
    practice["they"] = { seen: 10, missed: 4 };
    let hits = 0;
    for (let i = 0; i < 25; i++) {
      const chosen = pickTrailWords(pool, practice).map((w) => w.word);
      if (chosen.includes("was")) hits++;
      if (chosen.includes("they")) hits++;
    }
    // With a heavy missed boost these should be selected nearly always.
    expect(hits).toBeGreaterThan(40);
  });
});

describe("requeueMissedWord", () => {
  it("re-queues the missed word a few rounds later, exactly once", () => {
    const trail = buildTrail(pool, {});
    const withRetry = requeueMissedWord(trail, 0, pool);
    expect(withRetry).toHaveLength(trail.length + 1);
    expect(withRetry[3].word.word).toBe(trail[0].word.word);
    expect(withRetry[3].isRetry).toBe(true);
    // A second miss of the same round does not add another retry.
    expect(requeueMissedWord(withRetry, 0, pool)).toHaveLength(withRetry.length);
  });

  it("a missed retry never re-queues itself — trails always end", () => {
    const trail = buildTrail(pool, {});
    const withRetry = requeueMissedWord(trail, 0, pool);
    const retryIndex = withRetry.findIndex((r) => r.isRetry);
    expect(requeueMissedWord(withRetry, retryIndex, pool)).toHaveLength(withRetry.length);
  });

  it("caps total rounds at twice the trail even when every word is missed", () => {
    let rounds = buildTrail(pool, {});
    const base = rounds.length;
    for (let i = 0; i < rounds.length && i < base * 2; i++) {
      rounds = requeueMissedWord(rounds, i, pool);
    }
    expect(rounds.length).toBeLessThanOrEqual(base * 2);
  });

  it("appends at the end when the trail is nearly over", () => {
    const trail = buildTrail(pool, {});
    const last = trail.length - 1;
    const withRetry = requeueMissedWord(trail, last, pool);
    expect(withRetry).toHaveLength(trail.length + 1);
    expect(withRetry[withRetry.length - 1].word.word).toBe(trail[last].word.word);
  });
});

describe("buildChoices", () => {
  it("never repeats the target among distractors (case-insensitive)", () => {
    const choices = buildChoices({ word: "I" }, pool);
    expect(choices.filter((c) => c.toLowerCase() === "i")).toHaveLength(1);
  });
});
