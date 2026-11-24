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
  return out;
}

/* ------------------------------------------------------------------ *
 * Matching
 *
 * Substring, ranked: exact prefix beats prefix beats contains, and a mint or
 * address match outranks a name match because someone pasting a 44-character
 * string wants that exact token, not a token whose name contains "pump".
 * ------------------------------------------------------------------ */

export function search(q: string, limit = 18): SearchResult[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];

  const idx = buildIndex();
  const scored: { r: SearchResult; score: number }[] = [];

  for (const r of idx) {
    const hay = r.needle;
    if (!hay.includes(needle)) continue;

    let score = 0;
    const label = r.label.toLowerCase();

    // An address or mint match is the most specific thing a user can type.
    if (hay === needle) score += 1000;
    else if (/^[1-9A-HJ-NP-Za-km-z]{20,}$|^0x[a-f0-9]{20,}$/i.test(needle) && hay.includes(needle))
      score += 500;

    if (label.startsWith(needle)) score += 200;
    else if (label.includes(needle)) score += 80;

    // Word-boundary match on the needle inside the label, e.g. "rats" in "RATS · Dancing Rats".
    if (new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) score += 60;

    // Shorter labels are usually the thing you meant.
    score -= Math.min(40, r.label.length / 4);

    scored.push({ r, score });
  }

  scored.sort((a, b) => b.score - a.score);

  // Dedupe by href so a wallet can't appear twice.
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const { r } of scored) {
    if (seen.has(r.href + r.label)) continue;
    seen.add(r.href + r.label);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
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
