"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, RiskDot, Tag } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";
import { NextSteps } from "@/components/NextSteps";

const SF = DEMO_TOKENS[0];
const SCANNED = [
  { mint: SF.mint, chain: "solana", symbol: "RATS", name: SF.name, at: "2h ago", scoreThen: 51, scoreNow: 71, mcapThen: 51200, mcapNow: SF.mcap, risk: SF.risk },
  { mint: DEMO_TOKENS[2].mint, chain: "solana", symbol: "CATWIF", name: DEMO_TOKENS[2].name, at: "5h ago", scoreThen: 41, scoreNow: 88, mcapThen: 340000, mcapNow: DEMO_TOKENS[2].mcap, risk: "critical" },
  { mint: DEMO_TOKENS[1].mint, chain: "solana", symbol: "BONK", name: "Bonk", at: "1d ago", scoreThen: 20, scoreNow: 34, mcapThen: 1580000, mcapNow: DEMO_TOKENS[1].mcap, risk: "moderate" },
  { mint: DEMO_TOKENS[3].mint, chain: "solana", symbol: "PNUT", name: "Peanut the Squirrel", at: "2d ago", scoreThen: 38, scoreNow: 41, mcapThen: 3300000, mcapNow: DEMO_TOKENS[3].mcap, risk: "moderate" },
  { mint: DEMO_TOKENS[4].mint, chain: "bsc", symbol: "CAKE", name: "PancakeSwap", at: "3d ago", scoreThen: 12, scoreNow: 12, mcapThen: 739000000, mcapNow: DEMO_TOKENS[4].mcap, risk: "low" },
];

export function HistoryLedger() {
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => SCANNED.filter((s) => filter === "all" || (filter === "risk" ? ["critical", "high"].includes(s.risk) : s.scoreNow - s.scoreThen >= 15)), [filter]);
  return <>
    <Panel flush>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surf2/40 px-3 py-2"><span className="t-eyebrow mr-1">show</span>{[["all", "all scans"], ["risk", "high risk"], ["change", "score jump ≥15"]].map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`min-h-9 border px-2.5 font-mono text-[10px] uppercase tracking-[0.05em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid ${filter === key ? "border-acid/50 bg-acid/10 text-acid" : "border-line text-fg4 hover:border-line2 hover:text-fg2"}`}>{label}</button>)}<Tag tone="neutral" className="ml-auto">{rows.length} scans</Tag></div>
      <div className="grid grid-cols-[minmax(0,1fr)_48px_64px] items-baseline gap-x-2 border-b border-line px-3 py-2 sm:grid-cols-[minmax(0,1fr)_64px_72px_80px]"><span className="t-eyebrow">token · scan time</span><span className="t-eyebrow text-right">Δ score</span><span className="hidden t-eyebrow text-right sm:block">Δ mcap</span><span className="t-eyebrow text-right">then → now</span></div>
      {rows.map((s) => { const scoreDelta = s.scoreNow - s.scoreThen; const mcapDelta = ((s.mcapNow - s.mcapThen) / s.mcapThen) * 100; return <Link key={s.mint} href={`/token/${s.chain}/${s.mint}`} className="drow grid grid-cols-[minmax(0,1fr)_48px_64px] items-center gap-x-2 border-b border-line px-3 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_64px_72px_80px]"><div className="min-w-0"><div className="flex items-baseline gap-1.5"><RiskDot risk={s.risk} /><span className="truncate t-xs font-semibold text-fg">{s.symbol}</span><span className="shrink-0 t-mono text-[9.5px] text-fg4">{s.at}</span></div><div className="mt-0.5 truncate t-xs text-fg4">{s.name}</div></div><span className={`text-right t-mono text-[11px] ${scoreDelta > 10 ? "text-bad" : scoreDelta < -10 ? "text-good" : "text-fg3"}`}>{scoreDelta > 0 ? "+" : ""}{scoreDelta}</span><span className={`hidden text-right t-mono text-[10.5px] sm:block ${mcapDelta < -15 ? "text-bad" : mcapDelta > 15 ? "text-good" : "text-fg4"}`}>{mcapDelta > 0 ? "+" : ""}{mcapDelta.toFixed(1)}%</span><span className="text-right t-mono text-[10px] text-fg4">{s.scoreThen} → <span className="text-fg2">{s.scoreNow}</span></span></Link>; })}
      {!rows.length && <p className="p-5 t-sm text-fg4">No scans match this view.</p>}
    </Panel>
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2"><Panel title="Score movement" note="red is new risk since the scan"><div className="space-y-2">{SCANNED.filter((s) => s.scoreNow !== s.scoreThen).map((s) => <div key={s.mint}><div className="flex items-baseline justify-between"><span className="t-xs text-fg3">{s.symbol}</span><span className="t-mono text-[10.5px] text-bad">{s.scoreThen} → {s.scoreNow}</span></div><div className="mt-1 flex h-1 w-full overflow-hidden bg-surf3"><div className="bg-fg4" style={{ width: `${s.scoreThen}%` }} /><div className="bg-bad" style={{ width: `${s.scoreNow - s.scoreThen}%` }} /></div></div>)}</div><p className="mt-2 t-xs leading-relaxed text-fg4">CATWIF gained 47 points in five hours — holder concentration changed, not the contract. Demo data, not live signals.</p></Panel><Panel title="Recent activity" note="entities opened, newest first" flush>{[{ kind: "token", label: "RATS", at: "2h ago" }, { kind: "caller", label: "@cryptocole", at: "2h ago" }, { kind: "token", label: "CATWIF", at: "5h ago" }, { kind: "wallet", label: "BBPzEy…RRbMNk", at: "5h ago" }, { kind: "deployer", label: "3cJu879…Rdvyw", at: "8h ago" }, { kind: "token", label: "BONK", at: "1d ago" }].map((a) => <div key={`${a.kind}-${a.label}`} className="flex items-baseline gap-2 border-b border-line px-3 py-2 last:border-0"><span className="font-mono text-[9px] uppercase text-fg4">{a.kind}</span><span className="min-w-0 flex-1 truncate t-xs text-fg3">{a.label}</span><span className="t-mono text-[9.5px] text-fg4">{a.at}</span></div>)}</Panel></div>
    <NextSteps title="Keep the edge" steps={[{ from: "A token you scanned later collapsed", to: "Check the pre-rug receipts", href: "/rugs", tone: "bad" }, { from: "Same wallet keeps turning up", to: "Open its record", href: "/wallets" }, { from: "A caller keeps showing up", to: "Check the track record", href: "/callers", tone: "warn" }, { from: "Want a heads-up next time", to: "Set an alert", href: "/alerts", tone: "acid" }]} />
  </>;
}
