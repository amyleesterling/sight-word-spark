// Client audio manager for the AI voice.
//
// - Fetches mp3s from the protected /api/tts endpoint (the key stays server-side).
// - Caches aggressively: in-memory object URLs + the Cache Storage API so a
//   word is fetched at most once per device per cache version.
// - Preloads upcoming words while the current round plays.
// - One shared <audio> element: replay taps cancel the previous playback
//   instead of overlapping, and iOS Safari keeps allowing programmatic play
//   once the element has been unlocked inside a real tap.
// - On failure it reports a calm, retryable error state. There is deliberately
//   no window.speechSynthesis fallback.

import { ttsCacheKey } from "../../shared/tts";

export type AudioState = "idle" | "loading" | "playing" | "error";

const CACHE_NAME = "sight-word-spark-tts";

// A tiny silent wav used to unlock the audio element inside a user gesture.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

export class WordAudio {
  private objectUrls = new Map<string, string>();
  private inflight = new Map<string, Promise<string>>();
  private element: HTMLAudioElement | null = null;
  private playToken = 0;
  private listeners = new Set<(state: AudioState) => void>();
  private state: AudioState = "idle";
  private unlocked = false;

  onStateChange(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    return this.state;
  }

  private setState(state: AudioState) {
    if (this.state === state) return;
    this.state = state;
    this.listeners.forEach((l) => l(state));
  }

  private getElement(): HTMLAudioElement {
    if (!this.element) {
      this.element = new Audio();
      this.element.preload = "auto";
      this.element.addEventListener("ended", () => {
        this.setState("idle");
      });
    }
    return this.element;
  }

  /**
   * Call from inside a real user gesture (the Start button) so iOS Safari
   * lets later rounds start audio without a tap on every word.
   */
  unlock(): void {
    if (this.unlocked) return;
    const el = this.getElement();
    el.src = SILENT_WAV;
    const attempt = el.play();
    if (attempt) {
      attempt
        .then(() => {
          el.pause();
          this.unlocked = true;
        })
        .catch(() => {
          // If unlock fails we still try normal playback later.
        });
    }
  }

  /** Fetch (or reuse) the audio for a word and return an object URL. */
  private async ensureAudio(word: string): Promise<string> {
    const key = ttsCacheKey(word);
    const existing = this.objectUrls.get(key);
    if (existing) return existing;
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const task = (async () => {
      let blob: Blob | null = null;

      // 1. Persistent cache (survives reloads; supported by iOS Safari).
      if (typeof caches !== "undefined") {
        try {
          const cache = await caches.open(CACHE_NAME);
          const hit = await cache.match(`/${key}`);
          if (hit) blob = await hit.blob();
        } catch {
          // cache unavailable (private mode) — fall through to network
        }
      }

      // 2. Network.
      if (!blob) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word }),
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        blob = await res.blob();
        if (typeof caches !== "undefined") {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(
              `/${key}`,
              new Response(blob, { headers: { "Content-Type": "audio/mpeg" } }),
            );
          } catch {
            // best-effort persistence
          }
        }
      }

      const url = URL.createObjectURL(blob);
      this.objectUrls.set(key, url);
      return url;
    })();

    this.inflight.set(key, task);
    try {
      return await task;
    } finally {
      this.inflight.delete(key);
    }
  }

  /** Warm the cache for an upcoming word without playing it. */
  preload(word: string): void {
    this.ensureAudio(word).catch(() => {
      // Preload failures are silent; play() will surface a retryable error.
    });
  }

  /**
   * Play a word. Any playback already in progress is cancelled first, so
   * mashing Replay never overlaps voices.
   */
  async play(word: string): Promise<void> {
    const token = ++this.playToken;
    const el = this.getElement();
    el.pause();
    this.setState("loading");

    let url: string;
    try {
      url = await this.ensureAudio(word);
    } catch {
      if (token === this.playToken) this.setState("error");
      return;
    }
    if (token !== this.playToken) return; // superseded by a newer play()

    try {
      el.src = url;
      el.currentTime = 0;
      this.setState("playing");
      await el.play();
    } catch (err) {
      // AbortError just means a newer play() took over — not a real failure.
      if (token === this.playToken && (err as DOMException)?.name !== "AbortError") {
        this.setState("error");
      }
    }
  }

  stop(): void {
    this.playToken++;
    this.element?.pause();
    this.setState("idle");
  }
}

export const wordAudio = new WordAudio();
