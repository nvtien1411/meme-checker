"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Demo, Panel, RiskDot, Tag } from "@/components/ui";
import { ScanInput } from "@/components/ScanInput";
import { Table, Flag } from "@/components/Table";
import { NextSteps } from "@/components/NextSteps";
import { DEMO_RUGS, DEMO_TOKENS } from "@/lib/demo";
import { fmtAge, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * DISCOVER — what to look at next
 *
 * The page used to be one table with a row of chips that were explicitly
 * labelled "filters illustrative" — decorative controls on a list of five
 * tokens. Every control here now does something, on the data that exists.
 *
 * Three views, because those are three different questions:
 *
 *   moving     what has volume against its liquidity right now
 *   new        what launched most recently
 *   dangerous  what carries bundle or insider weight
 *
 * Sorting and the chain filter apply to all three. When the tracked set is too
 * small for a filter to change anything, the page says so instead of pretending
 * the click did work.
 * ==================================================================== */

type View = "moving" | "new" | "dangerous";
type Chain = "all" | "solana" | "bsc" | "ethereum";
type Sort = "default" | "mcap" | "liq" | "age" | "risk";

const VIEWS: { id: View; label: string; note: string }[] = [
  { id: "moving", label: "Moving", note: "volume against liquidity, highest first" },
  { id: "new", label: "New", note: "newest first" },
  { id: "dangerous", label: "Dangerous", note: "bundle and insider weight first" },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "default", label: "view order" },
  { id: "mcap", label: "mcap" },
  { id: "liq", label: "liquidity" },
  { id: "age", label: "age" },
  { id: "risk", label: "risk" },
];

function danger(t: (typeof DEMO_TOKENS)[number]): number {
  return t.bundlePct + t.insiderPct * 2 + t.score / 10;
}

export function DiscoverClient() {
  const [view, setView] = useState<View>("moving");
  const [chain, setChain] = useState<Chain>("all");
  const [sort, setSort] = useState<Sort>("default");

  const rows = useMemo(() => {
    let pool = DEMO_TOKENS.filter((t) => chain === "all" || t.chain === chain);

    if (view === "moving") pool = [...pool].sort((a, b) => b.vol24 / b.liq - a.vol24 / a.liq);
    else if (view === "new") pool = [...pool].sort((a, b) => a.ageHours - b.ageHours);
    else pool = [...pool].sort((a, b) => danger(b) - danger(a));

    if (sort !== "default") {
      const by: Record<Exclude<Sort, "default">, (a: typeof pool[0], b: typeof pool[0]) => number> = {
        mcap: (a, b) => b.mcap - a.mcap,
        liq: (a, b) => b.liq - a.liq,
        age: (a, b) => a.ageHours - b.ageHours,
        risk: (a, b) => b.score - a.score,
      };
      pool = [...pool].sort(by[sort]);
    }
    return pool;
  }, [view, chain, sort]);

  const activeView = VIEWS.find((v) => v.id === view)!;
  // A filter that matches nothing in the tracked set is a dead end unless it
  // says so. The set is five tokens; that is a fact about the demo, not a bug.
  const empty = rows.length === 0;

  return (
    <div>
      <div className="border-b border-line px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="t-section text-fg">Discover</h1>
          <span className="t-xs text-fg4">{activeView.note}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Demo />
            <Tag tone="neutral">{DEMO_TOKENS.length} tracked</Tag>
          </div>
        </div>
        <div className="mt-2 max-w-[520px]">
          <ScanInput />
        </div>
      </div>

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* ---------------- controls, all live ---------------- */}
        <div className="panel">
          <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.05em] transition-colors ${
                  view === v.id
                    ? "border-acid/45 bg-acid/10 text-acid"
                    : "border-line text-fg4 hover:border-line2 hover:text-fg2"
                }`}
              >
                {v.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[9px] tabular-nums text-fg4">
              {rows.length} shown
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 px-2 py-1">
            <span className="t-eyebrow mr-0.5">chain</span>
            {(["all", "solana", "bsc", "ethereum"] as Chain[]).map((c) => {
              const n = c === "all" ? DEMO_TOKENS.length : DEMO_TOKENS.filter((t) => t.chain === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChain(c)}
                  aria-pressed={chain === c}
                  title={n === 0 ? `No ${c} token in the tracked set` : `${n} tracked on ${c}`}
                  className={`border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${
                    chain === c
                      ? "border-acid/45 bg-acid/10 text-acid"
                      : n === 0
                        ? "border-line/60 text-fg4/40"
                        : "border-line text-fg4 hover:border-line2 hover:text-fg2"
                  }`}
                >
                  {c}
                  <span className="ml-1 tabular-nums opacity-60">{n}</span>
                </button>
              );
            })}

            <span aria-hidden className="mx-1 h-3 w-px bg-line" />

            <span className="t-eyebrow mr-0.5">sort</span>
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id)}
                aria-pressed={sort === s.id}
                className={`border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${
                  sort === s.id
                    ? "border-acid/45 bg-acid/10 text-acid"
                    : "border-line text-fg4 hover:border-line2 hover:text-fg2"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- table ---------------- */}
        <Panel flush>
          <Table
            cols={[
              {
                head: "token",
                width: "minmax(0,1fr)",
                render: (t) => (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate t-strong text-fg">{t.symbol}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.04em] text-fg4">
                      {t.chain}
                    </span>
                    {t.bundlePct > 15 && <Flag tone="bad">bundle</Flag>}
                    {t.insiderPct > 8 && <Flag tone="hot">insider</Flag>}
                  </span>
                ),
              },
              {
                head: "mcap",
                sortKey: "mcap",
                width: "74px",
                align: "right",
                hint: "circulating supply × price",
                render: (t) => (
                  <span className="t-mono text-[11.5px] tabular-nums text-fg2">{fmtUsd(t.mcap)}</span>
                ),
              },
              {
                head: "liq",
                sortKey: "liq",
                width: "70px",
                align: "right",
                hint: "pool depth — how much can be sold without moving the price",
                render: (t) => (
                  <span className="t-mono text-[11px] tabular-nums text-fg3">{fmtUsd(t.liq)}</span>
                ),
              },
              {
                head: "vol/liq",
                sortKey: "vol",
                width: "62px",
                align: "right",
                hint: "turnover against pool depth; high means churn, not conviction",
                render: (t) => {
                  const vp = t.vol24 / t.liq;
                  return (
                    <span
                      className={`t-mono text-[11px] tabular-nums ${
                        vp > 8 ? "text-hot" : vp > 3 ? "text-warn" : "text-fg3"
                      }`}
                    >
                      {vp.toFixed(1)}×
                    </span>
                  );
                },
              },
              {
                head: "age",
                sortKey: "age",
                width: "54px",
                align: "right",
                render: (t) => (
                  <span className="t-mono text-[10.5px] tabular-nums text-fg4">{fmtAge(t.ageHours)}</span>
                ),
              },
              {
                head: "risk",
                sortKey: "risk",
                width: "58px",
                align: "right",
                hint: "0 clean to 100 critical — higher is worse",
                render: (t) => (
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="t-mono text-[11px] tabular-nums text-fg3">{t.score}</span>
                    <RiskDot risk={t.risk} />
                  </span>
                ),
              },
            ]}
            rows={rows}
            sort={sort}
            onSort={(k) => setSort(k as Sort)}
            rowKey={(t) => t.mint}
            href={(t) => `/token/${t.chain}/${t.mint}`}
            empty={
              empty
                ? `Nothing in the tracked set matches ${
                    chain === "all" ? "these filters" : `chain = ${chain}`
                  } — the demo set holds ${DEMO_TOKENS.length} tokens across ${[
                    ...new Set(DEMO_TOKENS.map((t) => t.chain)),
                  ].join(", ")}`
                : undefined
            }
          />
        </Panel>

        {/* ---------------- what broke ---------------- */}
        <Panel
          title="Recently flagged"
          note="collapses with the signal that fired"
          flush
          right={
            <Link href="/rugs" className="text-fg3 hover:text-fg hover:underline">
              archive →
            </Link>
          }
        >
          {DEMO_RUGS.slice(0, 4).map((r) => (
            <div
              key={r.mint}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-line px-2.5 py-[6px] last:border-b-0"
            >
              <span className="t-strong text-fg">{r.symbol}</span>
              <Tag tone={r.flag === "confirmed" ? "bad" : r.flag === "reported" ? "hot" : "warn"}>
                {r.flag}
              </Tag>
              <span className="t-xs text-fg3">{r.signals[0]}</span>
              <span className="ml-auto t-mono text-[10.5px] text-bad">
                −{r.drawdownPct.toFixed(1)}%
              </span>
            </div>
          ))}
        </Panel>

        <NextSteps
          steps={[
            {
              from: "A token in this list looks worth a look",
              to: "What is actually inside it?",
              href: DEMO_TOKENS[0] ? `/token/${DEMO_TOKENS[0].chain}/${DEMO_TOKENS[0].mint}` : "/check",
              tone: "acid",
            },
            {
              from: "Something collapsed and you want the pattern",
              to: "The deployer behind it",
              href: "/deployers",
              tone: "bad",
            },
            {
              from: "A wallet keeps showing up across these",
              to: "Who else bought with it?",
              href: "/investigation",
            },
            {
              from: "You want to know who called it first",
              to: "Alpha Calls, ranked by exit behavior",
              href: "/callers",
            },
            {
              from: "The story behind the token",
              to: "How many times this idea already ran",
              href: "/narratives",
            },
          ]}
        />
      </div>
    </div>
  );
}
