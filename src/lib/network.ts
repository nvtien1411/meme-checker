import { DEMO_LAUNCHES, type LaunchRecord } from "./launches";
import {
  median,
  walletProfile,
  type NetworkEdge,
  type NetworkNode,
  type WalletNetwork,
  type WalletProfile,
} from "./intel";

/* ==================================================================== *
 * GRAPH ALGEBRA
 *
 * Pure functions over the network `walletNetwork()` already produces. Nothing
 * here invents a relationship: every function takes the existing edges and
 * either walks them or measures them. If the data cannot answer a question,
 * the function returns null and the UI says so instead of drawing a guess.
 * ==================================================================== */

export interface Graph {
  nodes: Map<string, NetworkNode>;
  /** addr → edges touching it. Built once; `edges.filter` per render is O(n²). */
  adjacency: Map<string, NetworkEdge[]>;
  edges: NetworkEdge[];
  /** Only edges with two or more shared launches — the ones worth drawing. */
  strong: NetworkEdge[];
}

export function buildGraph(net: WalletNetwork, minTogether = 2): Graph {
  const nodes = new Map(net.nodes.map((n) => [n.addr, n]));
  const strong = net.edges.filter((e) => e.together >= minTogether);
  const adjacency = new Map<string, NetworkEdge[]>();
  for (const addr of nodes.keys()) adjacency.set(addr, []);
  for (const e of strong) {
    adjacency.get(e.a)?.push(e);
    adjacency.get(e.b)?.push(e);
  }
  return { nodes, adjacency, edges: net.edges, strong };
}

export function neighboursOf(g: Graph, addr: string): { addr: string; edge: NetworkEdge }[] {
  return (g.adjacency.get(addr) ?? [])
    .map((e) => ({ addr: e.a === addr ? e.b : e.a, edge: e }))
    .sort((x, y) => y.edge.together - x.edge.together || x.addr.localeCompare(y.addr));
}

/* ------------------------------------------------------------------ *
 * Path explorer
 *
 * Breadth-first over the drawn edges. Shortest number of hops, and among
 * equally short paths the one that runs through stronger co-appearance. This
 * is a path through shared launches, which is why the UI labels it that way —
 * it is not a funding trail and the copy never implies one.
 * ------------------------------------------------------------------ */

export interface WalletPath {
  addrs: string[];
  edges: NetworkEdge[];
  /** Hops, so a 3-wallet path is 2. */
  hops: number;
  /** Every shared launch along the path, per hop. */
  via: { symbol: string; a: string; b: string; together: number }[];
}

export function shortestPath(g: Graph, from: string, to: string): WalletPath | null {
  if (from === to) return { addrs: [from], edges: [], hops: 0, via: [] };
  if (!g.nodes.has(from) || !g.nodes.has(to)) return null;

  const prev = new Map<string, { addr: string; edge: NetworkEdge }>();
  const seen = new Set<string>([from]);
  let frontier = [from];
  let found = false;

  while (frontier.length && !found) {
    const next: string[] = [];
    for (const cur of frontier) {
      // strongest edges first, so a tie in hop count prefers the better-evidenced path
      const links = [...(g.adjacency.get(cur) ?? [])].sort((x, y) => y.together - x.together);
      for (const e of links) {
        const other = e.a === cur ? e.b : e.a;
        if (seen.has(other)) continue;
        seen.add(other);
        prev.set(other, { addr: cur, edge: e });
        if (other === to) {
          found = true;
          break;
        }
        next.push(other);
      }
      if (found) break;
    }
    frontier = next;
  }

  if (!prev.has(to)) return null;

  const addrs: string[] = [to];
  const edges: NetworkEdge[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = prev.get(cursor);
    if (!step) return null;
    edges.unshift(step.edge);
    addrs.unshift(step.addr);
    cursor = step.addr;
  }

  return {
    addrs,
    edges,
    hops: addrs.length - 1,
    via: edges.map((e) => ({
      symbol: e.symbols[0] ?? "—",
      a: e.a,
      b: e.b,
      together: e.together,
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Clusters
 *
 * Connected components over the strong edges. A component of one is a wallet
 * with no repeat partner — reported as a singleton rather than hidden, because
 * "this one stands alone" is itself a finding.
 * ------------------------------------------------------------------ */

export interface Cluster {
  id: number;
  addrs: string[];
  size: number;
  /** Launches where at least two members appeared together. */
  coLaunches: number;
  /** Symbols of those launches, for display. */
  symbols: string[];
  medianHoldMin: number | null;
  /** Total supply the cluster held at its largest, summed across members. */
  peakPct: number;
  /** Members that bought inside the creation block on every appearance. */
  allAtLaunch: string[];
}

export function clusters(g: Graph, launches: LaunchRecord[] = DEMO_LAUNCHES): Cluster[] {
  const seen = new Set<string>();
  const out: Cluster[] = [];

  const addrs = [...g.nodes.keys()].sort();

  for (const start of addrs) {
    if (seen.has(start)) continue;

    // BFS the strong edges to collect the component
    const members: string[] = [];
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      const cur = queue.shift() as string;
      members.push(cur);
      for (const e of g.adjacency.get(cur) ?? []) {
        const other = e.a === cur ? e.b : e.a;
        if (!seen.has(other)) {
          seen.add(other);
          queue.push(other);
        }
      }
    }

    const coLaunches = launches.filter(
      (l) => l.wallets.filter((w) => members.includes(w.addr)).length >= 2,
    );
    const profiles = members
      .map((a) => walletProfile(a, launches))
      .filter((p): p is WalletProfile => p !== null);

    const peakPct = Math.max(
      0,
      ...launches.map((l) =>
        l.wallets.filter((w) => members.includes(w.addr)).reduce((n, w) => n + w.bought, 0),
      ),
    );

    out.push({
      id: out.length,
      addrs: members,
      size: members.length,
      coLaunches: coLaunches.length,
      symbols: [...new Set(coLaunches.map((l) => l.symbol))],
      medianHoldMin: median(profiles.flatMap((p) => p.holds)),
      peakPct,
      allAtLaunch: profiles.filter((p) => p.bundleCount === p.launchCount).map((p) => p.addr),
    });
  }

  // biggest organised group first; singletons last
  return out.sort((a, b) => b.size - a.size || b.coLaunches - a.coLaunches);
}

/* ------------------------------------------------------------------ *
 * Comparison
 *
 * Two wallets, the same questions asked of both. Every row carries both
 * values so the reader can see where they differ, and a null where the data
 * does not exist rather than a zero that would read as "none".
 * ------------------------------------------------------------------ */

export interface CompareRow {
  label: string;
  a: string | null;
  b: string | null;
  /** Which side reads better, or null when neither does. */
  better: "a" | "b" | null;
  /** Tooltip-level explanation of what the row measures. */
  hint: string;
}

export interface WalletComparison {
  a: WalletProfile;
  b: WalletProfile;
  rows: CompareRow[];
  /** Launches both wallets appear on. */
  shared: LaunchRecord[];
  /** Wallets that share a launch with both, i.e. the bridge between them. */
  sharedNeighbours: string[];
  /** Path between them through shared launches, when one exists. */
  path: WalletPath | null;
}

function fmtMin(m: number | null): string | null {
  if (m === null) return null;
  if (m < 60) return `${m.toFixed(0)}m`;
  return `${(m / 60).toFixed(1)}h`;
}

function fmtPct(x: number | null): string | null {
  return x === null ? null : `${(x * 100).toFixed(0)}%`;
}

export function compareWallets(
  g: Graph,
  addrA: string,
  addrB: string,
  launches: LaunchRecord[] = DEMO_LAUNCHES,
): WalletComparison | null {
  const a = walletProfile(addrA, launches);
  const b = walletProfile(addrB, launches);
  if (!a || !b) return null;

  const na = neighboursOf(g, addrA).map((n) => n.addr);
  const nb = neighboursOf(g, addrB).map((n) => n.addr);
  const sharedNeighbours = na.filter((x) => nb.includes(x));

  const shared = launches.filter(
    (l) =>
      l.wallets.some((w) => w.addr === addrA) && l.wallets.some((w) => w.addr === addrB),
  );

  // Both hold longer / exit higher / fewer rugs / more launches is "better" for
  // reading intent, but the only rows worth opinionating on are hold time and
  // exit point. Everything else is stated, not scored.
  const rows: CompareRow[] = [
    {
      label: "launches on record",
      a: String(a.launchCount),
      b: String(b.launchCount),
      better: null,
      hint: "Recorded launches where this address appears in the tracked wallet set",
    },
    {
      label: "repeat partners",
      a: String(na.length),
      b: String(nb.length),
      better: null,
      hint: "Other wallets it shares two or more launches with",
    },
    {
      label: "median hold",
      a: fmtMin(a.medianHoldMin),
      b: fmtMin(b.medianHoldMin),
      better:
        a.medianHoldMin === null || b.medianHoldMin === null
          ? null
          : a.medianHoldMin > b.medianHoldMin
            ? "a"
            : a.medianHoldMin < b.medianHoldMin
              ? "b"
              : null,
      hint: "Median minutes between entering and its first sell, across every exit",
    },
    {
      label: "median exit vs peak",
      a: fmtPct(a.medianExitAtPeak),
      b: fmtPct(b.medianExitAtPeak),
      better:
        a.medianExitAtPeak === null || b.medianExitAtPeak === null
          ? null
          : a.medianExitAtPeak > b.medianExitAtPeak
            ? "a"
            : a.medianExitAtPeak < b.medianExitAtPeak
              ? "b"
              : null,
      hint: "Share of the peak it typically sells at — higher means it sells closer to the top",
    },
    {
      label: "launches that collapsed",
      a: `${a.rugCount} of ${a.launchCount}`,
      b: `${b.rugCount} of ${b.launchCount}`,
      better: a.rugCount === b.rugCount ? null : a.rugCount < b.rugCount ? "a" : "b",
      hint: "Launches it appeared on that later fell more than 90% from peak",
    },
    {
      label: "bought in creation block",
      a: `${a.bundleCount} of ${a.launchCount}`,
      b: `${b.bundleCount} of ${b.launchCount}`,
      better: null,
      hint: "Entries inside the first two seconds, which is the bundle signature",
    },
    {
      label: "median entry",
      a: a.medianEntrySec === null ? null : `${a.medianEntrySec.toFixed(0)}s`,
      b: b.medianEntrySec === null ? null : `${b.medianEntrySec.toFixed(0)}s`,
      better: null,
      hint: "Median seconds after the open at which it buys in",
    },
    {
      label: "supply bought, total",
      a: `${a.totalBought.toFixed(1)}%`,
      b: `${b.totalBought.toFixed(1)}%`,
      better: null,
      hint: "Sum of position sizes across every recorded launch",
    },
    {
      label: "share of positions sold",
      a: fmtPct(a.soldShare),
      b: fmtPct(b.soldShare),
      better: null,
      hint: "Of everything it bought, how much it has sold — pooled across launches",
    },
    {
      label: "still holding",
      a: a.stillHolding ? "yes" : "no",
      b: b.stillHolding ? "yes" : "no",
      better: null,
      hint: "Has any position it has not fully sold",
    },
  ];

  return { a, b, rows, shared, sharedNeighbours, path: shortestPath(g, addrA, addrB) };
}

/* ------------------------------------------------------------------ *
 * Explorer links
 *
 * `CHAINS.explorer` builds token URLs. A wallet needs the account path, and
 * Solana and the EVM explorers use different segment names, so this maps the
 * one to the other rather than forking the chain config.
 * ------------------------------------------------------------------ */

export function addressExplorer(explorerUrl: string): string {
  return explorerUrl.replace("/token/", "/account/").replace("/address/", "/address/");
}
