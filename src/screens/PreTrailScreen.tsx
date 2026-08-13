// The promise screen: before playing, the child sees exactly what they can
// earn — a mystery egg that hatches after finding the trail's words.

import { collectionProgress } from "../game/collection";
import type { CreatureSpec } from "../game/creatures";
import { SET_NAMES } from "../game/creatures";
import type { CollectedCreature } from "../game/storage";
import { wordAudio } from "../game/audio";
import { Egg } from "../components/Egg";
import { Shell, BigButton, BackButton, VoiceDisclosure } from "../components/ui";

interface Props {
  creature: CreatureSpec;
  collection: CollectedCreature[];
  wordCount: number;
  onStart: () => void;
  onBack: () => void;
}

export function PreTrailScreen({ creature, collection, wordCount, onStart, onBack }: Props) {
  const progress = collectionProgress(collection);

  return (
    <Shell>
      <BackButton onClick={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="motion-safe:animate-floaty">
          <Egg
            stage={0}
            total={wordCount}
            shell={creature.egg.shell}
            speckle={creature.egg.speckle}
            className="h-[clamp(160px,30vh,240px)] aspect-[6/7]"
          />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold">A mystery friend is inside!</h1>
        <p className="mt-3 text-xl text-white/80 max-w-sm">
          Find <span className="font-extrabold text-spark-300">{wordCount} words</span> to crack
          this egg and meet them.
        </p>
        <p className="mt-4 text-sm text-white/60">
          {SET_NAMES[progress.set]}: {progress.found} of {progress.total} found so far
        </p>
        <BigButton
          className="mt-8 w-full max-w-xs"
          onClick={() => {
            // Unlock audio inside this tap so iOS lets every round speak.
            wordAudio.unlock();
            onStart();
          }}
          autoFocus
        >
          Let's hatch it! 🥚
        </BigButton>
      </div>
      <VoiceDisclosure />
    </Shell>
  );
}
