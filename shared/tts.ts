// Shared TTS contract used by the Cloudflare Pages Function (functions/api/tts.ts),
// the local dev middleware (server/dev-tts-plugin.ts), and the client.
// The OPENAI_API_KEY lives only on the server side of this contract.

import { ALL_WORDS, PRONUNCIATIONS } from "./words";

/** Bump when voice/instructions change so caches regenerate. */
export const TTS_CACHE_VERSION = "v1";

export const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";
// Official docs recommend marin or cedar for best quality; marin first.
export const DEFAULT_TTS_VOICE = "marin";

export const VOICE_INSTRUCTIONS =
  "You are a warm, lively, encouraging reading teacher recording flashcard audio for a " +
  "six-to-seven-year-old. Say the single word clearly at a relaxed pace, with natural, " +
  "friendly energy. Do not exaggerate or use sing-song preschool speech. Do not add any " +
  "other words, sounds, or punctuation — say only the word itself.";

/** Words may contain letters, an apostrophe or hyphen; 1–24 chars. */
const WORD_RE = /^[A-Za-z][A-Za-z'-]{0,23}$/;

export function isValidWord(word: unknown): word is string {
  return typeof word === "string" && WORD_RE.test(word);
}

const KNOWN_WORDS = new Set(ALL_WORDS.map((w) => w.word.toLowerCase()));

export function isKnownWord(word: string): boolean {
  return KNOWN_WORDS.has(word.toLowerCase());
}

/**
 * The text actually spoken for a word: pronunciation metadata wins,
 * so homographs like "read" and "live" are said the way the game scores them.
 */
export function spokenFormOf(word: string): string {
  return PRONUNCIATIONS[word.toLowerCase()] ?? word;
}

/** Stable cache key for a word's audio. */
export function ttsCacheKey(word: string, voice: string = DEFAULT_TTS_VOICE): string {
  return `tts/${TTS_CACHE_VERSION}/${voice}/${word.toLowerCase()}`;
}

export interface TtsRequestBody {
  word: string;
}

export interface TtsValidationResult {
  ok: boolean;
  word?: string;
  /** true when the word is one of the built-in Fry words (cache forever). */
  known?: boolean;
  error?: string;
}

export function validateTtsRequest(body: unknown): TtsValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body" };
  }
  const word = (body as Record<string, unknown>).word;
  if (!isValidWord(word)) {
    return {
      ok: false,
      error: "Word must be 1-24 letters (apostrophe or hyphen allowed)",
    };
  }
  const normalized = word === "I" ? "I" : word.toLowerCase();
  return { ok: true, word: normalized, known: isKnownWord(normalized) };
}

/** Body for the OpenAI /v1/audio/speech call. */
export function buildOpenAiSpeechRequest(
  word: string,
  model: string = DEFAULT_TTS_MODEL,
  voice: string = DEFAULT_TTS_VOICE,
) {
  return {
    model,
    voice,
    input: spokenFormOf(word),
    instructions: VOICE_INSTRUCTIONS,
    response_format: "mp3" as const,
  };
}
