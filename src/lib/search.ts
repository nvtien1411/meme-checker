import Fuse from "fuse.js";
import { DEMO_CALLERS, DEMO_NARRATIVES, DEMO_TOKENS, DEMO_WALLETS, shortAddr } from "./demo";
import { walletNetwork } from "./intel";

/* ==================================================================== *
 * SEARCH INDEX
 *
 * One flat index of everything a degen types into a search box: a ticker, a
 * contract, a wallet, a handle, a narrative. Built from the data the app
 * already has, so the palette can never return something the product cannot
 * open.
 *
 * Every result carries the route it goes to. A result you cannot click is a
 * worse lie than no result.
 * ==================================================================== */

export type ResultKind = "token" | "wallet" | "caller" | "deployer" | "narrative";

export interface SearchResult {
  kind: ResultKind;
  /** What the row is titled with. */
  label: string;
  /** Second line: symbol, launch count, follower count. */
  detail: string;
  /** Full string to match against, lowercased. */
  needle: string;
  href: string;
  /** Display accent, matching the rest of the product. */
  tone: string;
}

const TONE: Record<ResultKind, string> = {
  token: "#c6f24e",
  wallet: "#38bdf8",
  caller: "#ffb020",
  deployer: "#ff2d55",
  narrative: "#a855f7",
};

export const KIND_LABEL: Record<ResultKind, string> = {
  token: "token",
  wallet: "wallet",
  caller: "caller",
  deployer: "deployer",
  narrative: "narrative",
};

/** Roles that make an address a deployer rather than a participant. */
const DEPLOYER_ADDRS = new Set([DEMO_WALLETS.dev]);

function isDeployer(addr: string): boolean {
  return DEPLOYER_ADDRS.has(addr);
}

let cached: SearchResult[] | null = null;
let fuse: Fuse<SearchResult> | null = null;

export function buildIndex(): SearchResult[] {
  if (cached) return cached;

  const out: SearchResult[] = [];

  for (const t of DEMO_TOKENS) {
    out.push({
      kind: "token",
      label: `${t.symbol} · ${t.name}`,
      detail: `${t.chain} · $${t.mcap.toLocaleString("en-US")} mcap · risk ${t.score}`,
      needle: `${t.symbol} ${t.name} ${t.mint} ${t.chain}`.toLowerCase(),
      href: `/token/${t.chain}/${t.mint}`,
      tone: TONE.token,
    });
  }

  // Wallets come from the network, not the raw list: a wallet that appears in
  // no launch has no profile to open, so offering it would be a dead link.
  const net = walletNetwork();
  for (const n of net.nodes) {
    const deployer = isDeployer(n.addr);
    out.push({
      kind: deployer ? "deployer" : "wallet",
      label: shortAddr(n.addr, 8, 6),
      detail: deployer
        ? `deployer · ${n.profile.launchCount} launches`
        : `${n.behaviour.label} · ${n.profile.launchCount} launches · ${n.degree} partners`,
      needle: n.addr.toLowerCase(),
      href: deployer ? `/deployers/${n.addr}` : `/wallets/${n.addr}`,
      tone: deployer ? TONE.deployer : TONE.wallet,
    });
  }

  // Wallets present in the demo list but absent from any launch still get a row,
  // pointed at their profile — the page handles an empty history honestly.
  const seen = new Set(out.map((r) => r.needle));
  for (const [k, addr] of Object.entries(DEMO_WALLETS)) {
    if (seen.has(addr.toLowerCase())) continue;
    const deployer = isDeployer(addr);
    out.push({
      kind: deployer ? "deployer" : "wallet",
      label: shortAddr(addr, 8, 6),
      detail: `${deployer ? "deployer" : k.replace(/[0-9]/g, "")} · no recorded launch`,
      needle: addr.toLowerCase(),
      href: deployer ? `/deployers/${addr}` : `/wallets/${addr}`,
      tone: deployer ? TONE.deployer : TONE.wallet,
    });
  }

  for (const c of DEMO_CALLERS) {
    out.push({
      kind: "caller",
      label: `@${c.handle}`,
      detail: `${c.name} · ${c.calls} calls · ${(c.wins / Math.max(1, c.calls) * 100).toFixed(0)}% win`,
      needle: `${c.handle} ${c.name}`.toLowerCase(),
      href: `/callers/${c.handle}`,
      tone: TONE.caller,
    });
  }

  for (const n of DEMO_NARRATIVES) {
    out.push({
      kind: "narrative",
      label: n.name,
      detail: `${n.tokens} token${n.tokens === 1 ? "" : "s"} · ${n.trend} · ${n.survivalHours}h median life`,
      needle: n.name.toLowerCase(),
      href: "/narratives",
      tone: TONE.narrative,
    });
  }

  cached = out;
  fuse = new Fuse(out, {
    keys: [
      { name: "label", weight: 2 },
      { name: "needle", weight: 1 },
      { name: "detail", weight: 0.35 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return out;
}

/* ------------------------------------------------------------------ *
 * Matching
 *
 * Two passes. First exact / prefix / address, ranked by how specific the hit
 * is. Then Fuse for everything the first pass missed, so a misspelling still
 * lands somewhere instead of showing an empty palette. Fuse alone is not
 * enough: it will rank a fuzzy token above an exact ticker, and someone who
 * typed RATS means RATS.
 * ------------------------------------------------------------------ */

const ADDRESSISH = /^[1-9a-hj-np-z]{20,}$|^0x[a-f0-9]{20,}$/i;

export function search(q: string, limit = 18): SearchResult[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];

  const idx = buildIndex();
  const exact: { r: SearchResult; score: number }[] = [];
  const taken = new Set<string>();
  const isAddress = ADDRESSISH.test(needle);

  for (const r of idx) {
    const label = r.label.toLowerCase();

    let score = 0;
    if (isAddress && r.needle.includes(needle)) score += 1000;
    if (r.needle === needle) score += 600;
    if (label === needle) score += 400;
    else if (label.startsWith(needle)) score += 200;
    else if (label.includes(needle)) score += 90;
    else if (r.needle.includes(needle)) score += 40;
    if (score === 0) continue;

    // Shorter labels are usually the thing you meant.
    score -= Math.min(40, r.label.length / 4);
    exact.push({ r, score });
    taken.add(r.href + r.label);
  }

  exact.sort((a, b) => b.score - a.score);
  const out: SearchResult[] = exact.map((x) => x.r);

  // A pasted address should return the one thing it names, not a fuzzy cloud.
  if (!(isAddress && out.length > 0) && fuse) {
    for (const hit of fuse.search(needle)) {
      const key = hit.item.href + hit.item.label;
      if (taken.has(key)) continue;
      taken.add(key);
      out.push(hit.item);
    }
  }

  return out.slice(0, limit);
}

/** Group results for display, preserving the order each group first appeared. */
export function grouped(results: SearchResult[]): { kind: ResultKind; items: SearchResult[] }[] {
  const order: ResultKind[] = [];
  const bucket = new Map<ResultKind, SearchResult[]>();
  for (const r of results) {
    if (!bucket.has(r.kind)) {
      bucket.set(r.kind, []);
      order.push(r.kind);
    }
    bucket.get(r.kind)!.push(r);
  }
  return order.map((k) => ({ kind: k, items: bucket.get(k)! }));
}
