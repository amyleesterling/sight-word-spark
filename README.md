# Sight Word Spark

[Play Sight Word Spark](https://sight-word-spark.amysterling.chatgpt.site)

Sight Word Spark is a short listen-and-find game for growing readers. A child sees the prize before starting, finds six spoken words in about 2–3 minutes, and hatches a named cosmic creature that stays in a device-local collection.

## Features

- Complete Dolch Pre-K, Kindergarten, 1st-grade, and 2nd-grade lists
- Safe custom word lists with client and server validation
- Five-word session focus with missed words returning later without penalties
- Twelve-creature collection with silhouettes and no duplicates until the initial set is complete
- Versioned `localStorage` for collections and words to revisit
- Server-side OpenAI Speech API using the pinned `gpt-4o-mini-tts-2025-12-15` snapshot and `marin`
- Explicit pronunciation metadata for ambiguous words such as `read` and `live`
- Aggressive edge/browser caching for standard Dolch recordings and next-word preloading
- Temporary, clearly disclosed device-voice fallback when GPT audio is unavailable
- Touch, keyboard, responsive-layout, and reduced-motion support

## Local setup

Requirements: Node.js 22.13 or newer, npm, and a Bash-compatible shell for the bundled Sites scripts.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local` before testing speech. Never commit `.env.local` or an API key.

On Windows, the underlying build can also be run directly when Bash is unavailable:

```powershell
npx vite build
```

## OpenAI voice configuration

The key is read only by the Cloudflare-compatible worker in `worker/index.ts`; it is never included in client JavaScript. Configure this secret as `OPENAI_API_KEY` in the Site's hosted environment before testing the live voice.

The endpoint accepts one validated word, checks any pronunciation hint against server-owned metadata, applies per-client rate limiting, and caches only the standard Dolch recordings. Custom recordings are returned with `private, no-store`.

See the official [OpenAI text-to-speech guide](https://developers.openai.com/api/docs/guides/text-to-speech).

## Checks

```bash
npm run lint
npm test
```

The test suite verifies the production worker, missing-key behavior, all 179 included Dolch words, ambiguous pronunciation metadata, and the disclosed temporary device-voice fallback.

## Deployment

This is a Vinext/Vite/React app that produces Cloudflare-compatible output for OpenAI Sites. `.openai/hosting.json` identifies the existing Sight Word Spark Site so deployments update the live URL rather than create a second project.
