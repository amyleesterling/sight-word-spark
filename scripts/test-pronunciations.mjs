#!/usr/bin/env node
// Pronunciation smoke test: generates audio for EVERY shipped word through the
// same request the server uses, and saves the mp3s to ./pronunciation-audio
// for a human listen-through (homographs like "read" and "live" especially).
//
// Requires OPENAI_API_KEY in the environment. Costs a few cents; results are
// only fetched for words not already saved locally, so re-runs are cheap.
//
// Usage: OPENAI_API_KEY=sk-... npm run test:pronunciations

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

// Plain-JS mirror of shared/tts.ts values (this script avoids a TS build step).
const MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";
const VOICE = process.env.TTS_VOICE || "marin";
const INSTRUCTIONS =
  "You are a warm, lively, encouraging reading teacher recording flashcard audio for a " +
  "six-to-seven-year-old. Say the single word clearly at a relaxed pace, with natural, " +
  "friendly energy. Do not exaggerate or use sing-song preschool speech. Do not add any " +
  "other words, sounds, or punctuation — say only the word itself.";

const PRONUNCIATIONS = { read: "reed", live: "liv", use: "yooz", a: "uh", does: "duz" };

// Fry first + second hundred (kept in sync with shared/words.ts by the vitest suite).
const WORDS = (
  "the of and a to in is you that it he was for on are as with his they I at be this have from " +
  "or one had by words but not what all were we when your can said there use an each which she do how their if " +
  "will up other about out many then them these so some her would make like him into time has look two more write go see " +
  "number no way could people my than first water been called who oil sit now find long down day did get come made may part " +
  "over new sound take only little work know place years live me back give most very after things our just name good sentence man think " +
  "say great where help through much before line right too means old any same tell boy follow came want show also around form three small " +
  "set put end does another well large must big even such because turn here why ask went men read need land different home us move " +
  "try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should America world"
).split(/\s+/);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set — skipping pronunciation generation.");
  process.exit(1);
}

const outDir = path.resolve("pronunciation-audio");
await mkdir(outDir, { recursive: true });

let generated = 0;
let failed = [];
for (const word of WORDS) {
  const file = path.join(outDir, `${word.toLowerCase()}.mp3`);
  try {
    await access(file);
    continue; // already generated
  } catch {
    /* not yet generated */
  }
  const input = PRONUNCIATIONS[word.toLowerCase()] ?? word;
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input,
      instructions: INSTRUCTIONS,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    failed.push(`${word}: HTTP ${res.status}`);
    continue;
  }
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  generated++;
  process.stdout.write(`\r${generated} generated…`);
}

console.log(`\nDone. ${generated} new files in ${outDir} (${WORDS.length} words total).`);
if (failed.length > 0) {
  console.error(`Failed:\n${failed.join("\n")}`);
  process.exit(1);
}
console.log("Listen through the folder — pay special attention to: read, live, use, does, a.");
