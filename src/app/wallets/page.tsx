import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, Split, Tag, UpgradeStrip } from "@/components/ui";
import { Sparkline } from "@/components/viz";
import { DEMO_TOKENS, DEMO_WALLETS, WALLET_ROLE } from "@/lib/demo";

/* ==================================================================== *
 * WALLETS — the directory, and the memory behind it
 *
 * A wallet is a persistent entity, not a row in a holder table. The point of
 * this page is that the same address appearing in four launches means
 * something, and that only works if the address is one record everywhere.
 * ==================================================================== */

export const metadata = { title: "Wallets" };

export default function WalletsPage() {
  // Build a directory from every token's wallet list, merging by address so a
  // wallet that appears on two tokens is one row with two entries.
  const dir = new Map<string, { addr: string; pct: number; tokens: string[]; tags: Set<string>; priorRugs: number; priorLaunches: number }>();

  for (const t of DEMO_TOKENS) {
    for (const w of t.wallets) {
      const cur = dir.get(w.addr) ?? {
        addr: w.addr,
        pct: 0,
        tokens: [],
        tags: new Set<string>(),
        priorRugs: w.priorRugs ?? 0,
        priorLaunches: w.priorLaunches ?? 0,
      };
      cur.pct += w.pct ?? 0;
      cur.tokens.push(t.symbol);
      (w.tags ?? []).forEach((tag) => cur.tags.add(tag));
      dir.set(w.addr, cur);
    }
  }

  const rows = [...dir.values()].sort((a, b) => b.tokens.length - a.tokens.length || b.pct - a.pct);

  return (
    <div>
      <PageHead
        title="Wallets"
        note="every address the scanner has seen, and where it appeared"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{rows.length} wallets</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <UpgradeStrip what="Full trade history, PnL and the funding trail behind each address are Pro" />

        <Panel title="Wallet memory" note="why an address is a record and not a row">
          <p className="t-xs leading-relaxed text-fg3">
            A wallet that bought the launch of three tokens that later collapsed is one piece of
            evidence. A wallet that bought one is a coincidence. Keeping the address as a single
            record across every scan is what turns a column of hashes into a reputation — and it is
            the only way a wallet can be flagged before it does anything on this token
          </p>
        </Panel>

        <Panel flush>
          <div className="grid grid-cols-[minmax(0,1fr)_64px_44px_44px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_80px_52px_52px_60px]">
            <span className="t-eyebrow">wallet</span>
            <span className="hidden t-eyebrow sm:block">role</span>
            <span className="t-eyebrow text-right">seen</span>
            <span className="t-eyebrow text-right">rugs</span>
            <span className="t-eyebrow text-right">held</span>
          </div>

          {rows.slice(0, 14).map((w) => {
            const role = WALLET_ROLE[w.addr] ?? [...w.tags][0] ?? "unclassified";
            const rugTone = w.priorRugs >= 3 ? "text-bad" : w.priorRugs > 0 ? "text-warn" : "text-fg4";
            return (
              <div
                key={w.addr}
                className="drow grid grid-cols-[minmax(0,1fr)_64px_44px_44px] items-center gap-x-2.5 border-b border-line px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_80px_52px_52px_60px]"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate font-mono text-[10.5px] text-fg2">
                      {w.addr.slice(0, 8)}…{w.addr.slice(-6)}
                    </span>
                    {w.priorRugs >= 3 && <Tag tone="bad">repeat offender</Tag>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
                    <span className="truncate t-xs text-fg4">{w.tokens.join(" · ")}</span>
                  </div>
                </div>
                <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.05em] text-fg3 sm:block">
                  {role}
                </span>
                <span className="text-right t-mono text-[10.5px] text-fg3">{w.tokens.length}</span>
                <span className={`text-right t-mono text-[10.5px] ${rugTone}`}>
                  {w.priorRugs > 0 ? w.priorRugs : "—"}
                </span>
                <span className="text-right t-mono text-[10.5px] text-fg3">{w.pct.toFixed(2)}%</span>
              </div>
            );
          })}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Repeat-offender wallets" note="seen on more than two tokens that later collapsed">
            {[
              { addr: DEMO_WALLETS.bundle1, rugs: 4, launches: 7, pct: 18.7 },
              { addr: DEMO_WALLETS.bundle2, rugs: 4, launches: 7, pct: 2.4 },
              { addr: DEMO_WALLETS.bundle3, rugs: 3, launches: 6, pct: 1.3 },
              { addr: DEMO_WALLETS.sniper1, rugs: 12, launches: 19, pct: 0.9 },
              { addr: DEMO_WALLETS.sniper2, rugs: 11, launches: 16, pct: 0.7 },
            ].map((w) => (
              <div key={w.addr} className="border-b border-line py-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10.5px] text-fg2">
                    {w.addr.slice(0, 6)}…{w.addr.slice(-4)}
                  </span>
                  <span className="ml-auto t-mono text-[10px] text-bad">{w.rugs} rugs</span>
                </div>
                <div className="mt-1">
                  <Gauge pct={(w.rugs / w.launches) * 100} tone="bad" height={3} />
                </div>
                <div className="mt-0.5 t-xs text-fg4">
                  {w.rugs} of {w.launches} prior launches collapsed
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Smart money on the book" note="wallets with a profitable history">
            {[
              { addr: DEMO_WALLETS.smart1, launches: 41, rugs: 2, pct: 1.1, trend: [1, 2, 2, 3, 4, 5, 5, 6] },
              { addr: DEMO_WALLETS.smart2, launches: 63, rugs: 4, pct: 0.8, trend: [4, 3, 5, 4, 6, 5, 7, 6] },
            ].map((w) => (
              <div key={w.addr} className="border-b border-line py-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10.5px] text-fg2">
                    {w.addr.slice(0, 6)}…{w.addr.slice(-4)}
                  </span>
                  <Tag tone="good">smart money</Tag>
                  <span className="ml-auto t-mono text-[10px] text-fg3">{w.pct}%</span>
                </div>
                <div className="mt-1">
                  <Sparkline values={w.trend} tone="good" />
                </div>
                <div className="t-xs text-fg4">
                  {w.launches} launches, {w.rugs} of them collapsed
                </div>
              </div>
            ))}
          </Panel>
        </div>

        <Panel title="Funding origins" note="where the opening balance came from">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Split label="shared funder wallet">
              {DEMO_WALLETS.funder.slice(0, 6)}…{DEMO_WALLETS.funder.slice(-4)}
            </Split>
            <Split label="wallets it backed here" tone="bad">
              3
            </Split>
            <Split label="funded within">11 min of each other</Split>
            <Split label="first seen">2026-11-06</Split>
            <Split label="deployer received from same source" tone="bad">
              yes
            </Split>
            <Split label="prior tokens with this funder">6</Split>
          </div>
          <p className="mt-2 t-xs leading-relaxed text-fg4">
            Three wallets funded within eleven minutes from one source, all buying the launch block,
            is one participant — not three. Unfunded wallets stay unclassified
          </p>
        </Panel>
      </div>
    </div>
  );
}
