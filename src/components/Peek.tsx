"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { shortAddr } from "@/lib/demo";
import { classifyWallet, walletNetwork, walletProfile } from "@/lib/intel";
import { buildGraph, neighboursOf } from "@/lib/network";
import { WatchToggle } from "./WatchToggle";

/* ==================================================================== *
 * PEEK — open an entity without leaving the page you are on
 *
 * The product's biggest friction was structural, not visual: every wallet was
 * a link, so checking one of a bundle's twelve wallets meant leaving the token
 * report. Come back and the tab you were reading is gone. Twelve wallets meant
 * twelve round trips through the browser's back button.
 *
 * A peek panel fixes that with one interaction instead of one navigation.
 * Click a wallet address anywhere in the product, get its record in a panel
 * over the page you are reading, and either close it or follow through to the
 * full profile — the second is a decision, not a requirement to see anything.
 *
 * Implemented as a context so any component can call `usePeek().open(addr)`
 * without threading props through five layers.
 * ==================================================================== */

interface PeekState {
  open: (addr: string) => void;
  close: () => void;
  current: string | null;
}

const PeekContext = createContext<PeekState>({
  open: () => {},
  close: () => {},
  current: null,
});

export function usePeek() {
  return useContext(PeekContext);
}

export function PeekProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<string | null>(null);

  const open = useCallback((addr: string) => setCurrent(addr), []);
  const close = useCallback(() => setCurrent(null), []);

  // Escape closes, and the body must not scroll behind the panel.
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, close]);

  return (
    <PeekContext.Provider value={{ open, close, current }}>
      {children}
      {current && <PeekPanel addr={current} onClose={close} />}
    </PeekContext.Provider>
  );
}

/* ------------------------------------------------------------------ */

function PeekPanel({ addr, onClose }: { addr: string; onClose: () => void }) {
  // Both of these are cheap and pure; no fetch, no loading state to design.
  const profile = walletProfile(addr);
  const graph = buildGraph(walletNetwork());
  const nbrs = neighboursOf(graph, addr);

  return (
    <>
      <button
        type="button"
        aria-label="Close wallet preview"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-bg/60"
      />
      <aside
        role="dialog"
        aria-label={`Wallet ${shortAddr(addr, 6, 4)}`}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(400px,100vw)] flex-col border-l border-line bg-surf shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="t-eyebrow">wallet</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-fg4 hover:text-fg2"
          >
            close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-line px-3 py-2">
            <div className="break-all font-mono text-[10.5px] text-fg2">{addr}</div>
            {profile ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <RoleChip label={classifyWallet(profile).label} />
                <span className="font-mono text-[9px] tabular-nums text-fg4">
                  {profile.launchCount} launch{profile.launchCount === 1 ? "" : "es"}
                </span>
                <span className="font-mono text-[9px] tabular-nums text-fg4">
                  · {nbrs.length} partner{nbrs.length === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <p className="mt-1 t-xs text-fg4">No recorded launch for this address</p>
            )}
          </div>

          {profile && (
            <>
              <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
                <Cell
                  label="median hold"
                  value={
                    profile.medianHoldMin === null
                      ? "—"
                      : profile.medianHoldMin < 60
                        ? `${profile.medianHoldMin.toFixed(0)}m`
                        : `${(profile.medianHoldMin / 60).toFixed(1)}h`
                  }
                />
                <Cell
                  label="exit vs peak"
                  value={
                    profile.medianExitAtPeak === null
                      ? "—"
                      : `${(profile.medianExitAtPeak * 100).toFixed(0)}%`
                  }
                />
                <Cell label="launches collapsed" value={`${profile.rugCount} of ${profile.launchCount}`} />
                <Cell
                  label="bought in block 0"
                  value={`${profile.bundleCount} of ${profile.launchCount}`}
                />
              </div>

              {profile.appearances.length > 0 && (
                <div className="border-b border-line px-3 py-2">
                  <div className="t-eyebrow mb-1">appeared on</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.appearances.slice(0, 8).map((a) => (
                      <span
                        key={a.launch.mint + a.row.addr}
                        className={`border px-1 py-[1px] font-mono text-[9px] ${
                          a.launch.rugged ? "border-bad/40 text-bad" : "border-line text-fg3"
                        }`}
                        title={`${a.launch.symbol}${a.launch.rugged ? " — collapsed" : ""}`}
                      >
                        {a.launch.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {nbrs.length > 0 && (
                <div className="border-b border-line px-3 py-2">
                  <div className="t-eyebrow mb-1">keeps appearing with</div>
                  <div className="space-y-0.5">
                    {nbrs.slice(0, 6).map(({ addr: other, edge }) => (
                      <Link
                        key={other}
                        href={`/wallets/${other}`}
                        className="flex items-baseline gap-1.5"
                      >
                        <span className="font-mono text-[10px] text-fg3 hover:text-acid">
                          {shortAddr(other, 6, 4)}
                        </span>
                        <span className="ml-auto font-mono text-[9px] tabular-nums text-fg4">
                          {edge.together}×
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t border-line px-2.5 py-2">
          <WatchToggle kind="wallet" id={addr} label={shortAddr(addr, 6, 4)} href={`/wallets/${addr}`} />
          <Link
            href={`/wallets/${addr}`}
            className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.04em] text-fg3 hover:border-fg4 hover:text-fg2"
          >
            full profile →
          </Link>
          <a
            href={`https://solscan.io/account/${addr}`}
            target="_blank"
            rel="noreferrer"
            className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.04em] text-fg3 hover:border-fg4 hover:text-fg2"
          >
            explorer
          </a>
        </div>
      </aside>
    </>
  );
}

const ROLE_TONE: Record<string, string> = {
  "block-0 bundler": "#ff2d55",
  "launch sniper": "#ffb020",
  "insider supply": "#a855f7",
  "fast flipper": "#38bdf8",
  "mid-curve seller": "#94a3b8",
  "patient holder": "#4ade80",
  "insufficient history": "#52525f",
};

function RoleChip({ label }: { label: string }) {
  const tone = ROLE_TONE[label] ?? "#7d8794";
  return (
    <span
      className="inline-flex shrink-0 items-center border px-1.5 py-[1px] font-mono text-[8.5px] uppercase leading-[1.5] tracking-[0.06em]"
      style={{ color: tone, borderColor: `${tone}55`, background: `${tone}12` }}
    >
      {label}
    </span>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surf px-2.5 py-1.5">
      <div className="t-eyebrow">{label}</div>
      <div className="font-mono text-[12px] tabular-nums text-fg1">{value}</div>
    </div>
  );
}
