// Fry instant words — the most common words in printed English, in frequency order.
// Source: Fry word lists (first and second hundred), 25 words per level.
// Levels 1–4 (the first hundred) are open from the start; levels 5–8 unlock
// one at a time as trails are completed, so there is always a next thing to reach.

export interface WordEntry {
  word: string;
  /**
   * Spoken form sent to the TTS endpoint when the plain word is ambiguous
   * (homographs like "read" and "live"). The child still sees `word`;
   * the audio pronounces `say`. Keep displayed word, audio, and scoring in sync.
   */
  say?: string;
}

export interface WordLevel {
  id: number;
  title: string;
  words: WordEntry[];
}

/**
 * Homograph pronunciation metadata. The value is an unambiguous respelling
 * fed to the speech model instead of the bare word. Chosen readings are the
 * ones taught first for sight-word practice.
 */
export const PRONUNCIATIONS: Record<string, string> = {
  // present tense, rhymes with "seed"
  read: "reed",
  // verb, rhymes with "give"
  live: "liv",
  // noun/verb "use", rhymes with "news"
  use: "yooz",
  // determiner "a" as schwa ("uh"), the way it is read in a sentence
  a: "uh",
  // verb, rhymes with "goes" — "does" is the tricky sight word form (duz)
  does: "duz",
};

const L = (id: number, title: string, words: string[]): WordLevel => ({
  id,
  title,
  words: words.map((w) => (PRONUNCIATIONS[w] ? { word: w, say: PRONUNCIATIONS[w] } : { word: w })),
});

// prettier-ignore
export const WORD_LEVELS: WordLevel[] = [
  L(1, "Level 1", [
    "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
    "he", "was", "for", "on", "are", "as", "with", "his", "they", "I",
    "at", "be", "this", "have", "from",
  ]),
  L(2, "Level 2", [
    "or", "one", "had", "by", "words", "but", "not", "what", "all", "were",
    "we", "when", "your", "can", "said", "there", "use", "an", "each", "which",
    "she", "do", "how", "their", "if",
  ]),
  L(3, "Level 3", [
    "will", "up", "other", "about", "out", "many", "then", "them", "these", "so",
    "some", "her", "would", "make", "like", "him", "into", "time", "has", "look",
    "two", "more", "write", "go", "see",
  ]),
  L(4, "Level 4", [
    "number", "no", "way", "could", "people", "my", "than", "first", "water", "been",
    "called", "who", "oil", "sit", "now", "find", "long", "down", "day", "did",
    "get", "come", "made", "may", "part",
  ]),
  L(5, "Level 5", [
    "over", "new", "sound", "take", "only", "little", "work", "know", "place", "years",
    "live", "me", "back", "give", "most", "very", "after", "things", "our", "just",
    "name", "good", "sentence", "man", "think",
  ]),
  L(6, "Level 6", [
    "say", "great", "where", "help", "through", "much", "before", "line", "right", "too",
    "means", "old", "any", "same", "tell", "boy", "follow", "came", "want", "show",
    "also", "around", "form", "three", "small",
  ]),
  L(7, "Level 7", [
    "set", "put", "end", "does", "another", "well", "large", "must", "big", "even",
    "such", "because", "turn", "here", "why", "ask", "went", "men", "read", "need",
    "land", "different", "home", "us", "move",
  ]),
  L(8, "Level 8", [
    "try", "kind", "hand", "picture", "again", "change", "off", "play", "spell", "air",
    "away", "animal", "house", "point", "page", "letter", "mother", "answer", "found", "study",
    "still", "learn", "should", "America", "world",
  ]),
];

/** Levels open before any trails have been played (the Fry first hundred). */
export const INITIAL_OPEN_LEVELS = 4;

export const ALL_WORDS: WordEntry[] = WORD_LEVELS.flatMap((l) => l.words);

/** Words per trail — short on purpose: a trail should take about 2–3 minutes. */
export const TRAIL_LENGTH = 6;

/** Choices shown per round (1 correct + 3 lookalikes). */
export const CHOICES_PER_ROUND = 4;
