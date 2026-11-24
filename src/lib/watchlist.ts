/* ==================================================================== *
 * WATCHLIST — client-side, no account
 *
 * There was no way to save anything. A degen reading a report had no button to
 * keep it, so the only way back was to remember the contract address. That is
 * the single largest friction point in the product and it needed no backend:
 * a list of mints in localStorage is enough to make "save it" work.
 *
 * What it deliberately is not: synced, shared, or a substitute for alerts. The
 * UI says where the list lives.
 * ==================================================================== */

export type WatchKind = "token" | "wallet" | "deployer";

export interface WatchedItem {
  kind: WatchKind;
  /** mint, wallet address, or deployer address. */
  id: string;
  /** Ticker for tokens, short address for wallets, so the list is readable. */
  label: string;
  /** Where opening it goes. */
  href: string;
  /** ISO timestamp of when it was saved. */
  at: string;
}

const KEY = "mc.watchlist";

/** Fired on every change so any mounted list re-reads without prop drilling. */
export const WATCH_EVENT = "mc:watchlist";

/** In-memory mirror, used when storage is blocked (private mode, quota). */
let mirror: WatchedItem[] = [];

export function readWatchlist(): WatchedItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return mirror;
    const parsed = JSON.parse(raw) as WatchedItem[];
    mirror = Array.isArray(parsed) ? parsed : [];
    return mirror;
  } catch {
    return mirror;
  }
}

function write(items: WatchedItem[]) {
  mirror = items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage blocked: the in-memory list still works for this session
  }
  window.dispatchEvent(new Event(WATCH_EVENT));
}

export function isWatched(kind: WatchKind, id: string): boolean {
  return readWatchlist().some((w) => w.kind === kind && w.id === id);
}

/** Returns the new state, so a caller can announce what happened. */
export function toggleWatched(kind: WatchKind, id: string, label: string, href: string): boolean {
  const items = readWatchlist();
  const exists = items.some((w) => w.kind === kind && w.id === id);
  if (exists) {
    write(items.filter((w) => !(w.kind === kind && w.id === id)));
    return false;
  }
  write([{ kind, id, label, href, at: new Date().toISOString() }, ...items]);
  return true;
}

export function removeWatched(kind: WatchKind, id: string) {
  write(readWatchlist().filter((w) => !(w.kind === kind && w.id === id)));
}
