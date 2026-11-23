
/* ==================================================================== *
 * CALLER, NARRATIVE, OVERLAP INTELLIGENCE
 *
 * The same rule as the rest of this file: a number without rows behind it is
 * null, and a claim without a denominator is not shown. Everything here is
 * computed from the demo datasets so the UI cannot invent a figure.
 * ==================================================================== */

import { DEMO_CALLERS, DEMO_CALLS, DEMO_NARRATIVES, DEMO_RUGS, DEMO_TOKENS, type DemoCaller } from "./demo";
import type { BehaviourVerdict, WalletProfile } from "./intel";

/* ------------------------------------------------------------------ *
 * Callers
 * ------------------------------------------------------------------ */

export type CallerVerdict = "worth following" | "mixed" | "exit liquidity" | "insufficient history";

export interface CallerProfile {
  caller: DemoCaller;
  /** Win rate over recorded calls, 0-1. */
  winRate: number | null;
  /** Share of calls that never reached 2x. */
  deadShare: number | null;
  /** The one number that matters: exit price / price at post. */
  exitVsCall: number;
  /** Did they sell above the price their own post created. */
  sellsAboveCall: boolean;
  /** Seconds between their buy and their post. Negative = posted first. */
  lead: number;
  /** Percent already moved in the 3 minutes before the post. */
  preRun: number;
  /** Share of their own position sold after posting. */
  soldAfter: number;
  /** Calls on record in the dataset. */
  calls: number;
  verdict: CallerVerdict;
  /** The rows that produced the verdict. */
  evidence: string[];
  confidence: number;
}

export function callerProfile(caller: DemoCaller): CallerProfile {
  const winRate = caller.calls > 0 ? caller.wins / caller.calls : null;
  const deadShare = caller.calls > 0 ? caller.deadCalls / caller.calls : null;
  const sellsAboveCall = caller.exitVsCall > 1;

  const ev: string[] = [];
  if (sellsAboveCall) {
    ev.push(
      `Sold at ${caller.exitVsCall.toFixed(2)}x the price their own post produced — above the call, not with it`,
    );
  } else {
    ev.push(
      `Sold at ${caller.exitVsCall.toFixed(2)}x the price their post produced — below their own call`,
    );
  }
  ev.push(
    `${caller.soldAfter}% of their position was sold after followers had arrived`,
  );
  if (caller.lead < 0) {
    ev.push(`Bought ${Math.abs(caller.lead)}s before posting, not after`);
  } else if (caller.preRun > 20) {
    ev.push(`${caller.preRun}% of the move happened before the post`);
  }
  if (deadShare !== null && deadShare > 0.4) {
    ev.push(`${Math.round(deadShare * 100)}% of their calls never reached 2x`);
  }

  let verdict: CallerVerdict;
  let confidence = 0.5;
  if (caller.calls < 30) {
    verdict = "insufficient history";
    confidence = 0.2;
  } else if (sellsAboveCall && caller.soldAfter > 45) {
    verdict = "exit liquidity";
    confidence = 0.8;
  } else if (!sellsAboveCall && (winRate ?? 0) > 0.3) {
    verdict = "worth following";
    confidence = 0.7;
  } else {
    verdict = "mixed";
    confidence = 0.55;
  }

  return {
    caller,
    winRate,
    deadShare,
    exitVsCall: caller.exitVsCall,
    sellsAboveCall,
    lead: caller.lead,
    preRun: caller.preRun,
    soldAfter: caller.soldAfter,
    calls: caller.calls,
    verdict,
    evidence: ev,
    confidence,
  };
}

export function allCallerProfiles(): CallerProfile[] {
  return DEMO_CALLERS.map(callerProfile).sort((a, b) => {
    const rank = (v: CallerVerdict) =>
      v === "worth following" ? 0 : v === "mixed" ? 1 : v === "insufficient history" ? 3 : 2;
    return rank(a.verdict) - rank(b.verdict) || b.exitVsCall - a.exitVsCall;
  });
}

/* ------------------------------------------------------------------ *
 * Caller overlap — do the same accounts call the same token in the same
 * window, and is that a shared audience or a shared operator?
 * ------------------------------------------------------------------ */

export interface CallerOverlap {
  a: string;
  b: string;
  symbols: string[];
  /** Seconds between their posts on the tightest shared call. */
  tightestGapSec: number;
  sharedTokens: number;
}

export function callerOverlaps(): CallerOverlap[] {
  const out: CallerOverlap[] = [];
  const handles = [...new Set(DEMO_CALLS.map((c) => c.handle))];

  for (let i = 0; i < handles.length; i++) {
    for (let j = i + 1; j < handles.length; j++) {
      const abc = DEMO_CALLS.filter((c) => c.handle === handles[i]);
      const bbc = DEMO_CALLS.filter((c) => c.handle === handles[j]);
      const symbols: string[] = [];
      let tightest = Number.POSITIVE_INFINITY;

      for (const a of abc) {
        for (const b of bbc) {
          if (a.mint !== b.mint) continue;
          if (!symbols.includes(a.symbol)) symbols.push(a.symbol);
          const gap = Math.abs(new Date(a.at).getTime() - new Date(b.at).getTime()) / 1000;
          tightest = Math.min(tightest, gap);
        }
      }
      if (symbols.length === 0) continue;
      out.push({
        a: handles[i],
        b: handles[j],
        symbols,
        tightestGapSec: Number.isFinite(tightest) ? tightest : 0,
        sharedTokens: symbols.length,
      });
    }
  }
  return out.sort((x, y) => y.sharedTokens - x.sharedTokens || x.tightestGapSec - y.tightestGapSec);
}

/* ------------------------------------------------------------------ *
 * Narratives
 * ------------------------------------------------------------------ */

export type MetaFit = "early" | "crowded" | "recycled" | "dying" | "unclear";

export interface NarrativeAnalysis {
  name: string;
  tokens: number;
  mindshare7d: number;
  trend: string;
  /** Median hours a prior token held its peak before losing 90%. */
  medianLifespanHours: number | null;
  /** How many prior tokens are on record, with their peaks. */
  priorRuns: number;
  /** Share of prior tokens that already collapsed >90%. */
  collapsedShare: number | null;
  /** Biggest peak a prior attempt reached. */
  bestPeak: number | null;
  /** Copies per day, a saturation rate rather than a raw count. */
  copiesPerDay: number | null;
  fit: MetaFit;
  reason: string;
}

export function narrativeAnalysis(n: (typeof DEMO_NARRATIVES)[number]): NarrativeAnalysis {
  const closed = n.instances.filter((i) => i.hoursToMinus90 !== null);
  const lifespans = closed.map((i) => i.hoursToMinus90 as number);
  const collapsedShare =
    n.instances.length > 0 ? closed.length / n.instances.length : null;
  const bestPeak = n.instances.length ? Math.max(...n.instances.map((i) => i.peakMc)) : null;

  // Classification order matters: the earlier branches shadow the later ones,
  // and the first version had `dying` before `recycled`, which made recycled
  // unreachable. Each branch now states the case it is the best description of.
  let fit: MetaFit;
  let reason: string;

  const attention = n.trend;
  const priorCompleted = closed.length;

  if (n.tokens === 1 && priorCompleted === 0 && attention !== "rising") {
    // A single attempt with no completed cycle is not "early" — it is an
    // original, and calling a 26,000-hour token early would be a different
    // claim entirely.
    fit = "unclear";
    reason = "One attempt on record and no completed cycle. There is no pattern to read yet";
  } else if (n.tokens >= 8) {
    fit = "crowded";
    reason = `${n.tokens} attempts on record. By the time a token is the ${n.tokens}th copy, the buyers are other sellers`;
  } else if (attention === "peaking" && n.tokens >= 3) {
    fit = "recycled";
    reason = `${n.tokens} attempts, and attention is at its peak — the idea is being re-run on name recognition rather than novelty`;
  } else if (attention === "cooling") {
    fit = "dying";
    reason = "Mindshare is falling. A token can still run on a dying narrative, but it runs shorter";
  } else if (attention === "rising" && n.tokens <= 3) {
    fit = "early";
    reason = "Attention is climbing while the copy count is still low — the window where this works";
  } else if (n.tokens <= 3) {
    fit = "early";
    reason = `${n.tokens} attempts on record. Either the first real try or a name nobody has bothered with`;
  } else {
    fit = "unclear";
    reason = "Not enough attempts on record to call the pattern either way";
  }

  return {
    name: n.name,
    tokens: n.tokens,
    mindshare7d: n.mindshare7d,
    trend: n.trend,
    medianLifespanHours: median(lifespans),
    priorRuns: n.instances.length,
    collapsedShare,
    bestPeak,
    copiesPerDay: null,
    fit,
    reason,
  };
}

export function allNarratives(): NarrativeAnalysis[] {
  return DEMO_NARRATIVES.map(narrativeAnalysis).sort((a, b) => b.mindshare7d - a.mindshare7d);
}

/* ------------------------------------------------------------------ *
 * Deployer record
 * ------------------------------------------------------------------ */

export interface DeployerRecord {
  addr: string;
  launches: typeof DEMO_RUGS;
  launchCount: number;
  rugCount: number;
  rugRate: number | null;
  worstDrawdown: number | null;
  medianDrawdown: number | null;
  /** Days between the earliest and latest recorded launch. */
  activeDays: number | null;
  verdict: "serial rugger" | "mixed record" | "first launch" | "clean record";
  evidence: string[];
}

export function deployerRecord(addr: string): DeployerRecord | null {
  const launches = DEMO_RUGS.filter((r) => r.deployer === addr).sort((a, b) =>
    b.at.localeCompare(a.at),
  );
  if (launches.length === 0) return null;

  const drawdowns = launches.map((l) => l.drawdownPct);
  const rugCount = launches.filter((l) => l.drawdownPct >= 90).length;
  const dates = launches.map((l) => new Date(l.at).getTime()).sort((a, b) => a - b);
  const activeDays =
    dates.length > 1 ? Math.round((dates[dates.length - 1] - dates[0]) / 86_400_000) : null;

  const ev: string[] = [
    `${launches.length} launch${launches.length === 1 ? "" : "es"} on record`,
    `${rugCount} collapsed by more than 90%`,
  ];
  if (activeDays !== null) ev.push(`${activeDays} days between the first and the most recent`);

  let verdict: DeployerRecord["verdict"];
  if (launches.length === 1) verdict = "first launch";
  else if (rugCount / launches.length >= 0.75) verdict = "serial rugger";
  else if (rugCount === 0) verdict = "clean record";
  else verdict = "mixed record";

  return {
    addr,
    launches,
    launchCount: launches.length,
    rugCount,
    rugRate: rugCount / launches.length,
    worstDrawdown: drawdowns.length ? Math.max(...drawdowns) : null,
    medianDrawdown: median(drawdowns),
    activeDays,
    verdict,
    evidence: ev,
  };
}

/* ------------------------------------------------------------------ *
 * Token overlap — the question Compare actually needs to answer.
 *
 * Two tokens are compared on price, liquidity and concentration by every
 * scanner in existence. The question nobody answers is whether the same people
 * are behind both, which is the one that changes a decision.
 * ------------------------------------------------------------------ */

export interface TokenOverlap {
  a: string;
  b: string;
  shared: string[];
  /** Median behaviour of the shared wallets. */
  sharedRugRate: number | null;
  note: string;
}

export function tokenOverlaps(): TokenOverlap[] {
  const out: TokenOverlap[] = [];
  for (let i = 0; i < DEMO_TOKENS.length; i++) {
    for (let j = i + 1; j < DEMO_TOKENS.length; j++) {
      const ta = DEMO_TOKENS[i];
      const tb = DEMO_TOKENS[j];
      const bset = new Set(tb.wallets.map((w) => w.addr));
      const shared = ta.wallets.filter((w) => bset.has(w.addr)).map((w) => w.addr);
      if (shared.length === 0) continue;

      const rates = shared
        .map((addr) => {
          const w = ta.wallets.find((x) => x.addr === addr) ?? tb.wallets.find((x) => x.addr === addr);
          const launches = w?.priorLaunches ?? 0;
          const rugs = w?.priorRugs ?? 0;
          return launches > 0 ? rugs / launches : null;
        })
        .filter((r): r is number => r !== null);

      out.push({
        a: ta.symbol,
        b: tb.symbol,
        shared,
        sharedRugRate: median(rates),
        note:
          shared.length === 1
            ? "One shared wallet. Common in any launch crowd"
            : `${shared.length} shared wallets — the same group is buying both`,
      });
    }
  }
  return out.sort((x, y) => y.shared.length - x.shared.length);
}

/* median() lives in intel.ts; re-export the shape this file needs locally so it
   compiles without a circular import at module scope. */
function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* ------------------------------------------------------------------ *
 * Narrative wallets — who is inside the tokens on a given narrative
 *
 * The per-card question. A narrative card tells you the idea has run four
 * times; the question a reader has at that point is whether the same wallets
 * ran it, because that is what separates a fresh attempt from a rerun by the
 * same group.
 * ------------------------------------------------------------------ */

export interface NarrativeWalletRow {
  addr: string;
  behaviour: string;
  launches: number;
  rugCount: number;
  medianHoldMin: number | null;
  /** Tokens on this narrative the address appears in. */
  tokensHere: string[];
  firstOut: number;
  confidence: number;
}

export interface NarrativeWalletRead {
  narrative: string;
  rows: NarrativeWalletRow[];
  /** Addresses appearing in 2+ tokens of this narrative. */
  repeat: number;
  /** Median prior-collapse share across these wallets. */
  medianRugRate: number | null;
  /** How many of them bought the creation block on every token they are in. */
  blockZeroCount: number;
}

export function narrativeWallets(
  name: string,
  classify: (p: WalletProfile) => BehaviourVerdict,
  profileOf: (a: string) => WalletProfile | null,
  firstOutOf: (a: string) => number,
  tokens: { symbol: string; wallets: { addr: string; tags?: string[] }[] }[],
): NarrativeWalletRead {
  const tokensHere = tokens.map((t) => ({ symbol: t.symbol, addrs: t.wallets.map((w) => w.addr) }));
  const addrs = [...new Set(tokensHere.flatMap((t) => t.addrs))];

  const rows: NarrativeWalletRow[] = [];
  for (const addr of addrs) {
    const p = profileOf(addr);
    if (!p) continue;
    const b = classify(p);
    rows.push({
      addr,
      behaviour: b.label,
      launches: p.launchCount,
      rugCount: p.rugCount,
      medianHoldMin: p.medianHoldMin,
      tokensHere: tokensHere.filter((t) => t.addrs.includes(addr)).map((t) => t.symbol),
      firstOut: firstOutOf(addr),
      confidence: b.confidence,
    });
  }

  rows.sort((a, b) => b.tokensHere.length - a.tokensHere.length || b.launches - a.launches);

  const rates = rows
    .map((r) => (r.launches > 0 ? r.rugCount / r.launches : null))
    .filter((r): r is number => r !== null);

  return {
    narrative: name,
    rows,
    repeat: rows.filter((r) => r.tokensHere.length > 1).length,
    medianRugRate: median(rates),
    blockZeroCount: rows.filter((r) => r.behaviour === "block-0 bundler").length,
  };
}
