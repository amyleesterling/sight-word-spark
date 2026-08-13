import { useCallback, useState } from "react";
import { CHOICES_PER_ROUND, TRAIL_LENGTH, WORD_LEVELS, type WordEntry } from "../shared/words";
import { pickNextCreature } from "./game/collection";
import type { CreatureSpec } from "./game/creatures";
import { useSave } from "./hooks/useSave";
import { HomeScreen } from "./screens/HomeScreen";
import { PreTrailScreen } from "./screens/PreTrailScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { HatchScreen } from "./screens/HatchScreen";
import { GalleryScreen } from "./screens/GalleryScreen";
import { CustomWordsScreen } from "./screens/CustomWordsScreen";
import { GrownUpsScreen } from "./screens/GrownUpsScreen";

/** levelId null means "my words" (the custom list). */
type Screen =
  | { kind: "home" }
  | { kind: "pretrail"; levelId: number | null; creature: CreatureSpec }
  | { kind: "play"; levelId: number | null; creature: CreatureSpec }
  | { kind: "hatch"; levelId: number | null; creature: CreatureSpec; wasNew: boolean }
  | { kind: "gallery" }
  | { kind: "custom" }
  | { kind: "grownups" };

function levelPool(levelId: number | null, customWords: string[]): WordEntry[] {
  if (levelId === null) return customWords.map((word) => ({ word }));
  return WORD_LEVELS.find((l) => l.id === levelId)?.words ?? [];
}

/** Short custom lists borrow easy words so every round still has full choices. */
function distractorPool(levelId: number | null, pool: WordEntry[]): WordEntry[] {
  if (levelId !== null || pool.length >= CHOICES_PER_ROUND) return pool;
  return [...pool, ...WORD_LEVELS[0].words];
}

export function App() {
  const { save, awardCreature, recordTrailComplete, recordWordSeen, setCustomWords } = useSave();
  const [screen, setScreen] = useState<Screen>({ kind: "home" });

  const goHome = useCallback(() => setScreen({ kind: "home" }), []);

  const startPreTrail = useCallback(
    (levelId: number | null) => {
      // Pick the mystery creature now so the egg's colors foreshadow the prize.
      setScreen({ kind: "pretrail", levelId, creature: pickNextCreature(save.collection) });
    },
    [save.collection],
  );

  const handleTrailComplete = useCallback(
    (levelId: number | null, creature: CreatureSpec) => {
      const wasNew = !save.collection.some((c) => c.id === creature.id);
      recordTrailComplete(levelId);
      awardCreature(creature.id);
      setScreen({ kind: "hatch", levelId, creature, wasNew });
    },
    [awardCreature, recordTrailComplete, save.collection],
  );

  switch (screen.kind) {
    case "home":
      return (
        <HomeScreen
          save={save}
          onPickLevel={startPreTrail}
          onGallery={() => setScreen({ kind: "gallery" })}
          onCustomWords={() => setScreen({ kind: "custom" })}
          onGrownUps={() => setScreen({ kind: "grownups" })}
        />
      );
    case "pretrail":
      return (
        <PreTrailScreen
          creature={screen.creature}
          collection={save.collection}
          wordCount={Math.min(TRAIL_LENGTH, levelPool(screen.levelId, save.customWords).length)}
          onStart={() =>
            setScreen({ kind: "play", levelId: screen.levelId, creature: screen.creature })
          }
          onBack={goHome}
        />
      );
    case "play":
      return (
        <PlayScreen
          pool={levelPool(screen.levelId, save.customWords)}
          distractorPool={distractorPool(
            screen.levelId,
            levelPool(screen.levelId, save.customWords),
          )}
          practice={save.practice}
          creature={screen.creature}
          onWordSeen={recordWordSeen}
          onComplete={() => handleTrailComplete(screen.levelId, screen.creature)}
          onExit={goHome}
        />
      );
    case "hatch":
      return (
        <HatchScreen
          creature={screen.creature}
          wasNew={screen.wasNew}
          collection={save.collection}
          onPlayAgain={() => startPreTrail(screen.levelId)}
          onGallery={() => setScreen({ kind: "gallery" })}
          onHome={goHome}
        />
      );
    case "gallery":
      return <GalleryScreen collection={save.collection} onBack={goHome} />;
    case "custom":
      return (
        <CustomWordsScreen
          words={save.customWords}
          onSave={setCustomWords}
          onBack={goHome}
          onPlay={() => startPreTrail(null)}
        />
      );
    case "grownups":
      return <GrownUpsScreen onBack={goHome} />;
  }
}
