"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel, Tag } from "@/components/ui";
import { WATCH_EVENT, readWatchlist, removeWatched, type WatchedItem } from "@/lib/watchlist";
import { NextSteps } from "@/components/NextSteps";

/* ==================================================================== *
 * WATCHLIST — the list you actually made
 *
 * This page used to render DEMO_TOKENS.slice(0, 4) with invented "added 2h
 * ago" timestamps and invented notes. It looked like a feature and was a
 * picture of one.
 *
 * It now reads the real saved list. If you have saved nothing it says so and
 * tells you where the button is, which is more useful than four fake rows.
 * ==================================================================== */

const KIND_LABEL: Record<WatchedItem["kind"], string> = {
  token: "token",
  wallet: "wallet",
  deployer: "deployer",
};

const KIND_TONE: Record<WatchedItem["kind"], string> = {
  token: "#c6f24e",
  wallet: "#38bdf8",
  deployer: "#ff2d55",
};

function relTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  const m = Math.max(0, (Date.now() - ms) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m.toFixed(0)}m ago`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(0)}h ago`;
  return `${(h / 24).toFixed(0)}d ago`;
}

export function WatchlistClient() {
  const [items, setItems] = useState<WatchedItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | WatchedItem["kind"]>("all");

  // localStorage has no server value, so the first paint is a loading state
  // rather than an empty list that flashes to filled.
  useEffect(() => {
    const sync = () => setItems(readWatchlist());
    sync();
    window.addEventListener(WATCH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const shown = (items ?? []).filter((w) => filter === "all" || w.kind === filter);

  return (
    <div>
      <div className="border-b border-line px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="t-section text-fg">Watchlist</h1>
          <span className="t-xs text-fg4">
            saved in this browser — no account, no sync
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Tag tone="neutral">
              {items === null ? "…" : `${items.length} saved`}
            </Tag>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-3 sm:p-4">
        {items !== null && items.length > 0 && (
          <div className="panel flex flex-wrap items-center gap-1 px-2 py-1">
            <span className="t-eyebrow mr-0.5">show</span>
            {(["all", "token", "wallet", "deployer"] as const).map((k) => {
              const n = k === "all" ? items.length : items.filter((w) => w.kind === k).length;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  aria-pressed={filter === k}
                  disabled={n === 0}
                  className={`border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${
                    filter === k
                      ? "border-acid/45 bg-acid/10 text-acid"
                      : n === 0
                        ? "border-line/50 text-fg4/35"
                        : "border-line text-fg4 hover:border-line2 hover:text-fg2"
                  }`}
                >
                  {k}
                  <span className="ml-1 tabular-nums opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {items === null && (
          <Panel>
            <p className="t-xs text-fg4">Reading saved list…</p>
          </Panel>
        )}

        {items !== null && items.length === 0 && (
          <Panel title="Nothing saved yet" note="the watch button is on every token header and wallet profile">
            <p className="t-xs leading-relaxed text-fg3">
              Open a token, a wallet or a deployer and press <span className="text-acid">watch</span>{" "}
              in the header. It saves here, in this browser, with the time you added it
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link
                href="/"
                className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase text-fg3 hover:border-acid hover:text-acid"
              >
                scan a token →
              </Link>
              <Link
                href="/wallets"
                className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase text-fg3 hover:border-acid hover:text-acid"
              >
                browse wallets →
              </Link>
              <Link
                href="/deployers"
                className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase text-fg3 hover:border-acid hover:text-acid"
              >
                browse deployers →
              </Link>
            </div>
          </Panel>
        )}

        {shown.length > 0 && (
          <Panel flush>
            <div className="grid grid-cols-[minmax(0,1fr)_70px_64px_28px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-2.5 py-1">
              <span className="t-eyebrow">saved</span>
              <span className="t-eyebrow text-right">type</span>
              <span className="t-eyebrow text-right">added</span>
              <span />
            </div>
            {shown.map((w) => (
              <div
                key={w.kind + w.id}
                className="drow grid grid-cols-[minmax(0,1fr)_70px_64px_28px] items-center gap-x-2 border-b border-line px-2.5 py-[6px] last:border-b-0"
              >
                <Link href={w.href} className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-[4px] w-[4px] shrink-0"
                    style={{ background: KIND_TONE[w.kind] }}
                  />
                  <span className="truncate t-strong text-fg hover:text-acid">{w.label}</span>
                  <span className="hidden shrink-0 truncate font-mono text-[9px] text-fg4 sm:inline">
                    {w.id.length > 16 ? `${w.id.slice(0, 6)}…${w.id.slice(-4)}` : w.id}
                  </span>
                </Link>
                <span className="text-right font-mono text-[9px] uppercase text-fg4">
                  {KIND_LABEL[w.kind]}
                </span>
                <span className="text-right font-mono text-[9px] text-fg4">{relTime(w.at)}</span>
                <button
                  type="button"
                  onClick={() => removeWatched(w.kind, w.id)}
                  title="Remove from watchlist"
                  aria-label={`Remove ${w.label} from watchlist`}
                  className="justify-self-end px-1 font-mono text-[11px] leading-none text-fg4 hover:text-bad"
                >
                  ×
                </button>
              </div>
            ))}
          </Panel>
        )}

        {items !== null && items.length > 0 && shown.length === 0 && (
          <Panel>
            <p className="t-xs text-fg4">Nothing saved as {filter}</p>
          </Panel>
        )}

        <NextSteps
          title="What a watchlist is for"
          steps={[
            {
              from: "You saved a token to see what happens",
              to: "Set the rule that tells you first",
              href: "/alerts",
              tone: "acid",
            },
            {
              from: "A wallet you saved moved",
              to: "Who it moved with",
              href: "/investigation",
            },
            {
              from: "You saved a deployer",
              to: "Every token it has launched",
              href: "/deployers",
              tone: "bad",
            },
          ]}
        />
      </div>
    </div>
  );
}
