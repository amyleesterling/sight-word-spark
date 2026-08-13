"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LevelKey = "pre-k" | "kindergarten" | "first" | "second";
type Stage = "welcome" | "playing" | "complete" | "collection";
type Round = { target: string; spoken: string; choices: string[] };
type CollectionState = { version: 2; discovered: string[]; hatchCount: number };

const LEVELS: Record<LevelKey, { label: string; note: string; words: string[] }> = {
  "pre-k": { label: "Pre-K", note: "40 first words", words: ["a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", "funny", "go", "help", "here", "I", "in", "is", "it", "jump", "little", "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you"] },
  kindergarten: { label: "Kindergarten", note: "52 growing words", words: ["all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like", "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this", "too", "under", "want", "was", "well", "went", "what", "white", "who", "will", "with", "yes"] },
  first: { label: "1st Grade", note: "41 bright words", words: ["after", "again", "an", "any", "as", "ask", "by", "could", "every", "fly", "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", "know", "let", "live", "may", "of", "old", "once", "open", "over", "put", "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were", "when"] },
  second: { label: "2nd Grade", note: "46 mighty words", words: ["always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", "does", "don't", "fast", "first", "five", "found", "gave", "goes", "green", "its", "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep", "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", "why", "wish", "work", "would", "write", "your"] },
};

const PRONUNCIATIONS: Record<string, string> = {
  live: "live, as in: I live on this planet",
  read: "read, present tense, as in: I read a book",
};

const CREATURES = [
  { id: "nova", name: "Nova Nibbler", icon: "✦", color: "violet", trait: "collects loose starlight" },
  { id: "moss", name: "Mosskip", icon: "❋", color: "fern", trait: "grows tiny forests" },
  { id: "zip", name: "Zipzap", icon: "ϟ", color: "gold", trait: "outruns comets" },
  { id: "luma", name: "Luma Loop", icon: "∞", color: "coral", trait: "draws light in the air" },
  { id: "orbit", name: "Orbit Otter", icon: "●", color: "aqua", trait: "surfs around moons" },
  { id: "pixel", name: "Pixel Puff", icon: "◆", color: "blue", trait: "builds worlds from blocks" },
  { id: "ember", name: "Emberwing", icon: "▲", color: "coral", trait: "warms cold constellations" },
  { id: "echo", name: "Echofox", icon: "◖", color: "violet", trait: "hears faraway galaxies" },
  { id: "quill", name: "Quill Comet", icon: "☄", color: "blue", trait: "writes across the sky" },
  { id: "tide", name: "Tidehopper", icon: "≈", color: "aqua", trait: "jumps between blue planets" },
  { id: "glint", name: "Glint Gecko", icon: "◇", color: "gold", trait: "turns invisible at noon" },
  { id: "sprout", name: "Sprout Scout", icon: "⌁", color: "fern", trait: "maps secret gardens" },
] as const;

const ROUND_COUNT = 6;
const COLLECTION_KEY = "sight-word-spark:collection:v2";
const COLORS = ["coral", "aqua", "gold"];

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function validateCustomWords(input: string) {
  const raw = input.split(/[\n,]+/).map((word) => word.trim()).filter(Boolean);
  const invalid = raw.find((word) => word.length > 24 || !/^\p{L}+(?:['’-]\p{L}+)?$/u.test(word));
  const words = [...new Set(raw.map((word) => word.toLocaleLowerCase()))].slice(0, 24);
  return { words, invalid };
}

function spokenFor(word: string) {
  return PRONUNCIATIONS[word.toLowerCase()] || word;
}

function makeRound(target: string, activeWords: string[]): Round {
  const distractors = shuffle(activeWords.filter((word) => word !== target)).slice(0, 2);
  return { target, spoken: spokenFor(target), choices: shuffle([target, ...distractors]) };
}

function makeRounds(words: string[], practice: string[]) {
  const pool = [...new Set([...practice.filter((word) => words.includes(word)), ...shuffle(words)])];
  const activeWords = pool.slice(0, Math.min(5, pool.length));
  return Array.from({ length: ROUND_COUNT }, (_, index) => makeRound(activeWords[index % activeWords.length], activeWords));
}

function readCollection(): CollectionState {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "null");
    if (parsed?.version === 2 && Array.isArray(parsed.discovered)) return parsed;
    const legacy = JSON.parse(localStorage.getItem("sight-word-spark-collection") || "[]");
    if (Array.isArray(legacy)) return { version: 2, discovered: legacy.filter((id) => CREATURES.some((item) => item.id === id)), hatchCount: legacy.length };
  } catch {}
  return { version: 2, discovered: [], hatchCount: 0 };
}

function Creature({ id, hidden = false, large = false }: { id: string; hidden?: boolean; large?: boolean }) {
  const creature = CREATURES.find((item) => item.id === id) || CREATURES[0];
  return (
    <div className={`creature ${creature.color} ${hidden ? "hidden" : ""} ${large ? "large" : ""}`} aria-hidden="true">
      <span className="ear left" /><span className="ear right" />
      <span className="creature-glyph">{hidden ? "?" : creature.icon}</span>
      <span className="eye left" /><span className="eye right" />
    </div>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [level, setLevel] = useState<LevelKey>("pre-k");
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customError, setCustomError] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [message, setMessage] = useState("Listen, then find the word!");
  const [audioState, setAudioState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [collection, setCollection] = useState<CollectionState>({ version: 2, discovered: [], hatchCount: 0 });
  const [prizeId, setPrizeId] = useState(CREATURES[0].id as string);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const roundsRef = useRef<Round[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedWords = customWords.length >= 3 ? customWords : LEVELS[level].words;
  const current = rounds[roundIndex];

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const saved = readCollection();
      setCollection(saved);
      const available = CREATURES.filter((creature) => !saved.discovered.includes(creature.id));
      setPrizeId((available.length ? shuffle(available) : shuffle([...CREATURES]))[0].id);
    }, 0);
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      window.clearTimeout(hydrationTimer);
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = "";
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  const audioUrl = useCallback((round: Round) => `/api/speech?word=${encodeURIComponent(round.target)}&spoken=${encodeURIComponent(round.spoken)}`, []);

  const preload = useCallback((round?: Round) => {
    if (!round) return;
    fetch(audioUrl(round), { cache: "force-cache" }).catch(() => undefined);
  }, [audioUrl]);

  const speak = useCallback(async (round?: Round) => {
    if (!round || !audioRef.current) return;
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.src = audioUrl(round);
    setAudioState("loading");
    try {
      await audio.play();
      setAudioState("ready");
    } catch {
      setAudioState("error");
    }
  }, [audioUrl]);

  const selectNextPrize = useCallback((state: CollectionState) => {
    const available = CREATURES.filter((creature) => !state.discovered.includes(creature.id));
    setPrizeId((available.length ? shuffle(available) : shuffle([...CREATURES]))[0].id);
  }, []);

  const startGame = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (collection.discovered.includes(prizeId)) selectNextPrize(collection);
    let practice: string[] = [];
    try { practice = JSON.parse(localStorage.getItem(`sight-word-spark:practice:${customWords.length ? "custom" : level}:v1`) || "[]"); } catch {}
    const nextRounds = makeRounds(selectedWords, practice);
    roundsRef.current = nextRounds;
    setRounds(nextRounds);
    setRoundIndex(0); setCorrect(0); setMissed([]); setAnswered(false); setWrongChoice(null);
    setMessage("Listen, then find the word!"); setStage("playing");
    void speak(nextRounds[0]);
    preload(nextRounds[1]);
  };

  const chooseWord = (word: string) => {
    if (!current || answered || wrongChoice === word) return;
    if (word !== current.target) {
      setWrongChoice(word);
      setMissed((items) => items.includes(current.target) ? items : [...items, current.target]);
      setMessage(`Good try. This word is “${current.target}.” Find it below.`);
      void speak(current);
      return;
    }
    const hadMiss = Boolean(wrongChoice);
    setAnswered(true);
    setCorrect((value) => value + 1);
    setMessage(hadMiss ? "Yes—that’s the one! It will visit again." : "You found it! The egg is cracking.");
    if (hadMiss && roundIndex < ROUND_COUNT - 2) {
      setRounds((items) => {
        const copy = [...items];
        const active = [...new Set(copy.flatMap((round) => round.choices))];
        copy[Math.min(roundIndex + 2, ROUND_COUNT - 1)] = makeRound(current.target, active);
        roundsRef.current = copy;
        return copy;
      });
    }
    advanceTimer.current = setTimeout(() => {
      if (roundIndex === ROUND_COUNT - 1) {
        const key = `sight-word-spark:practice:${customWords.length ? "custom" : level}:v1`;
        try { localStorage.setItem(key, JSON.stringify(missed)); } catch {}
        const discovered = collection.discovered.includes(prizeId) ? collection.discovered : [...collection.discovered, prizeId];
        const nextCollection = { version: 2 as const, discovered, hatchCount: collection.hatchCount + 1 };
        setCollection(nextCollection);
        try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(nextCollection)); } catch {}
        setStage("complete");
      } else {
        const next = roundIndex + 1;
        setRoundIndex(next); setAnswered(false); setWrongChoice(null); setMessage("Listen, then find the word!");
        void speak(roundsRef.current[next]); preload(roundsRef.current[next + 1]);
      }
    }, 850);
  };

  const saveCustom = () => {
    const { words, invalid } = validateCustomWords(customText);
    if (invalid) { setCustomError(`“${invalid}” is not a safe single word. Use letters, apostrophes, or one hyphen.`); return; }
    if (words.length < 3) { setCustomError("Add at least 3 different words so the game can make choices."); return; }
    setCustomError(""); setCustomWords(words); setCustomOpen(false);
  };

  const playAgain = () => { selectNextPrize(collection); setStage("welcome"); };
  const prize = CREATURES.find((item) => item.id === prizeId) || CREATURES[0];
  const progress = stage === "playing" ? ((roundIndex + (answered ? 1 : 0)) / ROUND_COUNT) * 100 : 0;
  const crackLevel = Math.min(correct, ROUND_COUNT);
  const customCount = useMemo(() => validateCustomWords(customText).words.length, [customText]);

  return (
    <main className="game-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { if (collection.discovered.includes(prizeId)) selectNextPrize(collection); setStage("welcome"); }} aria-label="Sight Word Spark home"><span className="brand-mark">✦</span><span>SIGHT WORD <strong>SPARK</strong></span></button>
        <button className="collection-button" onClick={() => setStage("collection")}><span aria-hidden="true">◈</span> Collection <b>{collection.discovered.length}/{CREATURES.length}</b></button>
      </header>

      {stage === "welcome" && (
        <section className="welcome" aria-labelledby="welcome-title">
          <div className="hero-copy"><div className="eyebrow">A tiny quest for mighty readers</div><h1 id="welcome-title">Read words.<br /><em>Hatch wonders.</em></h1><p>Listen for six words and crack open one brand-new creature for your permanent collection.</p></div>
          <div className="mission-card">
            <div className="egg-wrap"><div className="egg mystery"><Creature id={prizeId} hidden /></div></div>
            <div><span className="mission-label">YOUR NEXT PRIZE</span><h2>Find 6 words to hatch this mystery creature</h2><p>Six good finds. About 2–3 minutes. The creature stays in your collection on this device.</p></div>
          </div>
          <div className="setup-card">
            <div className="setup-content"><h2>Choose a word trail</h2><p>Each trail focuses on just five words at a time.</p>
              <div className="level-grid">{(Object.keys(LEVELS) as LevelKey[]).map((key) => <button key={key} onClick={() => { setLevel(key); setCustomWords([]); }} className={`level-button ${level === key && !customWords.length ? "selected" : ""}`} aria-pressed={level === key && !customWords.length}><span>{LEVELS[key].label}</span><small>{LEVELS[key].note}</small></button>)}</div>
              <button className={`custom-button ${customWords.length ? "active" : ""}`} onClick={() => setCustomOpen((value) => !value)}><span aria-hidden="true">✎</span><span>{customWords.length ? `${customWords.length} custom words ready` : "Add my own words"}</span><span aria-hidden="true">{customOpen ? "−" : "+"}</span></button>
              {customOpen && <div className="custom-panel"><label htmlFor="custom-words">Words separated by commas or new lines</label><textarea id="custom-words" value={customText} maxLength={600} onChange={(event) => { setCustomText(event.target.value); setCustomError(""); }} placeholder="because, friend, together" /><div className="custom-actions"><span>{customCount}/24 words</span><button onClick={saveCustom}>Use these words</button></div>{customError && <p className="custom-error" role="alert">{customError}</p>}</div>}
            </div>
          </div>
          <button className="start-button" onClick={startGame}><span>Start hatching</span><span className="start-star" aria-hidden="true">→</span></button>
          <p className="source-note">AI-generated reading voice • No sign-in • Collection stays on this device</p>
        </section>
      )}

      {stage === "playing" && current && (
        <section className="play-area">
          <div className="round-meta"><button className="back-button" onClick={() => { audioRef.current?.pause(); setStage("welcome"); }}>‹ Change words</button><span>Find {roundIndex + 1} of {ROUND_COUNT}</span></div>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={correct}><span style={{ width: `${progress}%` }} /></div>
          <div className="hatch-board"><div className={`egg crack-${crackLevel}`}><div className="crack-lines" aria-hidden="true">⌁</div><Creature id={prizeId} hidden /></div><div className="hatch-copy"><span className="mission-label">MYSTERY EGG</span><h2>{correct === 0 ? "Ready for the first crack" : `${correct} of 6 cracks glowing`}</h2><p role="status" aria-live="polite">{message}</p><button className="listen-button" onClick={() => void speak(current)} disabled={audioState === "loading"}><span aria-hidden="true">▶</span> {audioState === "loading" ? "Getting the voice…" : audioState === "error" ? "Retry the voice" : "Hear the word"}</button>{audioState === "error" && <small>Nothing is wrong with your answer. The voice just needs another try.</small>}</div></div>
          <div className="choices" aria-label="Word choices">{current.choices.map((word, index) => { const isRight = answered && word === current.target; const isWrong = wrongChoice === word; return <button key={word} className={`word-card ${COLORS[index]} ${isRight ? "right" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => chooseWord(word)} disabled={answered || isWrong}><span>{word}</span><small>{isRight ? "Found" : isWrong ? "Try another" : `Choice ${index + 1}`}</small></button>; })}</div>
          <div className="crack-trail" aria-label={`${correct} of 6 finds complete`}>{Array.from({ length: ROUND_COUNT }, (_, index) => <span key={index} className={index < correct ? "lit" : ""}>{index < correct ? "✦" : "◇"}</span>)}</div>
          <p className="voice-note">Voice is AI-generated.</p>
        </section>
      )}

      {stage === "complete" && (
        <section className="complete-card" aria-labelledby="complete-title"><div className="reveal-ring"><Creature id={prizeId} large /></div><div className="eyebrow">NEW CREATURE DISCOVERED</div><h1 id="complete-title">Meet <em>{prize.name}!</em></h1><p className="trait">It {prize.trait}.</p><p>{missed.length ? `${missed.length} ${missed.length === 1 ? "tricky word is" : "tricky words are"} saved for another friendly visit.` : "You found every word on the first try."}</p><div className="result-stats"><span><b>{collection.discovered.length}/{CREATURES.length}</b> discovered</span><span><b>{collection.hatchCount}</b> eggs hatched</span></div><button className="start-button" onClick={playAgain}><span>Hatch another</span><span className="start-star">↻</span></button><button className="quiet-button" onClick={() => setStage("collection")}>See my collection</button></section>
      )}

      {stage === "collection" && (
        <section className="gallery" aria-labelledby="gallery-title"><button className="back-button" onClick={() => setStage("welcome")}>‹ Back to the trail</button><div className="gallery-heading"><span className="mission-label">YOUR DISCOVERIES</span><h1 id="gallery-title">Sparkling Collection</h1><p>{collection.discovered.length} of {CREATURES.length} found. Every egg holds a new creature until you discover them all.</p></div><div className="creature-grid">{CREATURES.map((creature) => { const found = collection.discovered.includes(creature.id); return <article className={`creature-card ${found ? "found" : "locked"}`} key={creature.id}><Creature id={creature.id} hidden={!found} /><h2>{found ? creature.name : "Mystery creature"}</h2><p>{found ? `It ${creature.trait}.` : "Hatch an egg to reveal it."}</p></article>; })}</div><button className="start-button gallery-cta" onClick={() => setStage("welcome")}><span>Find the next one</span><span className="start-star">→</span></button></section>
      )}
    </main>
  );
}
