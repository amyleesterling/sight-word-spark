// The "hear the word" button. Reflects the audio manager's state and offers a
// calm retry when speech generation fails — never a robotic fallback voice.

import { useEffect, useState } from "react";
import { wordAudio, type AudioState } from "../game/audio";

interface Props {
  word: string;
  className?: string;
}

export function SpeakerButton({ word, className = "" }: Props) {
  const [state, setState] = useState<AudioState>(wordAudio.getState());

  useEffect(() => wordAudio.onStateChange(setState), []);

  const isError = state === "error";
  const isLoading = state === "loading";

  return (
    <button
      type="button"
      onClick={() => void wordAudio.play(word)}
      aria-label={isError ? "The voice had trouble — tap to try again" : "Hear the word again"}
      className={`flex items-center gap-3 rounded-2xl px-6 py-4 min-h-[64px] text-lg font-bold transition active:scale-95 ${
        isError
          ? "bg-white/10 text-white border-2 border-dashed border-white/40"
          : "bg-white/15 text-white hover:bg-white/20"
      } ${className}`}
    >
      <span aria-hidden="true" className={`text-3xl ${isLoading ? "motion-safe:animate-pulse" : ""}`}>
        {isError ? "🔇" : "🔊"}
      </span>
      <span>{isError ? "Hmm, let's try that again" : isLoading ? "Getting ready…" : "Hear it again"}</span>
    </button>
  );
}
