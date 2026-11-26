"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/Shell";
import { Demo, Panel } from "@/components/ui";
import { useViewer } from "@/lib/viewer";
import { Table } from "@/components/Table";
import { PeekButton } from "@/components/report";
import { WalletProRows } from "@/components/ProRows";
import { DEMO_TOKENS, WALLET_ROLE } from "@/lib/demo";
import { classifyWallet, exitOrdering, walletNetwork, walletProfile } from "@/lib/intel";

const exits = exitOrdering();
const scans = new Map<string, Set<string>>();
for (const token of DEMO_TOKENS) {
  for (const { addr } of token.wallets) {
    const symbols = scans.get(addr) ?? new Set<string>();
    symbols.add(token.symbol);
    scans.set(addr, symbols);
  }
}
const addresses = [...new Set([...scans.keys(), ...walletNetwork().nodes.map((n) => n.addr)])];
const directory = addresses.map((addr) => {
  const profile = walletProfile(addr);
  const tokens = [...(scans.get(addr) ?? [])];
  const history = exits.filter((exit) => exit.addr === addr);
  return {
    addr, tokens,
    role: profile ? classifyWallet(profile).label : WALLET_ROLE[addr] ?? "Unclassified",
    launches: profile?.launchCount ?? null,
    rugs: profile?.rugCount ?? null,
    hold: profile?.medianHoldMin ?? null,
    firstOut: history.length ? history.filter((exit) => exit.position === 1).length : null,
  };
});

type Sort = "launches" | "rugs" | "firstOut";
const views = [["launches", "All wallets"], ["rugs", "Rug history"], ["firstOut", "First out"]] as const;
const linkClass = "inline-flex min-h-11 items-center text-sm font-semibold text-fg2 hover:text-acid";
const cell = "t-mono tabular-nums text-fg2";

export function WalletsClient() {
  const { pro, setPro } = useViewer();
  const [view, setView] = useState<Sort>("launches");
  const [sort, setSort] = useState<Sort>("launches");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = directory.filter((w) => (view === "launches" || (w[view] ?? 0) > 0) && [w.addr, w.role, ...w.tokens].some((v) => v.toLowerCase().includes(needle)))
    .sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1) || (b.launches ?? 0) - (a.launches ?? 0) || b.tokens.length - a.tokens.length);

  return (
    <div>
      <PageHead title="Wallet Tracker" note="Who keeps showing up, and who gets out first?" right={<Demo />} />
      <div className="space-y-4 p-3 sm:p-4">
        <Panel flush>
          <div className="flex flex-wrap items-center gap-x-5 border-b border-line px-3" role="group" aria-label="Wallet view">
            {views.map(([id, label]) => <button key={id} type="button" onClick={() => { setView(id); setSort(id); }} aria-pressed={view === id} className={`min-h-11 border-b-2 px-1 text-sm font-semibold ${view === id ? "border-acid text-acid" : "border-transparent text-fg3 hover:text-fg"}`}>{label}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <input type="search" aria-label="Filter wallets" placeholder="Address, token or behavior" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-line bg-bg px-3 text-sm text-fg placeholder:text-fg4 sm:max-w-72" />
            <span role="status" className="ml-auto t-xs tabular-nums text-fg3">{rows.length} / {directory.length} wallets</span>
          </div>
          {rows.length ? <div className="overflow-x-auto" role="region" aria-label="Wallet results" tabIndex={0}><div className="min-w-[0px] sm:min-w-[550px]">
            <Table rows={rows} sort={sort} onSort={(key) => setSort(key as Sort)} rowKey={(w) => w.addr} cols={[
              { head: "Wallet", width: "minmax(140px,1fr)", render: (w) => <span className="block min-w-0 py-1" title={w.addr}>
                <span className="flex items-center gap-2">
                  <PeekButton addr={w.addr} className="truncate text-left font-semibold" />
                  {w.tokens.length > 0 && <Link className="shrink-0 text-sm text-fg3 hover:text-acid" href={`/wallets/${w.addr}`} aria-label={`Open wallet ${w.addr}`}>↗</Link>}
                </span>
                <span className="block truncate t-xs text-fg4">{w.role}{w.tokens.length > 0 ? ` · ${w.tokens.join(" / ")}` : " · Launch archive"}</span>
              </span> },
              { head: "Rugs", width: "58px", align: "right", sortKey: "rugs", hint: "Archived launches this wallet appeared in that rugged", render: (w) => <span className={w.rugs ? "t-mono tabular-nums text-warn" : cell}>{w.rugs ?? "—"}</span> },
              { head: "First out", width: "74px", align: "right", sortKey: "firstOut", hint: "How often this wallet sold first among wallets with recorded exits", render: (w) => <span className={cell}>{w.firstOut ?? "—"}</span> },
              { head: "Launches", width: "74px", align: "right", sortKey: "launches", render: (w) => <span className={cell}>{w.launches ?? "—"}</span> },
              { head: "Med. hold", width: "76px", align: "right", hint: "Median time to recorded first sale", render: (w) => <span className={cell}>{w.hold == null ? "—" : w.hold < 90 ? `${Math.round(w.hold)}m` : `${(w.hold / 60).toFixed(1)}h`}</span> },
            ]} />
          </div></div> : <div className="border-t border-line px-3 py-2 text-sm text-fg3">No demo wallets match. <button type="button" onClick={() => { setQuery(""); setView("launches"); setSort("launches"); }} className="min-h-11 px-2 text-acid hover:underline">Clear filters</button></div>}
          <p className="border-t border-line px-3 py-2 t-xs text-fg3">First out compares recorded exits. A dash means no record, not zero.</p>
        </Panel>
        <nav aria-label="Wallet investigation tools" className="flex flex-wrap gap-x-5">
          <Link href="/investigation" className={linkClass}>Open funding graph →</Link>
          <Link href="/deployers" className={linkClass}>Deployer history →</Link>
          <Link href="/watchlist" className={linkClass}>Watchlist →</Link>
        </nav>
        <Panel title="Wallet exit behavior" note="Exit as a share of peak · creation-block entries" flush right={<Demo />}>
          <WalletProRows addrs={directory.filter((w) => w.launches !== null).sort((a, b) => (b.launches ?? 0) - (a.launches ?? 0)).slice(0, pro ? 12 : 2).map((w) => w.addr)} />
          {!pro && <div className="flex flex-wrap items-center gap-x-4 border-t border-line px-3">
            <button type="button" onClick={() => setPro(true)} className="min-h-11 text-sm font-semibold text-acid hover:underline">Show more in Pro preview →</button>
            <Link href="/pricing" className="text-sm text-fg3 hover:text-fg">Compare plans</Link>
          </div>}
        </Panel>
      </div>
    </div>
  );
}
