// The word trail. Hear a word, find it among lookalikes, crack the egg.
//
// Gentle correction: a wrong tap never costs anything. The wrong card quietly
// fades, the word is replayed, and after a second miss the right card glows
// so the round always ends in success. Missed words are re-queued a little
// later in the trail for one friendly retry, and remembered across sessions.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WordEntry } from "../../shared/words";
import { buildTrail, requeueMissedWord, type TrailRound } from "../game/trail";
import type { CreatureSpec } from "../game/creatures";
import type { PracticeStats } from "../game/storage";
import { wordAudio } from "../game/audio";
import { Egg } from "../components/Egg";
import { SpeakerButton } from "../components/SpeakerButton";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface Props {
  pool: WordEntry[];
  distractorPool?: WordEntry[];
  practice: Record<string, PracticeStats>;
  creature: CreatureSpec;
  onWordSeen: (word: string, missed: boolean) => void;
  onComplete: () => void;
  onExit: () => void;
}

const CELEBRATE_MS = 950;

export function PlayScreen({
  pool,
  distractorPool,
  practice,
  creature,
  onWordSeen,
  onComplete,
  onExit,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [rounds, setRounds] = useState<TrailRound[]>(() =>
    buildTrail(pool, practice, Math.random, distractorPool ?? pool),
  );
  const [index, setIndex] = useState(0);
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [phase, setPhase] = useState<"answer" | "celebrate">("answer");
  const [justCracked, setJustCracked] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  const round = rounds[index];
  const total = rounds.length;

  // Say the word when a round starts and warm the next words' audio.
  useEffect(() => {
    if (!round) return;
    void wordAudio.play(round.word.word);
    for (const upcoming of rounds.slice(index + 1, index + 3)) {
      wordAudio.preload(upcoming.word.word);
    }
    // rounds can grow behind us (requeues); replaying on that change would be jarring.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(
    () => () => {
      wordAudio.stop();
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const advance = useCallback(() => {
    setJustCracked(false);
    setWrongChoices([]);
    setMissCount(0);
    setPhase("answer");
    setIndex((i) => i + 1);
  }, []);

  const handleChoice = useCallback(
    (choice: string) => {
      if (!round || phase !== "answer") return;

      if (choice === round.word.word) {
        onWordSeen(round.word.word, missCount > 0);
        setPhase("celebrate");
        setJustCracked(true);
        const isLast = index + 1 >= rounds.length;
        advanceTimer.current = window.setTimeout(
          () => {
            if (isLast) onComplete();
            else advance();
          },
          reducedMotion ? 500 : CELEBRATE_MS,
        );
        return;
      }

      // Gentle correction: no lost progress, just another listen.
      setWrongChoices((w) => (w.includes(choice) ? w : [...w, choice]));
      setMissCount((m) => m + 1);
      if (missCount === 0) {
        setRounds((r) => requeueMissedWord(r, index, distractorPool ?? pool));
      }
      void wordAudio.play(round.word.word);
    },
    [round, phase, missCount, index, rounds.length, pool, distractorPool, onWordSeen, onComplete, advance, reducedMotion],
  );

  // Keyboard: 1-4 pick a word, R replays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!round) return;
      const n = Number(e.key);
      if (n >= 1 && n <= round.choices.length) {
        handleChoice(round.choices[n - 1]);
      } else if (e.key.toLowerCase() === "r") {
        void wordAudio.play(round.word.word);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [round, handleChoice]);

  const eggStage = useMemo(
    () => (phase === "celebrate" ? index + 1 : index),
    [phase, index],
  );

  if (!round) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-4">
      <div className="w-full max-w-xl flex-1 flex flex-col">
        {/* header: exit + progress */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl bg-white/10 px-4 py-2 text-base font-semibold hover:bg-white/15 min-h-[44px]"
          >
            ✕ Stop
          </button>
          <p className="text-white/70 font-bold" aria-live="polite">
            Word {Math.min(index + 1, total)} of {total}
          </p>
        </div>

        {/* the egg being charged */}
        <div className="flex justify-center mt-2">
          <Egg
            stage={eggStage}
            total={total}
            shell={creature.egg.shell}
            speckle={creature.egg.speckle}
            justCracked={justCracked && !reducedMotion}
            className="w-32 h-40 sm:w-36 sm:h-44"
          />
        </div>

        <div className="flex justify-center mt-3">
          <SpeakerButton word={round.word.word} />
        </div>

        <p className="text-center mt-4 text-lg text-white/75 min-h-[28px]" aria-live="polite">
          {phase === "celebrate"
            ? round.isRetry
              ? "You got it this time! ✨"
              : "Yes! The egg is cracking! ✨"
            : missCount === 0
              ? "Tap the word you hear"
              : missCount === 1
                ? "Almost! Listen once more…"
                : "Look for the glowing word!"}
        </p>

        {/* word choices */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {round.choices.map((choice, i) => {
            const isWrong = wrongChoices.includes(choice);
            const isCorrect = choice === round.word.word;
            const hint = missCount >= 2 && isCorrect;
            const celebrated = phase === "celebrate" && isCorrect;
            return (
              <button
                key={`${index}-${choice}`}
                type="button"
                onClick={() => handleChoice(choice)}
                disabled={isWrong || phase === "celebrate"}
                className={`rounded-2xl px-4 py-6 text-3xl font-extrabold transition min-h-[80px] ${
                  celebrated
                    ? "bg-spark-400 text-night-900 motion-safe:animate-pop-in"
                    : isWrong
                      ? "bg-white/5 text-white/25"
                      : hint
                        ? "bg-night-700 ring-4 ring-spark-400 motion-safe:animate-pulse"
                        : "bg-night-700 hover:bg-night-700/80 active:scale-95"
                }`}
                aria-label={`Choice ${i + 1}: ${choice}`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-white/40 mt-4 hidden sm:block">
          Keyboard: press 1–{round.choices.length} to choose, R to hear the word again
        </p>
      </div>
    </div>
  );
}
