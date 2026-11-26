"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Demo, Panel, RiskDot, Tag } from "@/components/ui";
import { ScanInput } from "@/components/ScanInput";
import { PageHead } from "@/components/Shell";
import { Table, Flag } from "@/components/Table";
import { NextSteps } from "@/components/NextSteps";
import { DEMO_RUGS, DEMO_TOKENS } from "@/lib/demo";
import { fmtAge, fmtUsd } from "@/lib/http";

type View = "moving" | "new" | "dangerous";
type Chain = "all" | "solana" | "bsc" | "ethereum";
type Sort = "default" | "mcap" | "liq" | "age" | "risk";

const VIEWS: { id: View; label: string; note: string }[] = [
  { id: "moving", label: "Moving", note: "24h volume ÷ liquidity. High turnover isn’t buy pressure." },
  { id: "new", label: "New pairs", note: "Youngest pairs first." },
  { id: "dangerous", label: "Bundle watch", note: "Retained = held ÷ bought for the same wallets. Partial bundle records show —." },
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("default");

  const rows = useMemo(() => {
    let pool = DEMO_TOKENS.filter((t) => (chain === "all" || t.chain === chain) && [t.symbol, t.name, t.mint].some((value) => value.toLowerCase().includes(query.trim().toLowerCase())));

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
  }, [view, chain, sort, query]);

  const activeView = VIEWS.find((v) => v.id === view)!;
  return (
    <div>
      <PageHead title="Discover" note="What’s moving, and who still holds the supply?" right={<><Demo /><Tag tone="neutral">{DEMO_TOKENS.length} tracked</Tag></>}>
        <div className="max-w-[520px]"><ScanInput /></div>
      </PageHead>
      <div className="mx-auto max-w-6xl space-y-4 p-3 sm:p-4">
        <Panel flush>
          <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-3" role="group" aria-label="Token view">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" title={v.note} onClick={() => { setView(v.id); setSort("default"); }} aria-pressed={view === v.id} className={`min-h-11 border-b-2 px-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acid ${view === v.id ? "border-acid text-acid" : "border-transparent text-fg3 hover:text-fg"}`}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <input type="search" aria-label="Filter tokens" placeholder="Ticker, name or contract" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-line bg-bg px-3 text-sm text-fg placeholder:text-fg4 focus:border-acid focus:outline-none sm:max-w-64" />
            <span className="t-eyebrow mr-0.5">chain</span>
            {(["all", "solana", "bsc", "ethereum"] as Chain[]).map((c) => {
              const n = c === "all" ? DEMO_TOKENS.length : DEMO_TOKENS.filter((t) => t.chain === c).length;
              return <button key={c} type="button" onClick={() => setChain(c)} aria-pressed={chain === c} title={n === 0 ? `No ${c} token in the tracked set` : `${n} tracked on ${c}`} className={`min-h-11 border px-2 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid ${chain === c ? "border-acid/45 bg-acid/10 text-acid" : n === 0 ? "border-line/60 text-fg4/60" : "border-line text-fg4 hover:border-line2 hover:text-fg2"}`}>{c}<span className="ml-1 tabular-nums opacity-60">{n}</span></button>;
            })}
            <span aria-hidden className="mx-1 h-3 w-px bg-line" />
            <span className="t-eyebrow mr-0.5">sort</span>
            {SORTS.map((s) => <button key={s.id} type="button" onClick={() => setSort(s.id)} aria-pressed={sort === s.id} className={`min-h-11 border px-2 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid ${sort === s.id ? "border-acid/45 bg-acid/10 text-acid" : "border-line text-fg4 hover:border-line2 hover:text-fg2"}`}>{s.label}</button>)}

            <span role="status" className="ml-auto t-xs tabular-nums text-fg3">{rows.length} shown</span>
          </div>
          <div className="overflow-x-auto" role="region" aria-label="Token results" tabIndex={0}><div className={view === "dangerous" ? "min-w-[0px] sm:min-w-[730px]" : "min-w-[0px] sm:min-w-[590px]"}>
          <Table
            cols={[
              {
                head: "token",
                width: "minmax(0,1fr)",
                render: (t) => (
                  <span className="block min-w-0 py-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <strong className="truncate t-strong text-fg">{t.symbol}</strong>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.04em] text-fg4">{t.chain}</span>
                      {t.bundlePct > 15 && <Flag tone="bad">bundle</Flag>}
                      {t.insiderPct > 8 && <Flag tone="hot">insider</Flag>}
                    </span>
                  </span>
                ),
              },
              ...(view === "dangerous" ? [
                { head: "Bundled", width: "68px", align: "right" as const, render: (t: (typeof DEMO_TOKENS)[number]) => <span className="t-mono tabular-nums text-fg2">{t.bundlePct}%</span> },
                { head: "Retained", width: "76px", align: "right" as const, hint: "Supply held by the bundle wallets ÷ supply the same wallets bought at launch", render: () => <span className="t-mono tabular-nums text-fg2">—</span> },
              ] : []),
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
            empty={rows.length === 0 ? `Nothing in the tracked set matches ${query.trim() ? `“${query.trim()}”` : "these filters"}${chain === "all" ? "" : ` on ${chain}`} — the demo set holds ${DEMO_TOKENS.length} tokens across ${[...new Set(DEMO_TOKENS.map((t) => t.chain))].join(", ")}` : undefined}
          />
          </div></div>
          <p className="border-t border-line px-3 py-2 t-xs text-fg3">{activeView.note}</p>
        </Panel>

        {/* ---------------- what broke ---------------- */}
        <Panel
          title="Recently flagged"
          note="Signal and peak drawdown"
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
            { from: "A token in this list looks worth a look", to: "What is actually inside it?", href: DEMO_TOKENS[0] ? `/token/${DEMO_TOKENS[0].chain}/${DEMO_TOKENS[0].mint}` : "/check", tone: "acid" },
            { from: "Something collapsed and you want the pattern", to: "The deployer behind it", href: "/deployers", tone: "bad" },
            { from: "A wallet keeps showing up across these", to: "Who else bought with it?", href: "/investigation" },
            { from: "You want to know who called it first", to: "Alpha Calls, ranked by exit behavior", href: "/callers" },
            { from: "The story behind the token", to: "How many times this idea already ran", href: "/narratives" },
          ]}
        />
      </div>
    </div>
  );
}
