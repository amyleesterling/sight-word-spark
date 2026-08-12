/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
  OPENAI_API_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const DOLCH_WORDS = new Set(`a and away big blue can come down find for funny go help here i in is it jump little look make me my not one play red run said see the three to two up we where yellow you all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when always around because been before best both buy call cold does don't fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your`.split(" "));
const SPOKEN_OVERRIDES: Record<string, string> = {
  live: "live, as in: I live on this planet",
  read: "read, present tense, as in: I read a book",
};
const requestsByClient = new Map<string, { count: number; resetAt: number }>();

function errorResponse(message: string, status: number, retryAfter?: number) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}

function checkRateLimit(request: Request, isStandard: boolean) {
  const key = request.headers.get("CF-Connecting-IP") || "local";
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const limit = isStandard ? 180 : 30;
  const current = requestsByClient.get(key);
  if (!current || current.resetAt <= now) {
    requestsByClient.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  current.count += 1;
  if (current.count > limit) return Math.ceil((current.resetAt - now) / 1000);
  return 0;
}

async function handleSpeech(request: Request, env: Env, ctx: ExecutionContext) {
  if (request.method !== "GET") return errorResponse("Use GET for speech playback.", 405);
  const url = new URL(request.url);
  const word = (url.searchParams.get("word") || "").trim().toLocaleLowerCase();
  const spoken = (url.searchParams.get("spoken") || "").trim();
  if (!word || word.length > 24 || !/^\p{L}+(?:['’-]\p{L}+)?$/u.test(word)) {
    return errorResponse("Please use one short word made of letters.", 400);
  }
  const expectedSpoken = SPOKEN_OVERRIDES[word] || word;
  if (spoken !== expectedSpoken) return errorResponse("That pronunciation is not allowed.", 400);
  const isStandard = DOLCH_WORDS.has(word);
  const retryAfter = checkRateLimit(request, isStandard);
  if (retryAfter) return errorResponse("The reading voice is resting for a moment.", 429, retryAfter);
  if (!env.OPENAI_API_KEY) return errorResponse("The reading voice is not configured yet.", 503);

  const cacheKey = new Request(`${url.origin}/api/speech?word=${encodeURIComponent(word)}&v=2025-12-15`);
  const edgeCache = (caches as CacheStorage & { default: Cache }).default;
  if (isStandard) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts-2025-12-15",
      voice: "marin",
      input: spoken,
      instructions: "Say only the requested sight word once. Use a warm, lively, clear reading-teacher voice for a bright first grader. Speak naturally and precisely, never in exaggerated preschool speech. For a pronunciation hint after 'as in', use it only to choose the intended pronunciation and do not speak the hint or sentence.",
      response_format: "aac",
    }),
  });
  if (!response.ok) {
    console.error("OpenAI speech request failed", response.status);
    return errorResponse("The reading voice needs another moment.", 502);
  }
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "audio/aac");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", isStandard ? "public, max-age=31536000, immutable" : "private, no-store");
  const audio = new Response(response.body, { status: 200, headers });
  if (isStandard) ctx.waitUntil(edgeCache.put(cacheKey, audio.clone()));
  return audio;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/speech") return handleSpeech(request, env, ctx);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
