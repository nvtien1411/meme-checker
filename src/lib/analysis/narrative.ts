import type { Narrative, ProjectInfo, TokenIdentity } from "../types";

/* ------------------------------------------------------------------ *
 * Narrative
 *
 * The brief is explicit that a narrative must never be presented as a
 * conclusion about upside, and must be visually separated from observed
 * data. So this is deliberately a keyword classifier, not a language model
 * pretending to understand a token: it reads the name, symbol and any
 * description text, matches against a fixed vocabulary, and labels its own
 * output as `inferred`. When nothing matches it says so instead of
 * inventing a theme.
 * ------------------------------------------------------------------ */

const THEMES: { id: string; label: string; words: string[] }[] = [
  { id: "animal", label: "Animal", words: ["dog", "cat", "frog", "pepe", "bonk", "monkey", "ape", "bear", "bull", "rat", "bird", "fish", "hamster", "hippo", "mog", "doge", "shib", "kitty", "puppy", "wolf", "penguin", "duck", "goat", "chad"] },
  { id: "ai", label: "AI / agent", words: ["ai", "agent", "gpt", "neural", "bot", "llm", "model", "agi", "compute", "inference", "swarm"] },
  { id: "political", label: "Political", words: ["trump", "biden", "maga", "election", "senate", "congress", "president", "vote", "politic", "gov"] },
  { id: "celebrity", label: "Celebrity / brand", words: ["elon", "musk", "kanye", "taylor", "swift", "mrbeast", "beast", "ronaldo", "messi", "trudeau", "barron", "melania", "ivanka"] },
  { id: "finance", label: "Finance / trading", words: ["bank", "fund", "capital", "yield", "vault", "index", "etf", "hedge", "bond", "stake", "dao", "treasury", "usd", "coin"] },
  { id: "meme-culture", label: "Meme culture", words: ["meme", "wojak", "chad", "copium", "based", "degen", "rug", "pump", "moon", "lambo", "hodl", "wagmi", "ngmi", "vibe", "cult"] },
  { id: "tech", label: "Tech / infra", words: ["chain", "layer", "protocol", "network", "node", "rollup", "zk", "evm", "solana", "eth", "bridge", "oracle", "index"] },
  { id: "gaming", label: "Gaming", words: ["game", "play", "quest", "guild", "arcade", "pixel", "rpg", "loot", "arena"] },
  { id: "food", label: "Food / drink", words: ["pizza", "taco", "burger", "coffee", "beer", "wine", "cake", "donut", "noodle", "sushi", "milk"] },
  { id: "absurd", label: "Absurdist / shitpost", words: ["butt", "fart", "poop", "skibidi", "gigachad", "brainrot", "sigma", "rizz", "gyatt", "sus"] },
];

export function buildNarrative(
  token: TokenIdentity,
  project: ProjectInfo,
): Narrative {
  const haystack = [token.name, token.symbol, project.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack.trim()) {
    return {
      theme: null,
      summary: null,
      keywords: [],
      quality: "inferred",
      source: null,
      disclaimer:
        "No name, symbol or description was available, so no narrative could be read. This is a data gap, not a finding.",
    };
  }

  const hits = THEMES.filter((t) =>
    t.words.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(haystack)),
  );

  const keywords = [...new Set(
    THEMES.flatMap((t) => t.words).filter((w) =>
      new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(haystack),
    ),
  )].slice(0, 8);

  if (hits.length === 0) {
    return {
      theme: null,
      summary: null,
      keywords,
      quality: "inferred",
      source: "name and symbol keyword match",
      disclaimer:
        "No known theme matched the token's name or symbol. That means this classifier has nothing to say about it — it does not mean the token has no narrative.",
    };
  }

  const primary = hits[0];
  const secondary = hits.slice(1, 3).map((h) => h.label.toLowerCase());

  return {
    theme: primary.label,
    summary:
      `The name and symbol read as ${primary.label.toLowerCase()}` +
      (secondary.length ? `, with ${secondary.join(" and ")} overtones` : "") +
      `. That is a category, not a story: it does not tell you whether the community behind it is real, whether it is a copy of something that already ran, or whether anyone will still care next week.`,
    keywords,
    quality: "inferred",
    source: "name and symbol keyword match",
    disclaimer:
      "Produced by matching the token's name and symbol against a fixed keyword list. It is not an assessment of the project, its team, or its prospects, and it is not generated from social data — we do not have X access.",
  };
}
