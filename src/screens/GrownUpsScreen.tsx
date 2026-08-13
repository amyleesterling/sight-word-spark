// Grown-ups only: voice settings for static hosting.
//
// The preferred setup is the server endpoint (/api/tts) with OPENAI_API_KEY
// configured on the host. When the game is served statically (e.g. GitHub
// Pages) there is no server, so a grown-up can paste their own OpenAI key
// here. It lives ONLY in this device's localStorage and is sent ONLY to
// api.openai.com over HTTPS.

import { useState } from "react";
import { getParentVoiceKey, setParentVoiceKey, wordAudio } from "../game/audio";
import { Shell, BackButton, BigButton } from "../components/ui";

interface Props {
  onBack: () => void;
}

export function GrownUpsScreen({ onBack }: Props) {
  const [draft, setDraft] = useState("");
  const [hasKey, setHasKey] = useState(() => Boolean(getParentVoiceKey()));
  const [status, setStatus] = useState<string | null>(null);

  const saveKey = () => {
    const key = draft.trim();
    if (!key.startsWith("sk-") || key.length < 20) {
      setStatus("That doesn't look like an OpenAI key (it starts with sk-).");
      return;
    }
    setParentVoiceKey(key);
    setDraft("");
    setHasKey(true);
    setStatus("Saved on this device. Tap “Test the voice” to hear it.");
  };

  const removeKey = () => {
    setParentVoiceKey(null);
    setHasKey(false);
    setStatus("Key removed from this device.");
  };

  const testVoice = () => {
    setStatus(null);
    wordAudio.unlock();
    void wordAudio.play("the");
  };

  return (
    <Shell>
      <BackButton onClick={onBack} />
      <h1 className="mt-4 text-3xl font-extrabold text-center">Grown-Ups</h1>
      <p className="mt-3 text-white/70">
        Words are read aloud by an AI-generated voice (OpenAI). If the game is
        hosted with its own server key, the voice just works and you can ignore
        this page. On a simple static host, paste an OpenAI API key below.
      </p>
      <ul className="mt-3 text-sm text-white/60 list-disc pl-5 space-y-1">
        <li>The key is stored only on this device (localStorage).</li>
        <li>It is sent only to api.openai.com to generate word audio.</li>
        <li>Each word costs a fraction of a cent and is cached after the first play.</li>
      </ul>

      {hasKey ? (
        <div className="mt-6 rounded-2xl bg-white/10 p-5">
          <p className="font-bold">✅ A voice key is saved on this device.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <BigButton onClick={testVoice}>Test the voice 🔊</BigButton>
            <BigButton variant="ghost" onClick={removeKey}>
              Remove key
            </BigButton>
          </div>
        </div>
      ) : (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveKey();
          }}
        >
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-…"
            aria-label="OpenAI API key"
            autoComplete="off"
            className="rounded-2xl bg-white/10 px-5 py-4 text-lg font-mono placeholder-white/40 focus:bg-white/15 min-h-[56px]"
          />
          <BigButton onClick={saveKey}>Save key on this device</BigButton>
        </form>
      )}

      {status && (
        <p role="status" className="mt-4 text-spark-300 font-semibold">
          {status}
        </p>
      )}

      <p className="mt-6 text-sm text-white/50">
        Keys come from platform.openai.com → API keys. Never share a key you
        care about; you can revoke it there at any time.
      </p>
    </Shell>
  );
}
