// Tiny shared UI pieces: buttons and screen scaffolding.

import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export function BigButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  autoFocus,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const styles =
    variant === "primary"
      ? "bg-spark-400 text-night-900 hover:bg-spark-300 active:scale-95 shadow-lg shadow-spark-500/20"
      : "bg-white/10 text-white hover:bg-white/15 active:scale-95";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`rounded-2xl px-6 py-4 text-xl font-bold transition motion-safe:duration-150 min-h-[56px] disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start rounded-xl bg-white/10 px-4 py-2 text-base font-semibold text-white/90 hover:bg-white/15 min-h-[44px]"
    >
      ← {label}
    </button>
  );
}

export function VoiceDisclosure() {
  return (
    <p className="text-center text-xs text-white/50 mt-6">
      Words are read aloud by an AI-generated voice.
    </p>
  );
}
