"use client";

import { allCallerProfiles } from "@/lib/intel2";
import { allNarratives } from "@/lib/intel2";
import { deployerRecord } from "@/lib/intel2";
import { DEMO_RUGS, shortAddr } from "@/lib/demo";
import { walletProfile } from "@/lib/intel";

/* ==================================================================== *
 * PRO ROWS — real rows for the paid layer
 *
 * Eight sections across the site were passing `shown={0}` with no children,
 * which renders the "what you would get" bullet list and nothing else. That
 * is a brochure: it tells a reader what exists without proving the data
 * exists. A gate is only honest when the rows behind it are real and the
 * visible sliver is the top of that same list.
 *
 * Everything below derives from the demo datasets through the same functions
 * the free tables use. Nothing here is written by hand, which is also why a
 * change in the data cannot leave a stale sentence behind.
 * ==================================================================== */

const cell = "text-right t-mono text-[10px] tabular-nums";
const rowCls = "grid items-baseline gap-x-2 border-b border-line px-2.5 py-[5px] last:border-b-0";

/* ---------------------------- callers ---------------------------- */

/** One caller's row, so the gate can count and clip it like a row. */
export function callerRow(p: ReturnType<typeof allCallerProfiles>[number]) {
  return (
    <div key={p.caller.handle} className={rowCls}>
      <div className="grid grid-cols-[minmax(0,1fr)_42px_44px_46px_40px_92px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_48px_48px_50px_42px_92px]">
        <span className="truncate t-xs text-fg2">@{p.caller.handle}</span>
        <span className={`${cell} ${(p.deadShare ?? 0) > 0.5 ? "text-bad" : "text-fg3"}`}>
          {p.deadShare === null ? "—" : `${(p.deadShare * 100).toFixed(0)}%`}
        </span>
        <span className={`${cell} ${p.lead < 0 ? "text-warn" : "text-fg3"}`}>
          {p.lead === 0 ? "same" : `${p.lead > 0 ? "+" : ""}${p.lead}s`}
        </span>
        <span className={`${cell} ${p.preRun > 15 ? "text-warn" : "text-fg3"}`}>
          {p.preRun.toFixed(0)}%
        </span>
        <span className={`${cell} ${p.soldAfter > 45 ? "text-bad" : "text-fg3"}`}>
          {p.soldAfter.toFixed(0)}%
        </span>
        <span className="hidden whitespace-nowrap text-right font-mono text-[9px] uppercase tracking-[0.04em] sm:block">
          <span
            className={
              p.verdict === "exit liquidity"
                ? "text-bad"
                : p.verdict === "worth following"
                  ? "text-good"
                  : "text-warn"
            }
          >
            {p.verdict}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Server-safe wrapper: a component can be rendered from either side. */
export function CallerProTable() {
  const rows = [...allCallerProfiles()].sort((a, b) => b.exitVsCall - a.exitVsCall);
  return (
    <>
      {callerHeader()}
      {rows.map(callerRow)}
    </>
  );
}

/** The header + definitions, as one row so it can be pinned above a clip. */
export function callerHeader() {
  return (
    <div key="chdr" className="border-b border-line bg-surf2/40">
      <div className="grid grid-cols-[minmax(0,1fr)_42px_44px_46px_40px_92px] gap-x-2 px-2.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_48px_48px_50px_42px_92px]">
        <span className="t-eyebrow">caller</span>
        <span className="t-eyebrow text-right" title="share of calls that never touched 2×">dead</span>
        <span className="t-eyebrow text-right" title="their buy minus their post — minus means they posted first">lead</span>
        <span className="t-eyebrow text-right" title="price move in the 3 minutes before the post">pre-run</span>
        <span className="t-eyebrow text-right" title="share of their own position sold after followers arrived">sold</span>
        <span className="hidden t-eyebrow text-right sm:block">verdict</span>
      </div>
      <p className="border-t border-line/60 px-2.5 py-1 t-xs leading-relaxed text-fg4">
        <span className="text-fg3">dead</span> calls that never reached 2× ·{" "}
        <span className="text-fg3">lead</span> negative means they posted before buying ·{" "}
        <span className="text-fg3">pre-run</span> move before the post ·{" "}
        <span className="text-fg3">sold</span> after followers arrived
      </p>
    </div>
  );
}

/* --------------------------- narratives -------------------------- */

export function NarrativeProRows() {
  const ns = allNarratives();
  return (
    <>
      <div className={`${rowCls} bg-surf2/40`}>
        <div className="grid grid-cols-[minmax(0,1fr)_44px_46px_46px_44px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_50px_52px_52px_48px_56px]">
          <span className="t-eyebrow">narrative</span>
          <span className="t-eyebrow text-right" title="prior attempts on record">runs</span>
          <span className="t-eyebrow text-right" title="share that already collapsed >90%">dead</span>
          <span className="t-eyebrow text-right" title="median hours a prior attempt held its peak">life</span>
          <span className="t-eyebrow text-right" title="copies per day — saturation, not a raw count">copy/d</span>
          <span className="hidden t-eyebrow text-right sm:block">state</span>
        </div>
      </div>
      {ns.map((n) => (
        <div key={n.name} className={rowCls}>
          <div className="grid grid-cols-[minmax(0,1fr)_44px_46px_46px_44px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_50px_52px_52px_48px_56px]">
            <span className="truncate t-xs text-fg2">{n.name}</span>
            <span className={`${cell} text-fg3`}>{n.priorRuns}</span>
            <span className={`${cell} ${(n.collapsedShare ?? 0) > 0.6 ? "text-bad" : "text-fg3"}`}>
              {n.collapsedShare === null ? "—" : `${(n.collapsedShare * 100).toFixed(0)}%`}
            </span>
            <span className={`${cell} text-fg3`}>
              {n.medianLifespanHours === null ? "—" : `${n.medianLifespanHours.toFixed(0)}h`}
            </span>
            <span className={`${cell} ${(n.copiesPerDay ?? 0) > 2 ? "text-warn" : "text-fg3"}`}>
              {n.copiesPerDay === null ? "—" : n.copiesPerDay.toFixed(1)}
            </span>
            <span className="hidden text-right font-mono text-[9px] uppercase tracking-[0.04em] sm:block">
              <span
                className={
                  n.fit === "early"
                    ? "text-good"
                    : n.fit === "crowded"
                      ? "text-bad"
                      : n.fit === "dying"
                        ? "text-warn"
                        : "text-fg4"
                }
              >
                {n.fit}
              </span>
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

/* --------------------------- deployers --------------------------- */

export function DeployerProRows({ addrs }: { addrs?: string[] }) {
  const list = (addrs ?? [...new Set(DEMO_RUGS.map((r) => r.deployer))]).slice(0, 12);
  const recs = list
    .map((a) => deployerRecord(a))
    .filter((r): r is NonNullable<ReturnType<typeof deployerRecord>> => r !== null)
    .sort((a, b) => (b.rugRate ?? 0) - (a.rugRate ?? 0));

  return (
    <>
      <div className={`${rowCls} bg-surf2/40`}>
        <div className="grid grid-cols-[minmax(0,1fr)_40px_48px_52px_50px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_44px_52px_56px_54px_58px]">
          <span className="t-eyebrow">deployer</span>
          <span className="t-eyebrow text-right" title="launches on record">n</span>
          <span className="t-eyebrow text-right" title="share that collapsed">rug</span>
          <span className="t-eyebrow text-right" title="median drawdown across launches">dd</span>
          <span className="t-eyebrow text-right" title="days between first and latest launch">span</span>
          <span className="hidden t-eyebrow text-right sm:block">verdict</span>
        </div>
      </div>
      {recs.map((r) => (
        <div key={r.addr} className={rowCls}>
          <div className="grid grid-cols-[minmax(0,1fr)_40px_48px_52px_50px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_44px_52px_56px_54px_58px]">
            <span className="truncate t-mono text-[10px] text-fg2">{shortAddr(r.addr, 6, 4)}</span>
            <span className={`${cell} text-fg3`}>{r.launchCount}</span>
            <span className={`${cell} ${(r.rugRate ?? 0) >= 0.5 ? "text-bad" : "text-fg3"}`}>
              {r.rugRate === null ? "—" : `${(r.rugRate * 100).toFixed(0)}%`}
            </span>
            <span className={`${cell} text-fg3`}>
              {r.medianDrawdown === null ? "—" : `${(r.medianDrawdown * 100).toFixed(0)}%`}
            </span>
            <span className={`${cell} text-fg4`}>{r.activeDays === null ? "—" : `${r.activeDays}d`}</span>
            <span className="hidden truncate text-right font-mono text-[9px] uppercase tracking-[0.04em] sm:block">
              <span className={r.verdict === "serial rugger" ? "text-bad" : r.verdict === "clean record" ? "text-good" : "text-warn"}>
                {r.verdict}
              </span>
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------------------------- wallets ---------------------------- */

export function WalletProRows({ addrs }: { addrs: string[] }) {
  const rows = addrs
    .slice(0, 12)
    .map((a) => ({ addr: a, p: walletProfile(a) }))
    .filter((r): r is { addr: string; p: NonNullable<ReturnType<typeof walletProfile>> } => r.p !== null);
  return (
    <>
      <div className={`${rowCls} bg-surf2/40`}>
        <div className="grid grid-cols-[minmax(0,1fr)_46px_52px_50px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_52px_56px_54px_58px]">
          <span className="t-eyebrow">wallet</span>
          <span className="t-eyebrow text-right" title="launches this wallet participated in">n</span>
          <span className="t-eyebrow text-right" title="median minutes held before first sell">hold</span>
          <span className="t-eyebrow text-right" title="median exit as share of peak">exit</span>
          <span className="hidden t-eyebrow text-right sm:block" title="launches where it bought in the creation block">tie</span>
        </div>
      </div>
      {rows.map(({ addr, p }) => (
        <div key={addr} className={rowCls}>
          <div className="grid grid-cols-[minmax(0,1fr)_46px_52px_50px] gap-x-2 sm:grid-cols-[minmax(0,1fr)_52px_56px_54px_58px]">
            <span className="truncate t-mono text-[10px] text-fg2">{shortAddr(addr, 6, 4)}</span>
            <span className={`${cell} text-fg3`}>{p.launchCount}</span>
            <span className={`${cell} text-fg3`}>
              {p.medianHoldMin === null ? "—" : `${p.medianHoldMin.toFixed(0)}m`}
            </span>
            <span className={`${cell} ${(p.medianExitAtPeak ?? 1) < 0.5 ? "text-bad" : "text-fg3"}`}>
              {p.medianExitAtPeak === null ? "—" : `${(p.medianExitAtPeak * 100).toFixed(0)}%`}
            </span>
            <span className={`hidden ${cell} text-fg4 sm:block`}>{p.bundleCount}</span>
          </div>
        </div>
      ))}
    </>
  );
}
