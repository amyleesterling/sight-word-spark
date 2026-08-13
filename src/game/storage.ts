// Versioned localStorage persistence. Everything the game needs to remember —
// the creature collection, unlocked levels, practice memory, custom words —
// lives in one JSON blob under STORAGE_KEY with an explicit schema version,
// so future changes migrate instead of wiping a child's collection.

export const STORAGE_KEY = "sight-word-spark:save";
export const CURRENT_VERSION = 2;

export interface CollectedCreature {
  id: string;
  discoveredAt: number;
}

export interface PracticeStats {
  seen: number;
  missed: number;
}

export interface SaveData {
  version: typeof CURRENT_VERSION;
  collection: CollectedCreature[];
  /** Highest word level the player has unlocked (levels 1..INITIAL_OPEN_LEVELS are always open). */
  unlockedLevel: number;
  trailsCompleted: number;
  /** Per-word practice memory; missed words come back sooner, gently. */
  practice: Record<string, PracticeStats>;
  customWords: string[];
}

export function freshSave(initialOpenLevels: number): SaveData {
  return {
    version: CURRENT_VERSION,
    collection: [],
    unlockedLevel: initialOpenLevels,
    trailsCompleted: 0,
    practice: {},
    customWords: [],
  };
}

/**
 * Parse + migrate a raw stored string into a valid SaveData.
 * Unknown or corrupt data falls back to a fresh save rather than crashing.
 */
export function migrateSave(raw: string | null, initialOpenLevels: number): SaveData {
  const fresh = freshSave(initialOpenLevels);
  if (!raw) return fresh;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fresh;
  }
  if (typeof parsed !== "object" || parsed === null) return fresh;
  const data = parsed as Record<string, unknown>;

  // Version 1 (the original star-based game) had no collection; carry over
  // anything recognizable and start the collection empty.
  const version = typeof data.version === "number" ? data.version : 1;

  const collection: CollectedCreature[] = Array.isArray(data.collection)
    ? data.collection.filter(
        (e): e is CollectedCreature =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as CollectedCreature).id === "string" &&
          typeof (e as CollectedCreature).discoveredAt === "number",
      )
    : [];

  // De-duplicate collection entries defensively (keep earliest discovery).
  const seen = new Set<string>();
  const dedupedCollection = collection.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const practice: Record<string, PracticeStats> = {};
  if (typeof data.practice === "object" && data.practice !== null) {
    for (const [word, stats] of Object.entries(data.practice as Record<string, unknown>)) {
      if (
        typeof stats === "object" &&
        stats !== null &&
        typeof (stats as PracticeStats).seen === "number" &&
        typeof (stats as PracticeStats).missed === "number"
      ) {
        practice[word] = {
          seen: (stats as PracticeStats).seen,
          missed: (stats as PracticeStats).missed,
        };
      }
    }
  }

  return {
    version: CURRENT_VERSION,
    collection: dedupedCollection,
    unlockedLevel: Math.max(
      initialOpenLevels,
      typeof data.unlockedLevel === "number" ? data.unlockedLevel : initialOpenLevels,
    ),
    trailsCompleted:
      typeof data.trailsCompleted === "number" && data.trailsCompleted >= 0
        ? data.trailsCompleted
        : version === 1
          ? 0
          : 0,
    practice,
    customWords: Array.isArray(data.customWords)
      ? data.customWords.filter((w): w is string => typeof w === "string")
      : [],
  };
}

export function loadSave(initialOpenLevels: number): SaveData {
  try {
    return migrateSave(localStorage.getItem(STORAGE_KEY), initialOpenLevels);
  } catch {
    // localStorage can throw in private browsing edge cases
    return freshSave(initialOpenLevels);
  }
}

export function persistSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — the session still works, it just won't persist.
  }
}
