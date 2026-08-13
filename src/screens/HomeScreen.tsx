import { INITIAL_OPEN_LEVELS, WORD_LEVELS } from "../../shared/words";
import { collectionProgress } from "../game/collection";
import { SET_NAMES } from "../game/creatures";
import type { SaveData } from "../game/storage";
import { Shell, BigButton, VoiceDisclosure } from "../components/ui";

interface Props {
  save: SaveData;
  onPickLevel: (levelId: number | null) => void;
  onGallery: () => void;
  onCustomWords: () => void;
}

export function HomeScreen({ save, onPickLevel, onGallery, onCustomWords }: Props) {
  const progress = collectionProgress(save.collection);

  return (
    <Shell>
      <header className="text-center mt-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span aria-hidden="true">⚡</span> Sight Word Spark
        </h1>
        <p className="mt-2 text-white/70 text-lg">Read words. Hatch friends.</p>
      </header>

      {/* Collection teaser — the prize is always visible before playing */}
      <button
        type="button"
        onClick={onGallery}
        className="mt-6 w-full rounded-3xl bg-white/10 hover:bg-white/15 transition p-5 flex items-center justify-between text-left min-h-[72px]"
      >
        <div>
          <p className="text-sm uppercase tracking-wide text-spark-300 font-bold">
            {SET_NAMES[progress.set]}
          </p>
          <p className="text-xl font-bold">
            {progress.found} of {progress.total} creatures found
          </p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          🥚➜🐣
        </span>
      </button>

      <h2 className="mt-8 text-lg font-bold text-white/80">Pick a word trail</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {WORD_LEVELS.map((level) => {
          const locked = level.id > save.unlockedLevel;
          return (
            <button
              key={level.id}
              type="button"
              disabled={locked}
              onClick={() => onPickLevel(level.id)}
              className={`rounded-2xl p-4 text-left min-h-[88px] transition ${
                locked
                  ? "bg-white/5 text-white/40"
                  : "bg-night-700 hover:bg-night-700/80 active:scale-95"
              }`}
              aria-label={
                locked
                  ? `${level.title} — locked. Hatch an egg in Level ${level.id - 1} to open it.`
                  : `${level.title}: words like ${level.words[0].word}, ${level.words[1].word}, ${level.words[2].word}`
              }
            >
              <p className="text-lg font-extrabold">
                {locked && <span aria-hidden="true">🔒 </span>}
                {level.title}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {locked
                  ? `Hatch an egg in Level ${level.id - 1}`
                  : level.words.slice(0, 3).map((w) => w.word).join(" · ")}
              </p>
              {level.id <= INITIAL_OPEN_LEVELS && (
                <p className="sr-only">First hundred words</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BigButton variant="ghost" onClick={onCustomWords}>
          ✏️ My Words{save.customWords.length > 0 ? ` (${save.customWords.length})` : ""}
        </BigButton>
        <BigButton variant="ghost" onClick={onGallery}>
          🏞️ Creature Gallery
        </BigButton>
      </div>

      <VoiceDisclosure />
    </Shell>
  );
}
