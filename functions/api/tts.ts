// Cloudflare Pages Function: POST /api/tts  { word: string } -> audio/mpeg
//
// The OpenAI key is read from the OPENAI_API_KEY environment variable configured
// on the hosting environment. It never reaches the client: the browser only ever
// sees this endpoint and the mp3 bytes it returns.

import {
  buildOpenAiSpeechRequest,
  validateTtsRequest,
  ttsCacheKey,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_VOICE,
} from "../../shared/tts";

interface Env {
  OPENAI_API_KEY: string;
  TTS_MODEL?: string;
  TTS_VOICE?: string;
}

// Simple fixed-window rate limit per isolate. Standard Fry words are almost
// always served from cache before this runs; the limit mainly guards custom words.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return json(503, { error: "Speech service is not configured" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Expected a JSON body" });
  }

  const validated = validateTtsRequest(body);
  if (!validated.ok || !validated.word) {
    return json(400, { error: validated.error });
  }
  const word = validated.word;

  const voice = env.TTS_VOICE || DEFAULT_TTS_VOICE;
  const model = env.TTS_MODEL || DEFAULT_TTS_MODEL;

  // Aggressive edge caching keyed by word + voice + cache version.
  const cacheUrl = new URL(request.url);
  cacheUrl.pathname = `/__tts-cache/${ttsCacheKey(word, voice)}`;
  cacheUrl.search = "";
  const cacheRequest = new Request(cacheUrl.toString(), { method: "GET" });
  const cache = caches.default;

  const cached = await cache.match(cacheRequest);
  if (cached) return cached;

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (rateLimited(ip)) {
    return json(429, { error: "Too many requests — please wait a moment" });
  }

  const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOpenAiSpeechRequest(word, model, voice)),
  });

  if (!upstream.ok) {
    // Do not leak upstream error details (they can include request metadata).
    return json(502, { error: "Speech generation failed — try again" });
  }

  const audio = await upstream.arrayBuffer();
  const response = new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      // Standard list words are immutable for a given cache version;
      // custom words are cached for a day.
      "Cache-Control": validated.known
        ? "public, max-age=31536000, immutable"
        : "public, max-age=86400",
    },
  });

  context.waitUntil(cache.put(cacheRequest, response.clone()));
  return response;
};
