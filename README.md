# ⚡ Sight Word Spark

A sight-word reading game for kids around first grade. Hear a word, find it
among lookalikes, crack a mystery egg — and hatch a named creature that joins
a permanent collection.

**Play it live:** https://sight-word-spark.amysterling.chatgpt.site

## Why kids come back

Every trail starts by showing the prize: *"Find 6 words to crack this egg and
meet them."* Each correct answer visibly cracks the egg; the trail takes about
2–3 minutes and always ends in a hatch. The reveal is a named collectible
(Emberly the Spark Fox, Doodle the Ink Octo, …) saved permanently on the
device. The gallery shows discovered friends in color, mysteries as
silhouettes, and progress like **4 of 12**. No duplicates are awarded until
the whole first set is found; completing it unlocks a second set. There are
no streaks to lose, no timers, no scarcity tricks, and nothing to buy.

## Features

- **200 Fry instant words** in 8 levels of 25. The first hundred (levels 1–4)
  is open from the start; levels 5–8 unlock one at a time by hatching an egg
  in the previous level.
- **24 collectible creatures** in two sets, drawn as code (SVG) so the whole
  collection has one coherent style.
- **AI reading-teacher voice** via the server-side OpenAI Speech API
  (`gpt-4o-mini-tts`, voice `marin`) — warm, lively, and clear, not
  a robotic browser voice and not exaggerated preschool speech. A small
  disclosure notes the voice is AI-generated. If audio fails, the game shows
  a calm retry state; it never falls back to `speechSynthesis`.
- **Gentle correction**: a wrong tap costs nothing. The word is replayed, the
  wrong card fades, after a second miss the right card glows, and the word
  quietly returns later in the trail for one friendly retry. Missed words are
  remembered (locally) and favored in future trails.
- **Homograph-safe audio**: ambiguous words carry pronunciation metadata —
  "read" is spoken *reed* (present tense), "live" as *liv* (verb) — so the
  audio, the displayed word, and scoring always agree.
- **Custom words**: add up to 20 of your own (spelling lists, names). Words
  are validated on the client and again on the server, and audio requests are
  rate-limited.
- **Versioned local saves**: the collection, unlocked levels, and practice
  memory live in `localStorage` under an explicit schema version with
  defensive migration — refreshing, reopening, or updating the game never
  wipes a collection.
- Touch-first with large targets, full keyboard play (1–4 to answer, R to
  replay), responsive layout, and `prefers-reduced-motion` support.

## Tech stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript + Tailwind CSS
- Static output (`dist/`) plus one serverless endpoint:
  `functions/api/tts.ts`, a Cloudflare Pages Function that proxies the
  OpenAI Speech API
- [Vitest](https://vitest.dev) for tests

## Getting started

```bash
npm install
OPENAI_API_KEY=sk-... npm run dev    # audio works locally through a dev middleware
npm test                             # logic tests (storage, collection, trails, TTS validation)
npm run build                        # type-check + production build to dist/
```

Without `OPENAI_API_KEY` the game runs fine but the speaker button shows its
calm retry state instead of audio.

## Configuring the API key (required for voice)

The OpenAI key is **server-side only**. It is read from the `OPENAI_API_KEY`
environment variable by the `/api/tts` endpoint and never appears in client
code, the bundle, or this repository.

- **Cloudflare Pages**: set `OPENAI_API_KEY` in *Settings → Environment
  variables* (production and preview). `functions/api/tts.ts` is picked up
  automatically; the build output directory is `dist`.
- **Other hosts / the existing Site**: provide `OPENAI_API_KEY` in the site's
  server environment and expose the equivalent of `functions/api/tts.ts`
  (a ~100-line handler; see `server/dev-tts-plugin.ts` for a plain Node
  version).
- Optional overrides: `TTS_MODEL` (default `gpt-4o-mini-tts`) and `TTS_VOICE`
  (default `marin`; `cedar` is the other recommended voice).

Generated audio is cached aggressively (edge cache on the server, Cache
Storage + in-memory on the device), and upcoming words are preloaded, so the
API is hit roughly once per word per cache version.

## Pronunciation testing

```bash
OPENAI_API_KEY=sk-... npm run test:pronunciations
```

generates an mp3 for every shipped word into `pronunciation-audio/` (ignored
by git) for a listen-through. The vitest suite separately verifies that every
shipped word passes TTS validation and that known homographs carry explicit
pronunciation metadata.

## Project layout

```
shared/        word lists + TTS contract (used by client, server, and tests)
functions/     Cloudflare Pages Function: POST /api/tts
server/        Vite dev middleware mirroring the production endpoint
src/game/      storage (versioned saves), collection, trail, audio manager
src/screens/   home, pre-trail promise, play, hatch, gallery, custom words
src/components/ egg + creature SVG art, shared UI
scripts/       pronunciation smoke test
```
