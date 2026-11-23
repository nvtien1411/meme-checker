/* ==================================================================== *
 * INTELLIGENCE ENGINE
 *
 * Every number the paid layer shows is computed here from DEMO_LAUNCHES.
 * Nothing in this file is a written-down claim: a page that says "median hold
 * 37 minutes" is an assertion, a page that computes 37 from nine rows the
 * reader can inspect is evidence.
 *
 * The rules the rest of this file obeys:
 *
 *   - A metric with no rows behind it returns null, never 0. Zero is a
 *     measurement; null is the absence of one, and the UI must be able to tell
 *     them apart.
 *   - Every function is pure and deterministic so server and client render the
 *     same page.
 *   - Nothing here classifies intent. It counts behaviour that was observed,
 *     and names the observation precisely enough that a reader can disagree.
 * ==================================================================== */

import { DEMO_LAUNCHES, type LaunchRecord, type LaunchWallet } from "./launches";

/* ------------------------------------------------------------------ *
 * Statistics — median, not mean, because one whale exit skews a mean into
 * a number that describes no wallet that ever existed.
 * ------------------------------------------------------------------ */

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function pctChange(from: number, to: number): number | null {
  if (!Number.isFinite(from) || from <= 0) return null;
  return ((to - from) / from) * 100;
}

/* ------------------------------------------------------------------ *
 * Wallet history
 * ------------------------------------------------------------------ */

export interface WalletAppearance {
  launch: LaunchRecord;
  row: LaunchWallet;
  /** Was this wallet in the creation block — the bundle signature. */
  atLaunch: boolean;
  /** Minutes between the open and its first buy. */
  entryMin: number;
}

export interface WalletProfile {
  addr: string;
  appearances: WalletAppearance[];
  launchCount: number;
  rugCount: number;
  /** Share of its appearances that ended in a collapse, 0-1. */
  rugRate: number | null;
  /** Launches where it bought in the creation block. */
  bundleCount: number;
  /** Minutes held before first sell, across every exit it has made. */
  holds: number[];
  medianHoldMin: number | null;
  /** Share of the peak it typically exits at, when it exits. */
  medianExitAtPeak: number | null;
  /** Total supply it bought across launches, in percent. */
  totalBought: number;
  /** Share of its own positions it has sold, pooled. */
  soldShare: number | null;
  /** Still holding anything. */
  stillHolding: boolean;
  /** Median seconds after the open at which it enters. */
  medianEntrySec: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
}

export function walletProfile(addr: string, launches = DEMO_LAUNCHES): WalletProfile | null {
  const appearances: WalletAppearance[] = [];
  for (const launch of launches) {
    const row = launch.wallets.find((w) => w.addr === addr);
    if (!row) continue;
    appearances.push({
      launch,
      row,
      atLaunch: row.entrySec <= 2,
      entryMin: row.entrySec / 60,
    });
  }
  if (appearances.length === 0) return null;

  const rugCount = appearances.filter((a) => a.launch.rugged).length;
  const holds = appearances.map((a) => a.row.holdMin).filter((h): h is number => h !== null);
  const exits = appearances
    .map((a) => a.row.exitAtPeakFrac)
    .filter((f): f is number => f !== null);
  const totalBought = appearances.reduce((n, a) => n + a.row.bought, 0);
  const sold = appearances.filter((a) => a.row.sold > 0);
  const soldShare =
    totalBought > 0
      ? sold.reduce((n, a) => n + a.row.sold * (a.row.bought / 100), 0) / (totalBought / 100)
      : null;

  const dates = appearances.map((a) => a.launch.at).sort();

  return {
    addr,
    appearances,
    launchCount: appearances.length,
    rugCount,
    rugRate: appearances.length ? rugCount / appearances.length : null,
    bundleCount: appearances.filter((a) => a.atLaunch).length,
    holds,
    medianHoldMin: median(holds),
    medianExitAtPeak: median(exits),
    totalBought,
    soldShare,
    stillHolding: appearances.some((a) => a.row.sold < 100),
    medianEntrySec: median(appearances.map((a) => a.row.entrySec)),
    firstSeen: dates[0] ?? null,
    lastSeen: dates[dates.length - 1] ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Behaviour classification
 *
 * A wallet gets a behaviour name only when the rows support it, and the name
 * carries the numbers that produced it. "Sniper" alone is a vibe; "enters
 * inside 2s on 4 of 5 launches, exits at 0.31 of peak" is a finding.
 * ------------------------------------------------------------------ */

export type Behaviour =
  | "launch sniper"
  | "block-0 bundler"
  | "fast flipper"
  | "mid-curve seller"
  | "patient holder"
  | "insider supply"
  | "insufficient history";

export interface BehaviourVerdict {
  label: Behaviour;
  /** The rows that produced the label, phrased as evidence. */
  evidence: string[];
  /** 0-1. Below 0.4 the label should be presented as a guess, not a finding. */
  confidence: number;
}

export function classifyWallet(p: WalletProfile): BehaviourVerdict {
  const ev: string[] = [];
  const n = p.launchCount;

  if (n < 2) {
    return {
      label: "insufficient history",
      evidence: [`${n} launch on record — one launch cannot describe a pattern`],
      confidence: 0,
    };
  }

  const launchEntries = p.appearances.filter((a) => a.atLaunch).length;
  const launchShare = launchEntries / n;

  if (p.appearances.every((a) => a.row.bought === 0)) {
    return {
      label: "insider supply",
      evidence: [
        `Never bought on the open market across ${n} recorded launches`,
        "Supply arrived as a transfer, so there is no price at which it is forced to hold",
      ],
      confidence: 0.85,
    };
  }

  if (launchShare >= 0.75 && p.bundleCount >= 3) {
    ev.push(`Bought inside the creation block on ${launchEntries} of ${n} launches`);
    if (p.medianHoldMin !== null) {
      ev.push(`Median ${Math.round(p.medianHoldMin)} minutes before its first sell`);
    }
    if (p.medianExitAtPeak !== null) {
      ev.push(`Exits at a median ${(p.medianExitAtPeak * 100).toFixed(0)}% of the peak`);
    }
    return {
      label: launchShare === 1 ? "block-0 bundler" : "launch sniper",
      evidence: ev,
      confidence: Math.min(0.95, 0.5 + n * 0.08),
    };
  }

  if (p.medianHoldMin !== null && p.medianHoldMin < 60 && (p.medianExitAtPeak ?? 1) < 0.5) {
    return {
      label: "fast flipper",
      evidence: [
        `Median ${Math.round(p.medianHoldMin)} minutes held before the first sell`,
        `Exits at ${((p.medianExitAtPeak ?? 0) * 100).toFixed(0)}% of the peak — it leaves before the top`,
      ],
      confidence: 0.7,
    };
  }

  if (p.medianHoldMin !== null && p.medianHoldMin >= 240) {
    return {
      label: "patient holder",
      evidence: [
        `Median ${(p.medianHoldMin / 60).toFixed(1)} hours held before the first sell`,
        `Only ${((p.rugRate ?? 0) * 100).toFixed(0)}% of its launches collapsed`,
      ],
      confidence: 0.65,
    };
  }

  return {
    label: "mid-curve seller",
    evidence: [
      `Median ${Math.round(p.medianHoldMin ?? 0)} minutes before the first sell`,
      `Exits at ${((p.medianExitAtPeak ?? 0) * 100).toFixed(0)}% of the peak`,
    ],
    confidence: 0.55,
  };
}

/* ------------------------------------------------------------------ *
 * Bundle group behaviour — the collective read, which is what actually
 * predicts what happens next. One wallet selling is noise; nine selling in
 * the same slot is the event.
 * ------------------------------------------------------------------ */

export interface GroupBehaviour {
  wallets: WalletProfile[];
  /** Launches where at least two of this group appeared together. */
  coLaunches: LaunchRecord[];
  medianHoldMin: number | null;
  medianExitAtPeak: number | null;
  /** Median gap in minutes between the first and last of them selling, per launch. */
  medianExitSpreadMin: number | null;
  /** Launches where the group's exit preceded a >90% fall. */
  collapsesAfterExit: number;
  /** Did they exit together or in sequence, measured rather than asserted. */
  style: "simultaneous" | "staggered" | "unknown";
  /** Total supply the group held at its largest. */
  peakGroupPct: number;
}

export function groupBehaviour(addrs: string[], launches = DEMO_LAUNCHES): GroupBehaviour {
  const profiles = addrs
    .map((a) => walletProfile(a, launches))
    .filter((p): p is WalletProfile => p !== null);

  const coLaunches = launches.filter(
    (l) => l.wallets.filter((w) => addrs.includes(w.addr)).length >= 2,
  );

  const holds = profiles.flatMap((p) => p.holds);
  const exits = profiles
    .map((p) => p.medianExitAtPeak)
    .filter((f): f is number => f !== null);

  const spreads: number[] = [];
  for (const l of coLaunches) {
    const rows = l.wallets.filter((w) => addrs.includes(w.addr) && w.holdMin !== null);
    if (rows.length < 2) continue;
    const hs = rows.map((r) => r.holdMin as number);
    spreads.push(Math.max(...hs) - Math.min(...hs));
  }

  const spread = median(spreads);
  const collapsesAfterExit = coLaunches.filter((l) => l.rugged).length;

  return {
    wallets: profiles,
    coLaunches,
    medianHoldMin: median(holds),
    medianExitAtPeak: median(exits),
    medianExitSpreadMin: spread,
    collapsesAfterExit,
    style:
      spread === null ? "unknown" : spread <= 15 ? "simultaneous" : spread <= 90 ? "staggered" : "unknown",
    peakGroupPct: Math.max(
      0,
      ...launches.map((l) =>
        l.wallets.filter((w) => addrs.includes(w.addr)).reduce((n, w) => n + w.bought, 0),
      ),
    ),
  };
}

/* ------------------------------------------------------------------ *
 * Wallet network
 *
 * Edges are co-appearance on a launch, not a claimed funding link. The two are
 * different claims with different strength, and conflating them is how wallet
 * graph products end up accusing people.
 * ------------------------------------------------------------------ */

export interface NetworkEdge {
  a: string;
  b: string;
  /** Launches both appear on. */
  together: number;
  /** Symbols, for display. */
  symbols: string[];
  /** Both entered in the creation block on every shared launch. */
  alwaysAtLaunch: boolean;
}

export interface NetworkNode {
  addr: string;
  profile: WalletProfile;
  behaviour: BehaviourVerdict;
  /** Co-appearances with anyone else in the network. */
  degree: number;
}

export interface WalletNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  /** Wallets appearing on more launches than any other wallet it shares with. */
  core: string[];
}

export function walletNetwork(launches = DEMO_LAUNCHES): WalletNetwork {
  const count = new Map<string, WalletProfile>();
  for (const l of launches) {
    for (const w of l.wallets) {
      if (!count.has(w.addr)) {
        const p = walletProfile(w.addr, launches);
        if (p) count.set(w.addr, p);
      }
    }
  }

  const addrs = [...count.keys()];
  const edges: NetworkEdge[] = [];
  for (let i = 0; i < addrs.length; i++) {
    for (let j = i + 1; j < addrs.length; j++) {
      const shared = launches.filter(
        (l) =>
          l.wallets.some((w) => w.addr === addrs[i]) && l.wallets.some((w) => w.addr === addrs[j]),
      );
      if (shared.length === 0) continue;
      const bothAtLaunch = shared.every((l) => {
        const a = l.wallets.find((w) => w.addr === addrs[i]);
        const b = l.wallets.find((w) => w.addr === addrs[j]);
        return (a?.entrySec ?? 99) <= 2 && (b?.entrySec ?? 99) <= 2;
      });
      edges.push({
        a: addrs[i],
        b: addrs[j],
        together: shared.length,
        symbols: shared.map((l) => l.symbol),
        alwaysAtLaunch: bothAtLaunch,
      });
    }
  }

  const degree = new Map<string, number>();
  for (const e of edges) {
    if (e.together < 2) continue;
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }

  const nodes: NetworkNode[] = addrs.map((addr) => {
    const profile = count.get(addr) as WalletProfile;
    return {
      addr,
      profile,
      behaviour: classifyWallet(profile),
      degree: degree.get(addr) ?? 0,
    };
  });

  return {
    nodes,
    edges: edges.sort((x, y) => y.together - x.together),
    core: [...degree.entries()]
      .filter(([, d]) => d >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([a]) => a),
  };
}

/* ------------------------------------------------------------------ *
 * Exit ordering — who leaves first, which is the question a holder actually
 * has. The bundle is not dangerous because it exists; it is dangerous because
 * of the order in which it leaves.
 * ------------------------------------------------------------------ */

export interface ExitOrderRow {
  addr: string;
  symbol: string;
  holdMin: number;
  exitAtPeakFrac: number | null;
  /** 1 = left first among that launch's tracked wallets. */
  position: number;
  /** How many tracked wallets left after it. */
  beforeCount: number;
}

export function exitOrdering(launches = DEMO_LAUNCHES): ExitOrderRow[] {
  const out: ExitOrderRow[] = [];
  for (const l of launches) {
    const sold = l.wallets
      .filter((w) => w.holdMin !== null)
      .sort((a, b) => (a.holdMin as number) - (b.holdMin as number));
    sold.forEach((w, i) => {
      out.push({
        addr: w.addr,
        symbol: l.symbol,
        holdMin: w.holdMin as number,
        exitAtPeakFrac: w.exitAtPeakFrac,
        position: i + 1,
        beforeCount: sold.length - i - 1,
      });
    });
  }
  return out;
}

/** How often a given wallet was the first to sell. */
export function firstOutCount(addr: string, launches = DEMO_LAUNCHES): number {
  return exitOrdering(launches).filter((r) => r.addr === addr && r.position === 1).length;
}

/* ------------------------------------------------------------------ *
 * Cross-token memory
 *
 * "This wallet appeared in 6 tokens you scanned" only becomes real once a
 * scan history exists. What can be said honestly today is which recorded
 * launches an address appears in — so that is what is computed.
 * ------------------------------------------------------------------ */

export interface CrossTokenMemory {
  addr: string;
  launches: { symbol: string; at: string; bought: number; sold: number; rugged: boolean }[];
  /** Launches where it was present that a reader would not have seen from this page. */
  extra: number;
}

export function crossTokenMemory(addr: string, launches = DEMO_LAUNCHES): CrossTokenMemory | null {
  const p = walletProfile(addr, launches);
  if (!p) return null;
  return {
    addr,
    launches: p.appearances.map((a) => ({
      symbol: a.launch.symbol,
      at: a.launch.at,
      bought: a.row.bought,
      sold: a.row.sold,
      rugged: a.launch.rugged,
    })),
    extra: p.appearances.length - 1,
  };
}
