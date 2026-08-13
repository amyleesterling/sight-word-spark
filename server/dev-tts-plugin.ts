// Vite dev-server middleware mirroring functions/api/tts.ts, so local development
// has working audio when OPENAI_API_KEY is set in the shell. Never bundled into
// the client build — Vite config plugins run only in Node.

import type { Plugin } from "vite";
import {
  buildOpenAiSpeechRequest,
  validateTtsRequest,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_VOICE,
} from "../shared/tts";

const memoryCache = new Map<string, Buffer>();

export function devTtsPlugin(): Plugin {
  return {
    name: "dev-tts-endpoint",
    configureServer(server) {
      server.middlewares.use("/api/tts", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", async () => {
          try {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Speech service is not configured (set OPENAI_API_KEY)" }));
              return;
            }
            let body: unknown;
            try {
              body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Expected a JSON body" }));
              return;
            }
            const validated = validateTtsRequest(body);
            if (!validated.ok || !validated.word) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: validated.error }));
              return;
            }
            const cacheKey = validated.word;
            const cached = memoryCache.get(cacheKey);
            if (cached) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "audio/mpeg");
              res.end(cached);
              return;
            }
            const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                buildOpenAiSpeechRequest(
                  validated.word,
                  process.env.TTS_MODEL || DEFAULT_TTS_MODEL,
                  process.env.TTS_VOICE || DEFAULT_TTS_VOICE,
                ),
              ),
            });
            if (!upstream.ok) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Speech generation failed — try again" }));
              return;
            }
            const audio = Buffer.from(await upstream.arrayBuffer());
            memoryCache.set(cacheKey, audio);
            res.statusCode = 200;
            res.setHeader("Content-Type", "audio/mpeg");
            res.end(audio);
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Speech generation failed — try again" }));
          }
        });
      });
    },
  };
}
