import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("renders the finished game metadata", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /<title>Sight Word Spark<\/title>/i);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("speech endpoint is server-side, validated, and fails calmly without a key", async () => {
  const worker = await loadWorker();
  const invalid = await worker.fetch(new Request("http://localhost/api/speech?word=https%3A%2F%2Fevil.example&spoken=no"), env, ctx);
  assert.equal(invalid.status, 400);
  const unavailable = await worker.fetch(new Request("http://localhost/api/speech?word=read&spoken=read%2C%20present%20tense%2C%20as%20in%3A%20I%20read%20a%20book"), env, ctx);
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("cache-control"), "no-store");
});
