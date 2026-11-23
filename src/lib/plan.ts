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
      "Every bundle wallet, its age, and the wallet that funded it",
      "What each one bought, what it sold, and what it still holds",
      "Their record on other launches — how many ended in a collapse",
      "Sniper wallets classified by sold, transferred or still holding",
      "Insider supply traced back to the deployer wallet",
      "Fresh wallets and the funding source behind them",
      "Multi-hop funding trail with every hop timed",
      "Wallets that appear together across prior launches",
    ],
  },
  {
    group: "Callers",
    lead: "Free shows who posted. Pro shows what they did with their own money.",
    items: [
      "Full call history with win rate and dead-call share",
      "Median multiple across every call, zeros included",
      "Exit price against the price at the moment they posted",
      "Whether they bought before posting, and how long before",
      "Share of their position sold after followers arrived",
      "Smart followers — the wallets that repeat after each post",
      "Follower entry timing, and how many bought before the post",
      "Cross-caller wallet overlap and coordination signals",
    ],
  },
  {
    group: "Narrative",
    lead: "Free says what the story is. Pro says how many times it has run.",
    items: [
      "Copy index — where this token sits in its own cycle",
      "Prior instances with peak, time to peak, and time to collapse",
      "Organic attention: mentions with no contract address",
      "Usual lifespan for this narrative, from the prior tokens",
      "Similar projects and how each of them ended",
      "Whether the meta is rising, peaking or cooling",
    ],
  },
  {
    group: "Investigation",
    lead: "Free reads one token. Pro follows the entities behind it.",
    items: [
      "Wallet profiles with every appearance across tokens",
      "Deployer records: every launch, and how each one ended",
      "The funding tree from exchange to deployer to buyer",
      "Entity graph with every edge named and dated",
      "Saved investigations that keep updating",
      "Alerts on wallet behaviour, not on price",
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
