"use client";

/* ==================================================================== *
 * PLAN MODEL
 *
 * One place that defines what each tier gets, so the rail, the gates and the
 * plans page cannot disagree about where the line is. A product that says
 * "3 scans a day" in one place and "unlimited" in another has no line at all.
 * ==================================================================== */

export const SCAN_LIMIT = 3;

export type PlanId = "free" | "pro";

export const PLAN = {
  free: { label: "Free", price: 0, scansPerDay: SCAN_LIMIT },
  pro: { label: "Pro", price: 39, scansPerDay: null },
} as const;

/** What the paid layer adds, grouped by the question it answers. Used by the
 *  plans page, the rail card and the contextual upgrade strips — one source. */
export const PRO_VALUE: { group: string; lead: string; items: string[] }[] = [
  {
    group: "Wallets",
    lead: "Free tells you a bundle exists. Pro tells you who is in it.",
    items: [
      "A behaviour label per wallet derived from its launch history, with confidence",
      "Median holding time before the first sell, per address",
      "Whether it buys inside the creation block or after the crowd",
      "Its record on other launches — how many ended in a collapse",
      "Which wallet led the exit most often, launch by launch",
      "Every launch an address appears on, with the outcome of each",
      "Wallets that keep appearing together, and how many launches they share",
    ],
  },
  {
    group: "Callers",
    lead: "Free shows who posted. Pro shows what they did with their own money.",
    items: [
      "Exit price against the price at the moment they posted, per caller",
      "Win rate with dead calls counted — the ones that never touched 2x",
      "Whether they bought before posting, and how many seconds before",
      "Share of their own position sold after followers had arrived",
      "A verdict per caller: worth following, mixed, or exit liquidity",
      "Which callers posted the same contract inside the same fifteen minutes",
      "Smart followers: wallets that repeatedly buy after each post",
      "Follower quality — bot share, renamed accounts, pre-call move",
    ],
  },
  {
    group: "Narrative",
    lead: "Free says what the story is. Pro says how many times it has run.",
    items: [
      "Copy count against attention, per narrative — the saturation read",
      "Which narratives are early, crowded, recycled or dying, with the reason",
      "Median lifespan of prior tokens on the same idea before a 90% fall",
      "How many prior attempts collapsed, and the biggest peak any reached",
      "Prior instances with peak, time to peak, and time to collapse",
      "Whether the meta is rising, peaking or cooling, measured",
    ],
  },
  {
    group: "Deployers",
    lead: "Free counts the launches. Pro says what each one did.",
    items: [
      "Every token the address deployed, worst drawdown first",
      "Collapse rate and median drawdown across its launches",
      "How long it has been active, first launch to most recent",
      "A verdict: serial rugger, mixed record, clean record or first launch",
      "The funding tree from exchange to deployer, hop by hop",
      "Which wallets received supply before each public launch",
      "Alerts when this deployer launches again",
    ],
  },
  {
    group: "Cross-token",
    lead: "Free reads one token. Pro compares who is inside all of them.",
    items: [
      "Shared holders between every pair of compared tokens",
      "Pooled rug rate of the wallets that hold both",
      "Which of several compared tokens the group has already exited",
      "Every address that appeared in more than one of your scans",
      "Tokens on Discover ranked by the record of the wallets inside them",
      "Which wallets in a confirmed rug also appear in other confirmed rugs",
    ],
  },
  {
    group: "Workspace",
    lead: "Free keeps the list. Pro watches what the addresses on it do.",
    items: [
      "Behaviour of each watched address across every launch it appears on",
      "Whether it has sold since you added it, and at what point of the peak",
      "Addresses that keep appearing alongside your watched wallets",
      "Which watched callers are selling above their own call price",
      "Behavioural alert rules: cluster moves, deployer launches, insider transfers",
      "Filters on evidence rather than price alone",
    ],
  },
];

/** Free is not a demo — these are the questions it answers in full. */
export const FREE_VALUE: { group: string; items: string[] }[] = [
  {
    group: "Every contract check",
    items: [
      "Can you sell it — freeze authority, honeypot, transfer tax",
      "Is the supply fixed — mint authority and post-launch issuance",
      "Can the liquidity be pulled — LP lock, burn and pool ownership",
      "Risk score, band, and the worst findings with their sources",
    ],
  },
  {
    group: "Holder distribution",
    items: [
      "Top-10 concentration with pools, burns and curves removed",
      "Every top holder, its share and its balance",
      "Bundle and sniper counts as headline figures",
      "Deployer address and how much it holds",
    ],
  },
  {
    group: "Market reality",
    items: [
      "Price, market cap, liquidity, volume and token age",
      "How much you can sell before 5% slippage",
      "Trade flow: buys against sells, and distinct traders",
      "Which accounts posted the contract, with links to the posts",
    ],
  },
];

/** Scans used today. There is no account system yet, so this is a preview of
 *  the limit rather than an enforcement of it — and it never claims a number
 *  the session cannot know. */
export const SCAN_USED_KEY = "mc.scans.today";

export function readScansUsed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number.parseInt(window.localStorage.getItem(SCAN_USED_KEY) ?? "", 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

export function bumpScansUsed(): void {
  try {
    const n = readScansUsed();
    window.localStorage.setItem(SCAN_USED_KEY, String(n + 1));
    window.dispatchEvent(new Event("mc:quota"));
  } catch {
    /* storage blocked — the counter stays a preview */
  }
}
