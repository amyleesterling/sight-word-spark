// The payoff: the egg hatches and a named friend joins the collection forever.

import { useEffect, useState } from "react";
import { collectionProgress } from "../game/collection";
import { SET_NAMES, type CreatureSpec } from "../game/creatures";
import type { CollectedCreature } from "../game/storage";
import { CreatureArt } from "../components/CreatureArt";
import { Shell, BigButton } from "../components/ui";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface Props {
  creature: CreatureSpec;
  wasNew: boolean;
  collection: CollectedCreature[];
  onPlayAgain: () => void;
  onGallery: () => void;
  onHome: () => void;
}

export function HatchScreen({ creature, wasNew, collection, onPlayAgain, onGallery, onHome }: Props) {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(reducedMotion);
  const progress = collectionProgress(collection);

  // A short beat of anticipation, then the reveal (skipped for reduced motion).
  useEffect(() => {
    if (revealed) return;
    const t = window.setTimeout(() => setRevealed(true), 700);
    return () => window.clearTimeout(t);
  }, [revealed]);

  return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {revealed ? (
          <>
            <div className="motion-safe:animate-pop-in">
              <CreatureArt spec={creature} className="w-52 h-52 sm:w-64 sm:h-64" />
            </div>
            <p className="mt-2 text-spark-300 font-extrabold uppercase tracking-widest">
              {wasNew ? "New friend!" : "Back for a visit!"}
            </p>
            <h1 className="mt-1 text-4xl font-extrabold">{creature.name}</h1>
            <p className="text-xl text-white/80">{creature.species}</p>
            <p className="mt-4 rounded-full bg-white/10 px-5 py-2 text-white/80 font-semibold">
              {SET_NAMES[progress.set]}: {progress.found} of {progress.total} found
            </p>
            <div className="mt-8 w-full max-w-xs flex flex-col gap-3">
              <BigButton onClick={onPlayAgain} autoFocus>
                Hatch another egg! 🥚
              </BigButton>
              <BigButton variant="ghost" onClick={onGallery}>
                See my collection
              </BigButton>
              <BigButton variant="ghost" onClick={onHome}>
                Home
              </BigButton>
            </div>
          </>
        ) : (
          <>
            <div className="text-8xl motion-safe:animate-wobble" aria-hidden="true">
              🥚
            </div>
            <h1 className="mt-6 text-3xl font-extrabold">It's hatching…</h1>
          </>
        )}
      </div>
    </Shell>
  );
}
