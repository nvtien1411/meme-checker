"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Demo, Panel } from "@/components/ui";
import { callerHeader, callerRow } from "@/components/ProRows";
import { PageHead } from "@/components/Shell";
import { Table } from "@/components/Table";
import { DEMO_CALLS, DEMO_CALLERS } from "@/lib/demo";
import { allCallerProfiles } from "@/lib/intel2";
import { useViewer } from "@/lib/viewer";
import { fmtUsd } from "@/lib/http";

type Sort = "smart" | "win" | "median" | "exit" | "calls" | "followers" | "lead" | "sold";

const SORTS: { id: Sort; label: string; hint: string }[] = [
  { id: "lead", label: "Earliest buy", hint: "How far before the post the caller bought" },
  { id: "sold", label: "Most sold after post", hint: "Share of their position sold after posting" },
  { id: "smart", label: "smart followers", hint: "wallets with a profitable history that repeatedly buy after they post" },
  { id: "win", label: "win rate", hint: "share of calls that ever touched 2×" },
  { id: "median", label: "median", hint: "middle multiple across every call, dead ones included" },
  { id: "exit", label: "exit vs call", hint: "Average exit price ÷ price at the post; not proof of who bought" },
  { id: "calls", label: "volume", hint: "how many calls on record" },
  { id: "followers", label: "followers", hint: "the number that does not predict anything" },
];

export function CallersClient() {
  const { pro, setPro } = useViewer();
  const [sort, setSort] = useState<Sort>("lead");
  const [filter, setFilter] = useState<"all" | "early" | "above">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const by: Record<Sort, (a: typeof DEMO_CALLERS[0], b: typeof DEMO_CALLERS[0]) => number> = {
      lead: (a, b) => b.lead - a.lead,
      sold: (a, b) => b.soldAfter - a.soldAfter,
      smart: (a, b) => b.smartFollowers - a.smartFollowers,
      win: (a, b) => b.wins / b.calls - a.wins / a.calls,
      median: (a, b) => b.median - a.median,
      exit: (a, b) => b.exitVsCall - a.exitVsCall,
      calls: (a, b) => b.calls - a.calls,
      followers: (a, b) => b.followers - a.followers,
    };
    const needle = query.trim().replace(/^@/, "").toLowerCase();
    return DEMO_CALLERS.filter((c) => (filter === "all" || (filter === "early" ? c.lead > 0 : c.exitVsCall > 1)) && [c.handle, c.name].some((name) => name.toLowerCase().includes(needle))).sort(by[sort]);
  }, [filter, query, sort]);

  return (
    <div>
      <PageHead title="Alpha Calls" note="Did they buy before they posted?" right={<Demo />} />
      <div className="space-y-4 p-3 sm:p-4">
        <Panel flush>
          <div className="flex flex-wrap items-center gap-x-5 border-b border-line px-3" role="group" aria-label="Caller filter">
            {([["all", "All callers"], ["early", "Bought first"], ["above", "Exited above call"]] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); setSort(id === "above" ? "exit" : "lead"); }} className={`min-h-11 border-b-2 px-1 text-sm font-semibold ${filter === id ? "border-acid text-acid" : "border-transparent text-fg3 hover:text-fg"}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <input type="search" aria-label="Filter callers" placeholder="Search @handle" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-line bg-bg px-3 text-sm text-fg placeholder:text-fg4 sm:max-w-64" />
            <select aria-label="Sort callers" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-11 rounded border border-line bg-bg px-2 text-sm text-fg2">
              {SORTS.map((item) => <option key={item.id} value={item.id} title={item.hint}>{item.label}</option>)}
            </select>
            <span role="status" className="ml-auto t-xs tabular-nums text-fg3">{rows.length} / {DEMO_CALLERS.length} callers</span>
          </div>
          {rows.length ? <div className="overflow-x-auto" role="region" aria-label="Caller results" tabIndex={0}><div className="min-w-[0px] sm:min-w-[665px]">
          <Table
            cols={[
              {
                head: "caller",
                width: "minmax(0,1fr)",
                render: (c) => (
                  <span className="block min-w-0 py-1"><strong className="block truncate text-sm text-fg">@{c.handle}</strong><span className="block truncate t-xs text-fg4">{c.name}</span></span>
                ),
              },
              {
                head: "Buy timing", width: "94px", align: "right", sortKey: "lead", hint: "Time between the caller’s buy and post",
                render: (c) => <span className={`t-mono tabular-nums ${c.lead > 0 ? "text-warn" : "text-fg2"}`}>{c.lead === 0 ? "Same time" : `${Math.abs(c.lead)}s ${c.lead > 0 ? "before" : "after"}`}</span>,
              },
              {
                head: "Sold after", width: "76px", align: "right", sortKey: "sold", hint: "Share of their own position sold after posting",
                render: (c) => <span className="t-mono tabular-nums text-fg2">{c.soldAfter}%</span>,
              },
              {
                head: "Exit / call",
                width: "76px",
                align: "right",
                sortKey: "exit",
                hint: "Average exit price ÷ price at the post",
                render: (c) => (
                  <span
                    className={`t-mono text-[11px] tabular-nums ${
                      c.exitVsCall > 1 ? "text-warn" : "text-fg2"
                    }`}
                  >
                    {c.exitVsCall.toFixed(2)}×
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
            ]}
            rows={rows}
            sort={sort}
            onSort={(k) => setSort(k as Sort)}
            rowKey={(c) => c.handle}
            href={(c) => `/callers/${c.handle}`}
          />
          </div></div> : <div className="border-t border-line px-3 py-2 text-sm text-fg3">No demo callers match. <button type="button" onClick={() => { setQuery(""); setFilter("all"); setSort("lead"); }} className="min-h-11 px-2 text-acid hover:underline">Clear filters</button></div>}
          <p className="border-t border-line px-3 py-2 t-xs text-fg3">Exit / call compares prices, not who bought the exit.</p>
        </Panel>

        {/* ---------------- recent calls ---------------- */}
        <Panel
          title="Recent calls"
          note="Demo posts · market cap at call and subsequent peak"
          flush
        >
          <div className="overflow-x-auto" role="region" aria-label="Recent call results" tabIndex={0}><div className="min-w-[0px] sm:min-w-[500px]">
          <Table
            dense
            cols={[
              {
                head: "UTC",
                width: "82px",
                render: (c) => (
                  <span className="t-mono text-[10px] tabular-nums text-fg4">{c.at.slice(5, 16).replace("T", " ")}</span>
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
                    {c.mcAtCall > 0 ? `${(c.peakMc / c.mcAtCall).toFixed(1)}×` : "—"}
                  </span>
                ),
              },
              { head: "To peak", width: "66px", align: "right", render: (c) => <span className="t-mono tabular-nums text-fg3">{c.hoursToPeak == null ? "—" : `${c.hoursToPeak}h`}</span> },
            ]}
            rows={[...DEMO_CALLS].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)}
            rowKey={(c) => `${c.handle}-${c.mint}-${c.at}`}
            href={(c) => `/callers/${c.handle}`}
          />
          </div></div>
        </Panel>
        <Panel title="Caller behavior preview" flush right={<Demo />}>
          <div className="overflow-x-auto" role="region" aria-label="Caller behavior data" tabIndex={0}>
            <div className="min-w-[0px] sm:min-w-[500px]">
              {callerHeader()}
              {allCallerProfiles().sort((a, b) => b.exitVsCall - a.exitVsCall).slice(0, pro ? undefined : 2).map(callerRow)}
            </div>
          </div>
          {!pro && <div className="flex flex-wrap items-center gap-x-4 border-t border-line px-3">
            <button type="button" onClick={() => setPro(true)} className="min-h-11 text-sm font-semibold text-acid hover:underline">Show all in Pro preview →</button>
            <Link href="/pricing" className="text-sm text-fg3 hover:text-fg">Compare plans</Link>
          </div>}
        </Panel>
      </div>
    </div>
  );
}
