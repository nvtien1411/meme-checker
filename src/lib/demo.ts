/* ==================================================================== *
 * DEMO DATASET
 *
 * One dataset, referenced by every module, so the same wallet appearing in
 * Holders, Wallet Intelligence, Cabal Intelligence and Investigation is
 * literally the same record. That consistency is the whole demo: a mockup
 * where BTCWOLF has 3.1% on one page and 7.4% on another teaches nothing and
 * looks broken.
 *
 * Every entity carries `live: false`. Nothing here is presented as a chain
 * read. The UI labels it DEMO wherever a number from this file appears, and
 * real analysis from /api/analyze always wins over these records.
 * ==================================================================== */

export type Risk = "low" | "moderate" | "high" | "critical";

export interface DemoWallet {
  addr: string;
  label?: string;
  /** Where its opening balance came from, when traced in the demo story. */
  funder?: string;
  /** ISO date the wallet first moved funds. */
  born?: string;
  /** Launches this wallet has appeared on before this one. */
  priorLaunches?: number;
  priorRugs?: number;
  /** Behaviour tags — heuristic, never identity. */
  tags?: string[];
  /** Share of this token's supply it holds now. */
  pct?: number;
  /** Share it bought at launch. */
  bought?: number;
  /** Share of what it bought that it has sold. */
  sold?: number;
  /** Hours held before its first sell. */
  held?: number;
  /** Seconds from launch to its first sell. */
  firstSell?: number;
  avgEntry?: number;
  avgExit?: number;
  status?: "holding" | "sold" | "transferred";
}

export interface DemoCaller {
  handle: string;
  name: string;
  followers: number;
  /** Share of replies judged automated. */
  bots: number;
  /** Accounts that renamed themselves shortly before the call. */
  renamed: number;
  calls: number;
  wins: number;
  /** Multiple on the average win. */
  avgWin: number;
  /** Median multiple across every call, wins included. */
  median: number;
  best: number;
  worst: number;
  /** Share of calls that never touched 2x. */
  deadCalls: number;
  /** Seconds between their wallet buying and their post. Negative = post first. */
  lead: number;
  /** Percent already moved in the 3 minutes before the post. */
  preRun: number;
  /** Share of their own position sold after posting. */
  soldAfter: number;
  /** Their average exit divided by the price at the moment they posted. */
  exitVsCall: number;
  /** Wallets that repeatedly buy right after this account posts. */
  smartFollowers: number;
}

export interface DemoCall {
  handle: string;
  symbol: string;
  mint: string;
  at: string;
  mcAtCall: number;
  peakMc: number;
  hoursToPeak: number | null;
  outcome: "won" | "flat" | "lost";
  postUrl: string;
}

export interface DemoTimelineEvent {
  /** Minutes relative to the caller post; negative is before. */
  t: number;
  kind: "accumulate" | "post" | "follow" | "surge" | "distribute" | "react";
  text: string;
  wallets?: string[];
}

export interface DemoToken {
  mint: string;
  chain: string;
  name: string;
  symbol: string;
  ageHours: number;
  price: number;
  mcap: number;
  liq: number;
  vol24: number;
  holders: number;
  risk: Risk;
  score: number;
  narrative: string;
  copyIndex: number;
  organicScore: number;
  narrativeLifespanHours: number;
  bundleCount: number;
  bundlePct: number;
  sniperCount: number;
  sniperPct: number;
  insiderPct: number;
  freshCount: number;
  freshPct: number;
  exitWindowSec: number;
  sellSynchrony: number;
  /** Free-vs-VIP boundary is drawn in the UI, not here. */
  wallets: DemoWallet[];
}

/* ------------------------------------------------------------------ *
 * Wallets that recur across every module.
 * ------------------------------------------------------------------ */

const W = {
  /** Deployer of RATS and three prior launches. */
  dev: "3cJu879xPq7vXNbE2mKfTdRsWy4aHnLz8QpVd6Rdvyw",
  /** Cold wallet behind the bundle, funded from the same CEX hot wallet. */
  funder: "9xQeWvG816bUx9EPfMWuQrM7BUqgHQ1Kz3mRZpVnT4Ks",
  bundle1: "BBPzEyKTdRm3wXqNa4vJhSc8LkPyU2gFtZoQx6RRbMNk",
  bundle2: "7gi5osq2KxPa9VuLd3nRtYbXm8QcWj4HsSpEz1K96us9",
  bundle3: "D32Zb9mZQvNk8RtXyLp5HcJfW2sGdA7UeMi6YqXBeA6h",
  sniper1: "E6vTbPELq9Ks3UxZcR7nYpWmB4hJfD8gTaV2sLkQJwdxR6",
  sniper2: "H2rqFDGpX8vNbLc5TmYwK3sJqRd9UgZfA6EoPx4AVvuUE",
  insider1: "4TwCBYCKdNvQ7LmXpRs2JfH8bYgWzU5EaTk3Cn9nMbAAy",
  insider2: "6Tr5SQBNxWpL4RtYdKm8VcZfH2sJgU7EaQn5Bx3nNnYS4",
  /** A genuinely profitable wallet that shows up as a follower. */
  smart1: "8XB23iRpLdQ6TnYc4KsWmZ9VfHj2UbXa7EgP5Rt6b6bBTu",
  smart2: "Fq7YbN4xLdRp2KsWmZ8TnVcHj5UfXa3EgP9RtQb6LMd2A",
  /** Follower wallets are the interesting part: same group, every call. */
  fol1: "5Kd9WmRxTnQ2YbLc8VfHj4UsZa7EgP3RtQb6LdNxM1KpQ",
  fol2: "7TnQbLcVfHj4UsZa9EgP2Rt6LdNxM3KpQ8WmRdYb5XcZv",
  fol3: "2RtQb6LdNxM3KpQ8WmRdYb5XcZv7TnQbLcVfHj4UsZa9",
  fol4: "9EgP3RtQb6LdNxM1KpQ5WmRxTnQ2YbLc8VfHj7UsZa4",
};

/* ------------------------------------------------------------------ *
 * Tokens.
 * ------------------------------------------------------------------ */


/** The badge and the number must agree. `risk` used to be typed by hand beside
 *  a `score` that implied a different band — BONK carried "moderate" at 34,
 *  which the legend calls low. One function, derived from the score, and a
 *  compile-time check that nobody re-introduces the second source. */
export function riskBand(score: number): Risk {
  if (score >= 70) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

export const DEMO_TOKENS: DemoToken[] = [
  {
    mint: "CwnbD9FpaFSNou634knczXVCRUjTqmzwCrs3AiQvpump",
    chain: "solana",
    name: "Dancing Rats",
    symbol: "RATS",
    ageHours: 118,
    price: 0.0000463,
    mcap: 43823,
    liq: 15015,
    vol24: 34641,
    holders: 1174,
    risk: "high",
    score: 71,
    narrative: "Rodent mascot revival",
    copyIndex: 4,
    organicScore: 38,
    narrativeLifespanHours: 52,
    bundleCount: 3,
    bundlePct: 22.4,
    sniperCount: 2,
    sniperPct: 1.6,
    insiderPct: 6.2,
    freshCount: 1,
    freshPct: 0.3,
    exitWindowSec: 42,
    sellSynchrony: 0.71,
    wallets: [
      { addr: W.bundle1, funder: W.funder, born: "2026-11-06", priorLaunches: 7, priorRugs: 4, tags: ["bundler", "never sold"], pct: 18.7, bought: 18.9, sold: 0, avgEntry: 0.0000121, status: "holding" },
      { addr: W.bundle2, funder: W.funder, born: "2026-11-06", priorLaunches: 7, priorRugs: 4, tags: ["bundler"], pct: 2.4, bought: 2.5, sold: 4, firstSell: 880, held: 0.2, status: "holding" },
      { addr: W.bundle3, funder: W.funder, born: "2026-11-07", priorLaunches: 6, priorRugs: 3, tags: ["bundler"], pct: 1.1, bought: 1.4, sold: 21, firstSell: 1920, held: 0.5, status: "holding" },
      { addr: W.sniper1, born: "2026-11-08", priorLaunches: 19, priorRugs: 12, tags: ["sniper bot"], pct: 0.9, bought: 1.2, sold: 25, held: 0, firstSell: 340, status: "holding" },
      { addr: W.sniper2, born: "2026-11-08", priorLaunches: 16, priorRugs: 11, tags: ["sniper bot"], pct: 0.7, bought: 1.0, sold: 30, held: 0, firstSell: 620, status: "sold" },
      { addr: W.insider1, funder: W.dev, born: "2026-10-30", tags: ["insider", "funded by deployer"], pct: 3.4, bought: 0, sold: 0, status: "holding" },
      { addr: W.insider2, funder: W.dev, born: "2026-10-30", tags: ["insider"], pct: 2.8, bought: 0, sold: 12, status: "holding" },
      { addr: W.smart1, born: "2024-03-11", priorLaunches: 41, priorRugs: 2, tags: ["smart money", "early"], pct: 1.1, bought: 1.1, sold: 0, status: "holding" },
      { addr: W.smart2, born: "2023-09-02", priorLaunches: 63, priorRugs: 4, tags: ["smart money"], pct: 0.8, bought: 0.8, sold: 10, status: "holding" },
      { addr: W.fol1, born: "2026-11-19", tags: ["follower"], pct: 0.3, bought: 0.4, sold: 0, status: "holding" },
    ],
  },
  {
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    chain: "solana",
    name: "Bonk",
    symbol: "BONK",
    ageHours: 26000,
    price: 0.0000206,
    mcap: 1620000,
    liq: 206000,
    vol24: 512000,
    holders: 84200,
    risk: "moderate",
    score: 34,
    narrative: "OG dog coin",
    copyIndex: 1,
    organicScore: 81,
    narrativeLifespanHours: 9000,
    bundleCount: 0,
    bundlePct: 0,
    sniperCount: 3,
    sniperPct: 0.4,
    insiderPct: 1.1,
    freshCount: 1,
    freshPct: 0.2,
    exitWindowSec: 900,
    sellSynchrony: 0.04,
    wallets: [
      { addr: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", label: "LP pool", pct: 8.2, status: "holding" },
      { addr: W.smart1, born: "2024-03-11", priorLaunches: 41, tags: ["smart money"], pct: 0.4, status: "holding" },
      { addr: W.smart2, born: "2023-09-02", priorLaunches: 63, tags: ["smart money"], pct: 0.3, status: "holding" },
      { addr: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH", pct: 0.2, status: "holding" },
      { addr: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", pct: 0.18, status: "holding" },
    ],
  },
  {
    mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    chain: "solana",
    name: "Cat in a Hat",
    symbol: "CATWIF",
    ageHours: 9,
    price: 0.00124,
    mcap: 894000,
    liq: 96000,
    vol24: 1204000,
    holders: 2980,
    risk: "critical",
    score: 88,
    narrative: "Animal hat series",
    copyIndex: 11,
    organicScore: 19,
    narrativeLifespanHours: 18,
    bundleCount: 5,
    bundlePct: 41.2,
    sniperCount: 38,
    sniperPct: 17.8,
    insiderPct: 12.4,
    freshCount: 22,
    freshPct: 15.1,
    exitWindowSec: 11,
    sellSynchrony: 0.93,
    wallets: [
      { addr: W.bundle2, funder: W.funder, priorLaunches: 7, priorRugs: 4, tags: ["bundler"], pct: 21.4, bought: 21.6, sold: 0, status: "holding" },
      { addr: W.bundle3, funder: W.funder, priorLaunches: 6, priorRugs: 3, tags: ["bundler"], pct: 9.8, bought: 10.1, sold: 2, status: "holding" },
      { addr: W.insider1, funder: W.dev, tags: ["insider"], pct: 6.6, bought: 0, sold: 0, status: "holding" },
      { addr: W.sniper1, priorLaunches: 19, priorRugs: 12, tags: ["sniper bot"], pct: 3.4, bought: 4.0, sold: 14, status: "holding" },
      { addr: W.fol2, born: "2026-11-23", tags: ["follower"], pct: 0.4, bought: 0.5, status: "holding" },
    ],
  },
  {
    mint: "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump",
    chain: "solana",
    name: "Peanut the Squirrel",
    symbol: "PNUT",
    ageHours: 74,
    price: 0.0341,
    mcap: 3410000,
    liq: 402000,
    vol24: 1800000,
    holders: 12400,
    risk: "moderate",
    score: 41,
    narrative: "Political animal",
    copyIndex: 2,
    organicScore: 64,
    narrativeLifespanHours: 310,
    bundleCount: 1,
    bundlePct: 4.1,
    sniperCount: 6,
    sniperPct: 1.9,
    insiderPct: 2.2,
    freshCount: 3,
    freshPct: 1.4,
    exitWindowSec: 210,
    sellSynchrony: 0.22,
    wallets: [
      { addr: W.smart1, born: "2024-03-11", priorLaunches: 41, tags: ["smart money", "accumulating"], pct: 2.2, bought: 2.0, status: "holding" },
      { addr: W.smart2, born: "2023-09-02", priorLaunches: 63, tags: ["smart money"], pct: 1.4, bought: 1.2, status: "holding" },
      { addr: W.bundle1, funder: W.funder, priorLaunches: 7, priorRugs: 4, tags: ["bundler"], pct: 2.6, bought: 4.2, sold: 38, firstSell: 5400, held: 1.5, status: "holding" },
      { addr: "6QJWMeTu1gBHr8nS2VfHkLp9XaZcWm4RsNbYdE7tPqKv", pct: 3.0, status: "holding" },
    ],
  },
  {
    mint: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    chain: "bsc",
    name: "PancakeSwap",
    symbol: "CAKE",
    ageHours: 41000,
    price: 2.41,
    mcap: 741000000,
    liq: 39000000,
    vol24: 22000000,
    holders: 1904000,
    risk: "low",
    score: 12,
    narrative: "DEX token",
    copyIndex: 1,
    organicScore: 88,
    narrativeLifespanHours: 20000,
    bundleCount: 0,
    bundlePct: 0,
    sniperCount: 0,
    sniperPct: 0,
    insiderPct: 0.3,
    freshCount: 0,
    freshPct: 0,
    exitWindowSec: 3600,
    sellSynchrony: 0.01,
    wallets: [
      { addr: "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE", label: "LP pool", pct: 12.1, status: "holding" },
      { addr: "0xF977814e90dA44bFA03b6295A0616a897441aceC", label: "exchange", pct: 4.4, status: "holding" },
      { addr: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3", pct: 1.9, status: "holding" },
    ],
  },
];

/* risk is derived from score so the dot and the legend cannot disagree */
for (const t of DEMO_TOKENS) t.risk = riskBand(t.score);

export const DEMO_CALLERS: DemoCaller[] = [
  {
    handle: "ricofintech",
    name: "Rico",
    followers: 41200,
    bots: 31,
    renamed: 0,
    calls: 214,
    wins: 91,
    avgWin: 2.8,
    median: 1.4,
    best: 14.2,
    worst: 0.06,
    deadCalls: 43,
    lead: 96,
    preRun: 4,
    soldAfter: 12,
    exitVsCall: 0.91,
    smartFollowers: 37,
  },
  {
    handle: "cryptocole",
    name: "Cole",
    followers: 58400,
    bots: 62,
    renamed: 3,
    calls: 402,
    wins: 88,
    avgWin: 4.1,
    median: 1.1,
    best: 31.0,
    worst: 0.02,
    deadCalls: 71,
    lead: -142,
    preRun: 34,
    soldAfter: 64,
    exitVsCall: 1.62,
    smartFollowers: 6,
  },
  {
    handle: "lynk0x",
    name: "Lynk",
    followers: 22700,
    bots: 18,
    renamed: 0,
    calls: 97,
    wins: 54,
    avgWin: 3.4,
    median: 1.9,
    best: 9.8,
    worst: 0.11,
    deadCalls: 22,
    lead: 310,
    preRun: 1,
    soldAfter: 6,
    exitVsCall: 0.74,
    smartFollowers: 61,
  },
  {
    handle: "degenmira",
    name: "Mira",
    followers: 18900,
    bots: 74,
    renamed: 5,
    calls: 168,
    wins: 41,
    avgWin: 2.2,
    median: 0.9,
    best: 6.1,
    worst: 0.01,
    deadCalls: 68,
    lead: -420,
    preRun: 51,
    soldAfter: 81,
    exitVsCall: 2.14,
    smartFollowers: 3,
  },
  {
    handle: "soltrenches",
    name: "Trenches",
    followers: 96400,
    bots: 44,
    renamed: 1,
    calls: 611,
    wins: 233,
    avgWin: 2.6,
    median: 1.2,
    best: 22.4,
    worst: 0.03,
    deadCalls: 58,
    lead: 44,
    preRun: 9,
    soldAfter: 29,
    exitVsCall: 1.08,
    smartFollowers: 82,
  },
];

export const DEMO_CALLS: DemoCall[] = [
  { handle: "cryptocole", symbol: "RATS", mint: DEMO_TOKENS[0].mint, at: "2026-11-22T14:02:00Z", mcAtCall: 41000, peakMc: 612900, hoursToPeak: 6, outcome: "won", postUrl: "https://x.com/cryptocole" },
  { handle: "cryptocole", symbol: "CATWIF", mint: DEMO_TOKENS[2].mint, at: "2026-11-23T09:14:00Z", mcAtCall: 780000, peakMc: 894000, hoursToPeak: 1, outcome: "flat", postUrl: "https://x.com/cryptocole" },
  { handle: "cryptocole", symbol: "PNUT", mint: DEMO_TOKENS[3].mint, at: "2026-11-21T18:40:00Z", mcAtCall: 2900000, peakMc: 4100000, hoursToPeak: 9, outcome: "won", postUrl: "https://x.com/cryptocole" },
  { handle: "cryptocole", symbol: "BONK", mint: DEMO_TOKENS[1].mint, at: "2026-11-19T03:11:00Z", mcAtCall: 1520000, peakMc: 1620000, hoursToPeak: 30, outcome: "flat", postUrl: "https://x.com/cryptocole" },
  { handle: "cryptocole", symbol: "MOGX", mint: "9mXq3BgT7rLpNv2KcWfHj5UsZa8EgP4RtQb6LdNxM1Kq", at: "2026-11-17T22:05:00Z", mcAtCall: 340000, peakMc: 52000, hoursToPeak: null, outcome: "lost", postUrl: "https://x.com/cryptocole" },
  { handle: "degenmira", symbol: "RATS", mint: DEMO_TOKENS[0].mint, at: "2026-11-22T14:08:00Z", mcAtCall: 46000, peakMc: 612900, hoursToPeak: 6, outcome: "won", postUrl: "https://x.com/degenmira" },
  { handle: "degenmira", symbol: "CATWIF", mint: DEMO_TOKENS[2].mint, at: "2026-11-23T09:20:00Z", mcAtCall: 820000, peakMc: 894000, hoursToPeak: 1, outcome: "flat", postUrl: "https://x.com/degenmira" },
  { handle: "lynk0x", symbol: "RATS", mint: DEMO_TOKENS[0].mint, at: "2026-11-22T13:56:00Z", mcAtCall: 38200, peakMc: 612900, hoursToPeak: 6, outcome: "won", postUrl: "https://x.com/lynk0x" },
  { handle: "lynk0x", symbol: "PNUT", mint: DEMO_TOKENS[3].mint, at: "2026-11-21T18:31:00Z", mcAtCall: 2750000, peakMc: 4100000, hoursToPeak: 9, outcome: "won", postUrl: "https://x.com/lynk0x" },
  { handle: "soltrenches", symbol: "CATWIF", mint: DEMO_TOKENS[2].mint, at: "2026-11-23T09:02:00Z", mcAtCall: 610000, peakMc: 894000, hoursToPeak: 1, outcome: "won", postUrl: "https://x.com/soltrenches" },
  { handle: "soltrenches", symbol: "RATS", mint: DEMO_TOKENS[0].mint, at: "2026-11-22T13:49:00Z", mcAtCall: 35400, peakMc: 612900, hoursToPeak: 6, outcome: "won", postUrl: "https://x.com/soltrenches" },
];

/** RATS: the full coordinated-call story, minute by minute. */
export const DEMO_TIMELINE: DemoTimelineEvent[] = [
  { t: -30, kind: "accumulate", text: "Bundle wallets buy 22.4% in the launch block", wallets: [W.bundle1, W.bundle2, W.bundle3] },
  { t: -12, kind: "accumulate", text: "Insider wallets funded by the deployer receive 6.2%", wallets: [W.insider1, W.insider2] },
  { t: -3, kind: "surge", text: "Price already up 34% on no public post", wallets: [W.bundle2] },
  { t: 0, kind: "post", text: "@cryptocole posts the contract", wallets: [] },
  { t: 2, kind: "post", text: "@degenmira posts the same contract", wallets: [] },
  { t: 3, kind: "follow", text: "First follower wallet buys", wallets: [W.fol1, W.fol2] },
  { t: 12, kind: "surge", text: "Follower inflow accelerates — 41 wallets in 6 minutes", wallets: [W.fol1, W.fol2, W.fol3, W.fol4] },
  { t: 25, kind: "distribute", text: "Bundle wallet begins selling into the inflow", wallets: [W.bundle1] },
  { t: 40, kind: "react", text: "Price draws down 38% from the post-call high", wallets: [] },
];

/* ------------------------------------------------------------------ *
 * Narrative instances — what happened the last times this idea ran.
 * ------------------------------------------------------------------ */

export const DEMO_NARRATIVES = [
  { name: "Rodent mascot revival", tokens: 4, mindshare7d: 6.2, trend: "cooling" as const, survivalHours: 52, instances: [
    { symbol: "RATIO", peakMc: 4200000, hoursToPeak: 6, hoursToMinus90: 34 },
    { symbol: "MICE", peakMc: 890000, hoursToPeak: 3, hoursToMinus90: 12 },
    { symbol: "SQUEAK", peakMc: 210000, hoursToPeak: 2, hoursToMinus90: 8 },
  ]},
  { name: "Animal hat series", tokens: 11, mindshare7d: 14.8, trend: "peaking" as const, survivalHours: 18, instances: [
    { symbol: "CATWIF", peakMc: 894000, hoursToPeak: 1, hoursToMinus90: null },
    { symbol: "DOGWIF", peakMc: 6100000, hoursToPeak: 4, hoursToMinus90: 19 },
    { symbol: "FROGWIF", peakMc: 2400000, hoursToPeak: 2, hoursToMinus90: 11 },
  ]},
  { name: "Political animal", tokens: 2, mindshare7d: 22.4, trend: "rising" as const, survivalHours: 310, instances: [
    { symbol: "PNUT", peakMc: 3410000, hoursToPeak: 9, hoursToMinus90: null },
    { symbol: "FRED", peakMc: 1800000, hoursToPeak: 7, hoursToMinus90: 96 },
  ]},
  { name: "OG dog coin", tokens: 1, mindshare7d: 9.1, trend: "stable" as const, survivalHours: 9000, instances: [
    { symbol: "BONK", peakMc: 1620000, hoursToPeak: 30, hoursToMinus90: null },
  ]},
];

/* ------------------------------------------------------------------ *
 * Rug database.
 * ------------------------------------------------------------------ */

export const DEMO_RUGS = [
  { symbol: "PEACH", mint: "61yuZf1JyTKqoCfS784SusFGVekA6YUsGTfDg3o6pump", chain: "solana", at: "2026-11-23", peakMc: 612900, drawdownPct: 99.8, deployer: W.dev, flag: "confirmed" as const, signals: ["bundle 41%", "sell synchrony 93%", "exit window 11s"] },
  { symbol: "MOGX", mint: "9mXq3BgT7rLpNv2KcWfHj5UsZa8EgP4RtQb6LdNxM1Kq", chain: "solana", at: "2026-11-18", peakMc: 340000, drawdownPct: 84.7, deployer: W.dev, flag: "confirmed" as const, signals: ["dev moved 20% to fresh wallet", "LP not burned"] },
  { symbol: "TRIPLET", mint: "4kPxcrQ7vNbLc3TmYwK8sJqRd9UgZfA2EoPx6AVvuUE1", chain: "solana", at: "2026-11-15", peakMc: 1240000, drawdownPct: 91.2, deployer: W.bundle1, flag: "reported" as const, signals: ["same funder as PEACH", "3 prior launches"] },
  { symbol: "AIFP", mint: "8XB23iRpLdQ6TnYc4KsWmZ9VfHj2UbXa7EgP5Rt6b6bBTu", chain: "solana", at: "2026-11-12", peakMc: 780000, drawdownPct: 96.4, deployer: W.insider1, flag: "suspected" as const, signals: ["insider supply 34%", "no LP lock"] },
  { symbol: "JELLY", mint: "H2rqFDGpX8vNbLc5TmYwK3sJqRd9UgZfA6EoPx4AVvuUE2", chain: "solana", at: "2026-11-09", peakMc: 420000, drawdownPct: 99.1, deployer: W.dev, flag: "confirmed" as const, signals: ["4th launch by this deployer", "same funder wallet"] },
];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export function tokenByMint(mint: string): DemoToken | null {
  return DEMO_TOKENS.find((t) => t.mint.toLowerCase() === mint.toLowerCase()) ?? null;
}

export function callerByHandle(handle: string): DemoCaller | null {
  const h = handle.replace(/^@/, "").toLowerCase();
  return DEMO_CALLERS.find((c) => c.handle === h) ?? null;
}

export function callsByHandle(handle: string): DemoCall[] {
  const h = handle.replace(/^@/, "").toLowerCase();
  return DEMO_CALLS.filter((c) => c.handle === h);
}

export function callersForMint(mint: string): DemoCall[] {
  return DEMO_CALLS.filter((c) => c.mint.toLowerCase() === mint.toLowerCase());
}

export function shortAddr(a: string, head = 4, tail = 4): string {
  if (a.length <= head + tail + 2) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}

export const WALLET_ROLE: Record<string, string> = {
  [W.dev]: "deployer",
  [W.funder]: "shared funder",
  [W.bundle1]: "bundle",
  [W.bundle2]: "bundle",
  [W.bundle3]: "bundle",
  [W.sniper1]: "sniper",
  [W.sniper2]: "sniper",
  [W.insider1]: "insider",
  [W.insider2]: "insider",
  [W.smart1]: "smart money",
  [W.smart2]: "smart money",
  [W.fol1]: "follower",
  [W.fol2]: "follower",
  [W.fol3]: "follower",
  [W.fol4]: "follower",
};

export const DEMO_WALLETS = W;
