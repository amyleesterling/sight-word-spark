import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_OPEN_LEVELS, WORD_LEVELS } from "../../shared/words";
import {
  loadSave,
  persistSave,
  type SaveData,
} from "../game/storage";

/** Single source of truth for persistent state; writes through to localStorage. */
export function useSave() {
  const [save, setSave] = useState<SaveData>(() => loadSave(INITIAL_OPEN_LEVELS));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    persistSave(save);
  }, [save]);

  const awardCreature = useCallback((creatureId: string) => {
    setSave((s) => {
      if (s.collection.some((c) => c.id === creatureId)) return s;
      return {
        ...s,
        collection: [...s.collection, { id: creatureId, discoveredAt: Date.now() }],
      };
    });
  }, []);

  const recordTrailComplete = useCallback((levelId: number | null) => {
    setSave((s) => ({
      ...s,
      trailsCompleted: s.trailsCompleted + 1,
      unlockedLevel:
        levelId !== null && levelId === s.unlockedLevel && s.unlockedLevel < WORD_LEVELS.length
          ? s.unlockedLevel + 1
          : s.unlockedLevel,
    }));
  }, []);

  const recordWordSeen = useCallback((word: string, missed: boolean) => {
    setSave((s) => {
      const stats = s.practice[word] ?? { seen: 0, missed: 0 };
      return {
        ...s,
        practice: {
          ...s.practice,
          [word]: { seen: stats.seen + 1, missed: stats.missed + (missed ? 1 : 0) },
        },
      };
    });
  }, []);

  const setCustomWords = useCallback((words: string[]) => {
    setSave((s) => ({ ...s, customWords: words }));
  }, []);

  return { save, awardCreature, recordTrailComplete, recordWordSeen, setCustomWords };
}
