"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LevelKey = "pre-k" | "kindergarten" | "first" | "second";
type Stage = "welcome" | "playing" | "complete";

const LEVELS: Record<LevelKey, { label: string; note: string; words: string[] }> = {
  "pre-k": {
    label: "Pre-K",
    note: "First 40 words",
    words: ["a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", "funny", "go", "help", "here", "I", "in", "is", "it", "jump", "little", "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you"],
  },
  kindergarten: {
    label: "Kindergarten",
    note: "52 growing words",
    words: ["all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like", "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this", "too", "under", "want", "was", "well", "went", "what", "white", "who", "will", "with", "yes"],
  },
  first: {
    label: "1st Grade",
    note: "41 bright words",
    words: ["after", "again", "an", "any", "as", "ask", "by", "could", "every", "fly", "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", "know", "let", "live", "may", "of", "old", "once", "open", "over", "put", "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were", "when"],
  },
  second: {
    label: "2nd Grade",
    note: "46 mighty words",
    words: ["always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", "does", "don't", "fast", "first", "five", "found", "gave", "goes", "green", "its", "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep", "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", "why", "wish", "work", "would", "write", "your"],
  },
};

const ROUND_COUNT = 10;
const COLORS = ["coral", "aqua", "gold"];

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cleanWords(input: string) {
  return [...new Set(input.split(/[\n,]+/).map((word) => word.trim()).filter(Boolean))].slice(0, 40);
}

function makeRounds(words: string[], practice: string[]) {
  const pool = [...new Set([...practice.filter((word) => words.includes(word)), ...shuffle(words)])];
  const targets = Array.from({ length: ROUND_COUNT }, (_, index) => pool[index % pool.length]);
  return targets.map((target) => {
    const distractors = shuffle(words.filter((word) => word !== target)).slice(0, 2);
    return { target, choices: shuffle([target, ...distractors]) };
  });
}

function SparkMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "spark-mark small" : "spark-mark"} aria-hidden="true">
      <span className="spark-orbit one" />
      <span className="spark-orbit two" />
      <span className="spark-core">★</span>
    </span>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [level, setLevel] = useState<LevelKey>("pre-k");
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [rounds, setRounds] = useState<{ target: string; choices: string[] }[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [message, setMessage] = useState("Listen, then find the word!");
  const [soundOn, setSoundOn] = useState(true);
  const [speechReady, setSpeechReady] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedWords = customWords.length >= 3 ? customWords : LEVELS[level].words;
  const current = rounds[roundIndex];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sight-word-spark-sound");
      if (stored === "off") setSoundOn(false);
    } catch {}
    setSpeechReady("speechSynthesis" in window);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((word: string) => {
    if (!soundOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.72;
    utterance.pitch = 1.08;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [soundOn]);

  const startGame = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    let practice: string[] = [];
    try {
      practice = JSON.parse(localStorage.getItem(`sight-word-spark-practice-${level}`) || "[]");
    } catch {}
    const nextRounds = makeRounds(selectedWords, practice);
    setRounds(nextRounds);
    setRoundIndex(0);
    setCorrect(0);
    setMissed([]);
    setAnswered(false);
    setWrongChoice(null);
    setMessage("Listen, then find the word!");
    setStage("playing");
    setTimeout(() => speak(nextRounds[0].target), 160);
  };

  const chooseWord = (word: string) => {
    if (!current || answered || wrongChoice === word) return;
    if (word !== current.target) {
      setWrongChoice(word);
      setMissed((items) => items.includes(current.target) ? items : [...items, current.target]);
      setMessage("Good try! Listen once more.");
      speak(current.target);
      return;
    }

    setAnswered(true);
    setCorrect((value) => value + 1);
    setMessage(wrongChoice ? "Yes—that's the one!" : "You found it!");
    advanceTimer.current = setTimeout(() => {
      if (roundIndex === ROUND_COUNT - 1) {
        try {
          localStorage.setItem(`sight-word-spark-practice-${level}`, JSON.stringify(missed));
        } catch {}
        setStage("complete");
      } else {
        const next = roundIndex + 1;
        setRoundIndex(next);
        setAnswered(false);
        setWrongChoice(null);
        setMessage("Listen, then find the word!");
        speak(rounds[next].target);
      }
    }, 850);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem("sight-word-spark-sound", next ? "on" : "off"); } catch {}
    if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (next && current) setTimeout(() => speak(current.target), 30);
  };

  const saveCustom = () => {
    const cleaned = cleanWords(customText);
    if (cleaned.length < 3) {
      setMessage("Add at least 3 different words.");
      return;
    }
    setCustomWords(cleaned);
    setCustomOpen(false);
  };

  const progress = stage === "playing" ? ((roundIndex + (answered ? 1 : 0)) / ROUND_COUNT) * 100 : 0;

  return (
    <main className="game-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setStage("welcome")} aria-label="Sight Word Spark home">
          <SparkMark small />
          <span>SIGHT WORD <strong>SPARK</strong></span>
        </button>
        <button className="sound-button" onClick={toggleSound} aria-pressed={!soundOn}>
          <span aria-hidden="true">{soundOn ? "◖))" : "◖×"}</span> {soundOn ? "Sound on" : "Sound off"}
        </button>
      </header>

      {stage === "welcome" && (
        <section className="welcome" aria-labelledby="welcome-title">
          <div className="hero-copy">
            <div className="eyebrow"><span>★</span> A tiny game for mighty readers</div>
            <h1 id="welcome-title">Hear it.<br />Find it. <em>Spark it!</em></h1>
            <p>Listen for the word, tap the match, and light up a trail of stars. Ten words. Endless proud faces.</p>
          </div>

          <div className="setup-card">
            <div className="card-number">1</div>
            <div className="setup-content">
              <h2>Choose your word trail</h2>
              <p>Pick a level or add this week&apos;s school words.</p>
              <div className="level-grid">
                {(Object.keys(LEVELS) as LevelKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setLevel(key); setCustomWords([]); }}
                    className={`level-button ${level === key && customWords.length === 0 ? "selected" : ""}`}
                    aria-pressed={level === key && customWords.length === 0}
                  >
                    <span>{LEVELS[key].label}</span>
                    <small>{LEVELS[key].note}</small>
                  </button>
                ))}
              </div>
              <button className={`custom-button ${customWords.length ? "active" : ""}`} onClick={() => setCustomOpen((value) => !value)}>
                <span className="pencil" aria-hidden="true">✎</span>
                <span>{customWords.length ? `${customWords.length} custom words ready` : "Add my own words"}</span>
                <span aria-hidden="true">{customOpen ? "−" : "+"}</span>
              </button>
              {customOpen && (
                <div className="custom-panel">
                  <label htmlFor="custom-words">Paste words separated by commas or new lines</label>
                  <textarea id="custom-words" value={customText} maxLength={500} onChange={(event) => setCustomText(event.target.value)} placeholder="because, friend, beautiful, together" />
                  <div className="custom-actions">
                    <span>{cleanWords(customText).length}/40 words</span>
                    <button onClick={saveCustom}>Use these words</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button className="start-button" onClick={startGame}>
            <span>Start the spark!</span><span className="start-star" aria-hidden="true">★</span>
          </button>
          <div className="how-it-works" aria-label="How the game works">
            <span><b>1</b> Listen</span><i />
            <span><b>2</b> Find</span><i />
            <span><b>3</b> Spark!</span>
          </div>
          <p className="source-note">Uses familiar Dolch sight-word levels • No sign-in • Progress stays on this device</p>
        </section>
      )}

      {stage === "playing" && current && (
        <section className="play-area" aria-live="polite">
          <div className="round-meta">
            <button className="back-button" onClick={() => setStage("welcome")}>‹ Change words</button>
            <span>Word {roundIndex + 1} of {ROUND_COUNT}</span>
          </div>
          <div className="progress-track" aria-label={`${Math.round(progress)} percent complete`}><span style={{ width: `${progress}%` }} /></div>
          <div className="listen-card">
            <SparkMark />
            <p>{message}</p>
            <button className="listen-button" onClick={() => speak(current.target)} disabled={!soundOn || !speechReady}>
              <span aria-hidden="true">◖))</span> Hear the word
            </button>
            {!speechReady && <small>Sound is sleeping—ask a grown-up to say the word.</small>}
          </div>
          <div className="choices" aria-label="Word choices">
            {current.choices.map((word, index) => {
              const isRight = answered && word === current.target;
              const isWrong = wrongChoice === word;
              return (
                <button
                  key={word}
                  className={`word-card ${COLORS[index]} ${isRight ? "right" : ""} ${isWrong ? "wrong" : ""}`}
                  onClick={() => chooseWord(word)}
                  disabled={answered || isWrong}
                >
                  <span>{word}</span>
                  <small>{isRight ? "★" : isWrong ? "Try another" : "Tap me"}</small>
                </button>
              );
            })}
          </div>
          <div className="star-trail" aria-hidden="true">
            {Array.from({ length: ROUND_COUNT }, (_, index) => <span key={index} className={index < correct ? "lit" : ""}>★</span>)}
          </div>
        </section>
      )}

      {stage === "complete" && (
        <section className="complete-card" aria-labelledby="complete-title">
          <div className="final-burst" aria-hidden="true"><SparkMark /></div>
          <div className="eyebrow"><span>★</span> Trail complete</div>
          <h1 id="complete-title">You sparked<br /><em>{correct} bright words!</em></h1>
          <p>{missed.length ? `${missed.length} ${missed.length === 1 ? "word is" : "words are"} tucked into the next trail for extra practice.` : "Every word shone on the first try. What a constellation!"}</p>
          <div className="result-stats">
            <span><b>{correct}</b> stars lit</span>
            <span><b>{missed.length}</b> to revisit</span>
          </div>
          <button className="start-button" onClick={startGame}><span>Play another trail</span><span className="start-star">↻</span></button>
          <button className="quiet-button" onClick={() => setStage("welcome")}>Choose different words</button>
        </section>
      )}
      <div className="corner-spark left">✦</div><div className="corner-spark right">✦</div>
    </main>
  );
}
