// The collection gallery: discovered friends in color, mysteries as
// silhouettes, and progress like "4 of 12" per set. Set 2 stays a rumor
// until every set 1 creature has hatched.

import { discoveredIds, setComplete } from "../game/collection";
import { creaturesInSet, SET_NAMES } from "../game/creatures";
import type { CollectedCreature } from "../game/storage";
import { CreatureArt } from "../components/CreatureArt";
import { Shell, BackButton } from "../components/ui";

interface Props {
  collection: CollectedCreature[];
  onBack: () => void;
}

function SetSection({ set, collection }: { set: 1 | 2; collection: CollectedCreature[] }) {
  const found = discoveredIds(collection);
  const creatures = creaturesInSet(set);
  const foundCount = creatures.filter((c) => found.has(c.id)).length;

  return (
    <section className="mt-8" aria-label={`${SET_NAMES[set]} collection`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">{SET_NAMES[set]}</h2>
        <p className="text-spark-300 font-bold">
          {foundCount} of {creatures.length}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
        {creatures.map((c) => {
          const isFound = found.has(c.id);
          return (
            <div
              key={c.id}
              className="rounded-2xl bg-white/5 p-3 flex flex-col items-center"
            >
              <CreatureArt
                spec={c}
                silhouette={!isFound}
                className={`w-full aspect-square ${isFound ? "" : "opacity-70"}`}
                label={isFound ? `${c.name} ${c.species}` : "Not discovered yet"}
              />
              <p className={`mt-1 text-sm font-bold ${isFound ? "" : "text-white/40"}`}>
                {isFound ? c.name : "???"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function GalleryScreen({ collection, onBack }: Props) {
  const firstSetDone = setComplete(collection, 1);

  return (
    <Shell>
      <BackButton onClick={onBack} />
      <h1 className="mt-4 text-3xl font-extrabold text-center">My Creatures</h1>
      <SetSection set={1} collection={collection} />
      {firstSetDone ? (
        <SetSection set={2} collection={collection} />
      ) : (
        <p className="mt-8 rounded-2xl bg-white/5 p-5 text-center text-white/60">
          <span aria-hidden="true">✨ </span>
          Find every {SET_NAMES[1]} friend to discover the {SET_NAMES[2]}…
        </p>
      )}
    </Shell>
  );
}
