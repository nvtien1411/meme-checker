"use client";

import { useMemo, useState } from "react";
import { Demo, Panel, ProReveal, Tag } from "@/components/ui";
import { callerHeader, callerRow } from "@/components/ProRows";
import { Table, Flag } from "@/components/Table";
import { DEMO_CALLS, DEMO_CALLERS } from "@/lib/demo";
import { allCallerProfiles } from "@/lib/intel2";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * ALPHA CALLS — who is talking, and what it cost to listen
 *
 * The page had a contradiction: the Pro table was locked behind a reveal with
 * zero rows, but the free table beside it already printed every Pro column —
 * win rate, median multiple, exit-vs-call, smart followers. So the premium
 * layer was simultaneously hidden and given away, which is the worst of both.
 *
 * Split properly now:
 *
 *   FREE   who called what, when, at what market cap, and what happened after.
 *          That is the discovery layer and it stays complete.
 *   PRO    the columns that cost money to compute — the caller's own exit
 *          against their call price, dead-call rate, pre-call accumulation —
 *          rendered as real rows behind one contextual unlock.
 *
 * A site-wide search box already reaches every caller by handle, so the table
 * exists to answer "who is worth opening", not "who exists".
 * ==================================================================== */

type Sort = "smart" | "win" | "median" | "exit" | "calls" | "followers";

const SORTS: { id: Sort; label: string; hint: string }[] = [
  { id: "smart", label: "smart followers", hint: "wallets with a profitable history that repeatedly buy after they post" },
  { id: "win", label: "win rate", hint: "share of calls that ever touched 2×" },
  { id: "median", label: "median", hint: "middle multiple across every call, dead ones included" },
  { id: "exit", label: "exit vs call", hint: "their exit divided by the price at their post — above 1.0 is selling into their audience" },
  { id: "calls", label: "volume", hint: "how many calls on record" },
  { id: "followers", label: "followers", hint: "the number that does not predict anything" },
];

export function CallersClient() {
  const [sort, setSort] = useState<Sort>("smart");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const rows = useMemo(() => {
    const by: Record<Sort, (a: typeof DEMO_CALLERS[0], b: typeof DEMO_CALLERS[0]) => number> = {
      smart: (a, b) => b.smartFollowers - a.smartFollowers,
      win: (a, b) => b.wins / b.calls - a.wins / a.calls,
      median: (a, b) => b.median - a.median,
      exit: (a, b) => b.exitVsCall - a.exitVsCall,
      calls: (a, b) => b.calls - a.calls,
      followers: (a, b) => b.followers - a.followers,
    };
    let pool = [...DEMO_CALLERS].sort(by[sort]);
    if (flaggedOnly) pool = pool.filter((c) => c.exitVsCall > 1);
    return pool;
  }, [sort, flaggedOnly]);

  const flagged = DEMO_CALLERS.filter((c) => c.exitVsCall > 1).length;

  return (
    <div>
      <div className="border-b border-line px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="t-section text-fg">Alpha Calls</h1>
          <span className="t-xs text-fg4">who is talking, and what it cost to listen</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Demo />
            <Tag tone="neutral">{DEMO_CALLERS.length} tracked</Tag>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* ---------------- controls ---------------- */}
        <div className="panel flex flex-wrap items-center gap-1 px-2 py-1">
          <span className="t-eyebrow mr-0.5">sort</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
              title={s.hint}
              className={`border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${
                sort === s.id
                  ? "border-acid/45 bg-acid/10 text-acid"
                  : "border-line text-fg4 hover:border-line2 hover:text-fg2"
              }`}
            >
              {s.label}
            </button>
          ))}

          <span aria-hidden className="mx-1 h-3 w-px bg-line" />

          <button
            type="button"
            onClick={() => setFlaggedOnly((v) => !v)}
            aria-pressed={flaggedOnly}
            title="Callers whose average exit landed above the price of their own post"
            className={`border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${
              flaggedOnly
                ? "border-bad/50 bg-bad/10 text-bad"
                : "border-line text-fg4 hover:border-line2 hover:text-fg2"
            }`}
          >
            sold above call <span className="tabular-nums opacity-70">{flagged}</span>
          </button>

          <span className="ml-auto font-mono text-[9px] tabular-nums text-fg4">
            {rows.length} shown
          </span>
        </div>

        {/* ---------------- the free table ---------------- */}
        <Panel flush>
          <div className="grid grid-cols-[minmax(0,1fr)_58px_54px_52px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-2.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_62px_56px_58px_56px]">
            <span className="t-eyebrow">caller</span>
            <span className="t-eyebrow text-right" title="calls on record">calls</span>
            <span className="hidden text-right t-eyebrow sm:block" title="share of calls that ever touched 2×">win</span>
            <span className="t-eyebrow text-right" title="middle multiple across every call">median</span>
            <span className="t-eyebrow text-right" title="their exit ÷ the price at their post">exit/call</span>
          </div>

          {rows.length === 0 && (
            <div className="px-3 py-4">
              <p className="t-xs text-fg3">No caller matches that filter</p>
              <button
                type="button"
                onClick={() => setFlaggedOnly(false)}
                className="mt-1.5 border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase text-fg3 hover:border-fg4"
              >
                clear filter
              </button>
            </div>
          )}

          <Table
            cols={[
              {
                head: "caller",
                width: "minmax(0,1fr)",
                render: (c) => (
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate t-strong text-fg">@{c.handle}</span>
                    {c.exitVsCall > 1 && <Flag tone="bad">sells above call</Flag>}
                    {c.lead < 0 && <Flag tone="warn">posts first</Flag>}
                  </span>
                ),
              },
              {
                head: "calls",
                width: "62px",
                align: "right",
                sortKey: "calls",
                hint: "calls on record",
                render: (c) => (
                  <span className="t-mono text-[11px] tabular-nums text-fg3">{c.calls}</span>
                ),
              },
              {
                head: "win",
                width: "62px",
                align: "right",
                sortKey: "win",
                hint: "share of calls that ever touched 2×",
                render: (c) => {
                  const w = (c.wins / c.calls) * 100;
                  return (
                    <span
                      className={`t-mono text-[11px] tabular-nums ${
                        w > 50 ? "text-good" : w > 35 ? "text-warn" : "text-bad"
                      }`}
                    >
                      {w.toFixed(0)}%
                    </span>
                  );
                },
              },
              {
                head: "median",
                width: "66px",
                align: "right",
                sortKey: "median",
                hint: "middle multiple across every call, dead ones included",
                render: (c) => (
                  <span className="t-mono text-[11px] tabular-nums text-fg3">
                    {c.median.toFixed(1)}×
                  </span>
                ),
              },
              {
                head: "exit/call",
                width: "76px",
                align: "right",
                sortKey: "exit",
                hint: "their exit ÷ the price at their post — above 1.0 is selling into their audience",
                render: (c) => (
                  <span
                    className={`t-mono text-[11px] tabular-nums ${
                      c.exitVsCall > 1 ? "text-bad" : "text-good"
                    }`}
                  >
                    {c.exitVsCall.toFixed(2)}×
                  </span>
                ),
              },
            ]}
            rows={rows}
            sort={sort}
            onSort={(k) => setSort(k as Sort)}
            rowKey={(c) => c.handle}
            href={(c) => `/callers/${c.handle}`}
            empty={flaggedOnly ? "No caller matches that filter" : undefined}
          />
        </Panel>

        {/* ---------------- the pro layer, with real rows ---------------- */}
        <ProReveal
          title="Did they actually make money from their own calls?"
          value={(() => {
            const ps = allCallerProfiles();
            const bad = ps.filter((p) => p.sellsAboveCall);
            return bad.length === 0
              ? "No tracked caller sold above their own call price"
              : `${bad.length} of ${ps.length} sold above the price their own post produced — worst at ${Math.max(
                  ...bad.map((p) => p.exitVsCall),
                ).toFixed(2)}×`;
          })()}
          clip={5}
          shown={3}
          rows={[callerHeader(), ...[...allCallerProfiles()].sort((a, b) => b.exitVsCall - a.exitVsCall).map(callerRow)]}
          more={[
            "Their exit against the price at the moment they posted, per caller",
            "Win rate with dead calls counted — the ones that never touched 2×",
            "Whether they bought before posting, and how many seconds before",
            "Share of their own position sold after followers had arrived",
            "Which callers posted the same contract inside the same fifteen minutes",
            "Smart follower count: wallets that repeatedly buy after this account posts",
          ]}
          note="The free table tells you who is talking. This column tells you whether following them costs money"
        />

        {/* ---------------- recent calls ---------------- */}
        <Panel
          title="Recent calls"
          note={`the ${Math.min(8, DEMO_CALLS.length)} most recent across every tracked account`}
          flush
        >
          <Table
            dense
            cols={[
              {
                head: "when",
                width: "56px",
                render: (c) => (
                  <span className="t-mono text-[10px] tabular-nums text-fg4">{c.at.slice(5, 10)}</span>
                ),
              },
              {
                head: "token",
                width: "76px",
                render: (c) => <span className="t-strong text-fg">{c.symbol}</span>,
              },
              {
                head: "caller",
                width: "minmax(0,1fr)",
                render: (c) => (
                  <span className="truncate t-xs text-fg3">@{c.handle}</span>
                ),
              },
              {
                head: "at call",
                width: "76px",
                align: "right",
                hint: "market cap when they posted",
                render: (c) => (
                  <span className="t-mono text-[10px] tabular-nums text-fg4">
                    {fmtUsd(c.mcAtCall)}
                  </span>
                ),
              },
              {
                head: "peak",
                width: "60px",
                align: "right",
                hint: "peak market cap ÷ market cap at the call",
                render: (c) => (
                  <span
                    className={`t-mono text-[10.5px] tabular-nums ${
                      c.outcome === "won"
                        ? "text-good"
                        : c.outcome === "lost"
                          ? "text-bad"
                          : "text-fg4"
                    }`}
                  >
                    {c.hoursToPeak !== null ? `${(c.peakMc / c.mcAtCall).toFixed(1)}×` : "dead"}
                  </span>
                ),
              },
            ]}
            rows={[...DEMO_CALLS].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)}
            rowKey={(c) => `${c.handle}-${c.mint}-${c.at}`}
            href={(c) => `/callers/${c.handle}`}
          />
        </Panel>
      </div>
    </div>
  );
}
