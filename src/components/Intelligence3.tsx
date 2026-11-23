"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Panel, Tag } from "./ui";
import { fmtUsd } from "@/lib/http";
import { DEMO_CALLERS, DEMO_TOKENS, DEMO_WALLETS, shortAddr } from "@/lib/demo";
import {
  classifyWallet,
  exitOrdering,
  walletNetwork,
  walletProfile,
} from "@/lib/intel";
import { callerProfile, tokenOverlaps } from "@/lib/intel2";

/* ==================================================================== *
 * THIRD INTELLIGENCE LAYER
 *
 * Directory-level views: the wallet ledger, scan memory, watched-address
 * behaviour, and discover ranked by who is inside rather than what is moving.
 *
 * Every figure here is derived. Where a derivation cannot be made the component
 * says so rather than printing a zero.
 * ==================================================================== */

const BEHAVIOUR_TONE: Record<string, string> = {
  "block-0 bundler": "text-bad",
  "launch sniper": "text-warn",
  "insider supply": "text-hot",
  "fast flipper": "text-fg3",
  "mid-curve seller": "text-fg3",
  "patient holder": "text-good",
  "insufficient history": "text-fg4",
};

/* ------------------------------------------------------------------ *
 * Wallet directory — every address as one record
 * ------------------------------------------------------------------ */

export function WalletDirectory() {
  const net = useMemo(() => walletNetwork(), []);
  const firsts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of exitOrdering()) if (r.position === 1) m.set(r.addr, (m.get(r.addr) ?? 0) + 1);
    return m;
  }, []);

  // Ordered by the finding, not by history depth. A reader who sees only the
  // first three rows must see the ones that prove the column means something —
  // sorting by launchCount put two wallets with no exit record on top, which
  // made "first out" look like an empty column.
  const rows = useMemo(
    () =>
      [...net.nodes].sort((a, b) => {
        const fa = firsts.get(a.addr) ?? 0;
        const fb = firsts.get(b.addr) ?? 0;
        return fb - fa || b.profile.launchCount - a.profile.launchCount || b.degree - a.degree;
      }),
    [net, firsts],
  );

  return (
    <div className="space-y-2.5">
      <Panel flush>
        <div className="grid grid-cols-[minmax(0,1fr)_74px_46px_52px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1 sm:grid-cols-[minmax(0,1fr)_96px_52px_56px_60px]">
          <span className="t-eyebrow">wallet</span>
          <span className="hidden t-eyebrow sm:block">behaviour</span>
          <span className="t-eyebrow text-right">launch</span>
          <span className="t-eyebrow text-right">hold</span>
          <span className="t-eyebrow text-right">first out</span>
        </div>
        {rows.map((n) => {
          const p = n.profile;
          const b = classifyWallet(p);
          const fo = firsts.get(n.addr) ?? 0;
          return (
            <Link
              key={n.addr}
              href={`/wallets/${n.addr}`}
              className="drow grid grid-cols-[minmax(0,1fr)_74px_46px_52px] items-baseline gap-x-2 border-b border-line px-3 py-[6px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_96px_52px_56px_60px]"
            >
              <span className="truncate font-mono text-[10.5px] text-fg2">{shortAddr(n.addr, 6, 4)}</span>
              <span className={`hidden truncate font-mono text-[9px] uppercase tracking-[0.04em] sm:block ${BEHAVIOUR_TONE[b.label] ?? "text-fg4"}`}>
                {b.label}
              </span>
              <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
                {p.launchCount}
              </span>
              <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
                {p.medianHoldMin === null
                  ? "held"
                  : p.medianHoldMin < 90
                    ? `${Math.round(p.medianHoldMin)}m`
                    : `${(p.medianHoldMin / 60).toFixed(1)}h`}
              </span>
              <span
                className={`text-right font-mono text-[10px] tabular-nums ${fo > 0 ? "text-bad" : "text-fg4"}`}
              >
                {fo > 0 ? `${fo}×` : "—"}
              </span>
            </Link>
          );
        })}
        <div className="border-t border-line px-3 py-1.5">
          <p className="t-xs leading-relaxed text-fg4">
            &ldquo;hold&rdquo; is the median time before the first sell across every launch the address
            appears on. &ldquo;first out&rdquo; counts how often it led the exit — the wallet that
            leaves first sets the price everyone else exits into
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Scan memory — what the history adds up to
 * ------------------------------------------------------------------ */

export function ScanMemory() {
  const net = useMemo(() => walletNetwork(), []);

  // Addresses that appear on more than one launch in the dataset: the ones the
  // scanning user would have crossed repeatedly.
  const repeat = useMemo(
    () => [...net.nodes].filter((n) => n.profile.launchCount > 1).sort((a, b) => b.profile.launchCount - a.profile.launchCount),
    [net],
  );

  const collapseShare = useMemo(() => {
    const all = repeat.flatMap((n) => n.profile.appearances.map((a) => a.launch.rugged));
    return all.length === 0 ? null : all.filter(Boolean).length / all.length;
  }, [repeat]);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { k: "scans with history", v: String(DEMO_TOKENS.length), s: "tokens in the record" },
          {
            k: "repeat addresses",
            v: String(repeat.length),
            s: "appear on 2+ launches",
          },
          {
            k: "launches seen",
            v: String(new Set(repeat.flatMap((n) => n.profile.appearances.map((a) => a.launch.symbol))).size),
            s: "across the record",
          },
          {
            k: "collapsed after",
            v: collapseShare === null ? "—" : `${Math.round(collapseShare * 100)}%`,
            s: "of appearances",
          },
        ].map((c) => (
          <div key={c.k} className="panel p-2.5">
            <div className="t-eyebrow">{c.k}</div>
            <div className="mt-0.5 font-mono text-[16px] leading-none tabular-nums text-fg">{c.v}</div>
            <div className="mt-1 t-xs leading-snug text-fg4">{c.s}</div>
          </div>
        ))}
      </div>

      <Panel title="Addresses you keep crossing" note="the memory a scan history should produce" flush>
        {repeat.slice(0, 8).map((n) => {
          const b = classifyWallet(n.profile);
          return (
            <Link
              key={n.addr}
              href={`/wallets/${n.addr}`}
              className="drow flex flex-wrap items-baseline gap-x-2 border-b border-line px-3 py-[6px] last:border-b-0"
            >
              <span className="font-mono text-[10.5px] text-fg2">{shortAddr(n.addr, 6, 4)}</span>
              <span className={`font-mono text-[9px] uppercase tracking-[0.04em] ${BEHAVIOUR_TONE[b.label] ?? "text-fg4"}`}>
                {b.label}
              </span>
              <span className="t-xs text-fg4">
                {n.profile.appearances.map((a) => a.launch.symbol).join(" · ")}
              </span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-fg4">
                {n.profile.launchCount} launches
              </span>
            </Link>
          );
        })}
        <div className="border-t border-line px-3 py-1.5">
          <p className="t-xs leading-relaxed text-fg4">
            This is what a scan history is for. Each scan on its own is a snapshot; the addresses that
            survive across scans are the ones that mean something
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Watched wallets — behaviour since you started watching
 * ------------------------------------------------------------------ */

export function WatchedWalletIntel() {
  const watched = [DEMO_WALLETS.bundle1, DEMO_WALLETS.smart1, DEMO_WALLETS.dev, DEMO_WALLETS.insider1];

  const rows = useMemo(
    () =>
      watched
        .map((addr) => {
          const p = walletProfile(addr);
          return p ? { addr, p, b: classifyWallet(p) } : null;
        })
        .filter((r): r is { addr: string; p: NonNullable<ReturnType<typeof walletProfile>>; b: ReturnType<typeof classifyWallet> } => r !== null),
    // watched is a stable literal
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const worstCaller = useMemo(() => {
    const ps = DEMO_CALLERS.map(callerProfile).filter((p) => p.sellsAboveCall);
    return ps.sort((a, b) => b.exitVsCall - a.exitVsCall)[0] ?? null;
  }, []);

  return (
    <div className="space-y-2.5">
      <Panel title="Watched addresses, measured" note="what each one has done, not what it is worth today" flush>
        {rows.map(({ addr, p, b }) => (
          <div key={addr} className="border-b border-line px-3 py-2 last:border-b-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <Link href={`/wallets/${addr}`} className="font-mono text-[10.5px] text-fg2 hover:text-acid">
                {shortAddr(addr, 6, 4)}
              </Link>
              <span className={`font-mono text-[9px] uppercase tracking-[0.04em] ${BEHAVIOUR_TONE[b.label] ?? "text-fg4"}`}>
                {b.label}
              </span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-fg4">
                {p.launchCount} launches · {p.rugCount} collapsed
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {p.appearances.slice(0, 4).map((a) => (
                <span key={a.launch.symbol} className="font-mono text-[9.5px] text-fg4">
                  {a.launch.symbol}{" "}
                  <span className={a.launch.rugged ? "text-bad" : "text-good"}>
                    {a.launch.rugged ? "collapsed" : "survived"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </Panel>

      {worstCaller && (
        <Panel title="A watched caller worth re-grading" note="exit price against their own call price">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link href={`/callers/${worstCaller.caller.handle}`} className="font-mono text-[11px] text-fg2 hover:text-acid">
              @{worstCaller.caller.handle}
            </Link>
            <Tag tone="bad">{worstCaller.verdict}</Tag>
            <span className="ml-auto font-mono text-[13px] tabular-nums text-bad">
              {worstCaller.exitVsCall.toFixed(2)}x
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {worstCaller.evidence.slice(0, 3).map((e) => (
              <li key={e} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-bad" />
                <span className="t-xs leading-snug text-fg3">{e}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Discover — ranked by who is inside
 * ------------------------------------------------------------------ */

export function DiscoverIntel() {
  const overlaps = useMemo(() => tokenOverlaps(), []);
  const sharedWith = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const o of overlaps) {
      m.set(o.a, [...(m.get(o.a) ?? []), o.b]);
      m.set(o.b, [...(m.get(o.b) ?? []), o.a]);
    }
    return m;
  }, [overlaps]);

  const ranked = useMemo(
    () =>
      [...DEMO_TOKENS]
        .map((t) => {
          const profiles = t.wallets
            .map((w) => walletProfile(w.addr))
            .filter((p): p is NonNullable<ReturnType<typeof walletProfile>> => p !== null && p.launchCount > 0);
          const rugRate =
            profiles.length === 0
              ? null
              : profiles.reduce((n, p) => n + (p.rugRate ?? 0), 0) / profiles.length;
          const holds = profiles.map((p) => p.medianHoldMin).filter((h): h is number => h !== null);
          return { token: t, rugRate, holdMedian: holds.length ? median(holds) : null, tracked: profiles.length };
        })
        .sort((a, b) => (b.rugRate ?? 0) - (a.rugRate ?? 0)),
    [],
  );

  return (
    <Panel
      title="Ranked by the record of the wallets inside"
      note="not by price, not by volume"
      flush
    >
      <div className="grid grid-cols-[minmax(0,1fr)_56px_52px_64px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1 sm:grid-cols-[minmax(0,1fr)_64px_56px_76px_70px]">
        <span className="t-eyebrow">token</span>
        <span className="t-eyebrow text-right">wallet rug%</span>
        <span className="t-eyebrow text-right">hold</span>
        <span className="hidden t-eyebrow text-right sm:block">shares holders</span>
        <span className="t-eyebrow text-right">mcap</span>
      </div>
      {ranked.map(({ token, rugRate, holdMedian, tracked }) => (
        <Link
          key={token.mint}
          href={`/token/${token.chain}/${token.mint}`}
          className="drow grid grid-cols-[minmax(0,1fr)_56px_52px_64px] items-baseline gap-x-2 border-b border-line px-3 py-[6px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_64px_56px_76px_70px]"
        >
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-mono text-[10.5px] text-fg2">{token.symbol}</span>
            <span className="truncate t-xs text-fg4">{tracked} tracked wallets</span>
          </span>
          <span
            className={`text-right font-mono text-[10px] tabular-nums ${
              rugRate === null ? "text-fg4" : rugRate >= 0.5 ? "text-bad" : rugRate > 0.2 ? "text-warn" : "text-good"
            }`}
          >
            {rugRate === null ? "—" : `${Math.round(rugRate * 100)}%`}
          </span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
            {holdMedian === null ? "—" : holdMedian < 90 ? `${Math.round(holdMedian)}m` : `${(holdMedian / 60).toFixed(0)}h`}
          </span>
          <span className="hidden truncate text-right font-mono text-[9.5px] text-fg4 sm:block">
            {(sharedWith.get(token.symbol) ?? []).join(", ") || "—"}
          </span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg3">{fmtUsd(token.mcap)}</span>
        </Link>
      ))}
      <div className="border-t border-line px-3 py-1.5">
        <p className="t-xs leading-relaxed text-fg4">
          The first column is the average share of prior launches that collapsed, across every wallet
          in this token with a history. A token whose holders mostly survived their previous launches
          is a different object from one whose holders mostly did not
        </p>
      </div>
    </Panel>
  );
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
