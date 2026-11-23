import { PageHead } from "@/components/Shell";
import { Demo, Panel, ProReveal, Tag } from "@/components/ui";
import { WalletDirectory } from "@/components/Intelligence3";
import { DEMO_TOKENS, WALLET_ROLE } from "@/lib/demo";

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
            <span className="t-eyebrow text-right">in scans</span>
            <span className="t-eyebrow text-right">prior rugs</span>
            <span className="t-eyebrow text-right">holds</span>
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

        <ProReveal
          title="What each address is, and which one leaves first"
          shown={0}
          rows={[]}
          more={[
            "A behaviour label per wallet, derived from its launch history, with confidence",
            "Median holding time before its first sell, per address",
            "Whether it buys inside the creation block or after the crowd",
            "Which wallet led the exit most often — the one that sets the price others exit into",
            "Every launch an address appears on, with the outcome of each",
          ]}
          note="A wallet with five launches and four collapses is a different object from one with a single appearance. The table above counts them the same"
        >
          <WalletDirectory />
        </ProReveal>
      </div>
    </div>
  );
}
