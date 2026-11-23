import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, RiskDot, Split, Stat, Tag } from "@/components/ui";
import { DEMO_RUGS, DEMO_TOKENS, DEMO_WALLETS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";
import { deployerRecord } from "@/lib/intel2";

/* ==================================================================== *
 * DEPLOYERS
 *
 * Reputation, not a profile page. The only question is whether this wallet
 * has done this before, and how those went — so the launch record is the page,
 * sorted worst first.
 * ==================================================================== */

export const metadata = { title: "Deployers" };

export default function DeployersPage() {
  const record = [
    { symbol: "RATS", mint: DEMO_TOKENS[0].mint, chain: "solana", at: "2026-11-18", peak: 612900, now: 43823, status: "live" as const },
    { symbol: "PEACH", mint: DEMO_RUGS[0].mint, chain: "solana", at: "2026-11-23", peak: 612900, now: null, status: "rugged" as const },
    { symbol: "JELLY", mint: DEMO_RUGS[4].mint, chain: "solana", at: "2026-11-09", peak: 420000, now: null, status: "rugged" as const },
    { symbol: "MOGX", mint: DEMO_RUGS[1].mint, chain: "solana", at: "2026-11-18", peak: 340000, now: null, status: "rugged" as const },
  ];

  return (
    <div>
      <PageHead
        title="Deployers"
        note="the wallet behind the launch, and everything it launched before"
        right={
          <>
            <Demo />
            <Tag tone="neutral">3 tracked</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">

        <Panel title="Deployer" note="one wallet, four launches, three dead" flush>
          <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
            {[
              { label: "launches", value: "4", sub: "on this chain" },
              { label: "rugged", value: "3", sub: "75% of launches", tone: "bad" },
              { label: "still holding", value: "0.0%", sub: "of this token" },
              { label: "funded by", value: "1 wallet", sub: "same source every time", tone: "hot" },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2">
                <Stat
                  label={s.label}
                  value={s.value}
                  sub={s.sub}
                  size="md"
                  tone={s.tone === "bad" ? "bad" : s.tone === "hot" ? "hot" : "default"}
                />
              </div>
            ))}
          </div>

          <div className="px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <Link
                href={`/deployers/${DEMO_WALLETS.dev}`}
                className="font-mono text-[11px] text-fg2 underline decoration-line2 underline-offset-2 hover:text-acid"
              >
                {DEMO_WALLETS.dev.slice(0, 10)}…{DEMO_WALLETS.dev.slice(-6)}
              </Link>
              <Tag tone="bad">repeat offender</Tag>
              <Tag tone="neutral">first seen 2026-10-30</Tag>
            </div>
            <p className="mt-1.5 t-xs leading-relaxed text-fg3">
              Every launch was funded from the same wallet, and every launch had wallets buying in
              the creation block. Three of the four collapsed within 48 hours of their peak
            </p>
          </div>
        </Panel>

        <Panel title="Launch record" note="worst first — the newest one is not the interesting one" flush>
          <div className="grid grid-cols-[minmax(0,1fr)_60px_56px_64px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_60px_64px_64px_60px]">
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right">date</span>
            <span className="hidden text-right t-eyebrow sm:block">peak</span>
            <span className="t-eyebrow text-right">now</span>
            <span className="t-eyebrow text-right">status</span>
          </div>
          {record
            .sort((a, b) => (a.status === "rugged" ? -1 : 1) - (b.status === "rugged" ? -1 : 1))
            .map((r) => (
              <Link
                key={r.mint}
                href={`/token/${r.chain}/${r.mint}`}
                className="drow grid grid-cols-[minmax(0,1fr)_60px_56px_64px] items-center gap-x-2.5 border-b border-line px-3 py-1.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_60px_64px_64px_60px]"
              >
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span className="truncate t-xs font-semibold text-fg">{r.symbol}</span>
                  <Tag tone={r.status === "rugged" ? "bad" : "neutral"}>{r.status}</Tag>
                </div>
                <span className="text-right t-mono text-[10px] text-fg4">{r.at.slice(5)}</span>
                <span className="hidden text-right t-mono text-[10.5px] text-fg3 sm:block">
                  {fmtUsd(r.peak)}
                </span>
                <span className={`text-right t-mono text-[10.5px] ${r.now === null ? "text-bad" : "text-fg2"}`}>
                  {r.now === null ? "−99%" : fmtUsd(r.now)}
                </span>
                <span className="text-right">
                  <RiskDot risk={r.status === "rugged" ? "critical" : "high"} />
                </span>
              </Link>
            ))}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Same hands, different tokens" note="wallets that appear on more than one of these launches">
            {[
              { addr: DEMO_WALLETS.funder, role: "funded every launch", count: 4 },
              { addr: DEMO_WALLETS.bundle1, role: "bought launch block", count: 3 },
              { addr: DEMO_WALLETS.bundle2, role: "bought launch block", count: 4 },
              { addr: DEMO_WALLETS.bundle3, role: "bought launch block", count: 3 },
              { addr: DEMO_WALLETS.insider1, role: "received supply", count: 2 },
            ].map((w) => (
              <div key={w.addr} className="border-b border-line py-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10.5px] text-fg2">
                    {w.addr.slice(0, 6)}…{w.addr.slice(-4)}
                  </span>
                  <span className="ml-auto t-mono text-[10px] text-warn">{w.count}/4</span>
                </div>
                <div className="mt-0.5 t-xs text-fg4">{w.role}</div>
                <div className="mt-1">
                  <Gauge pct={(w.count / 4) * 100} tone={w.count >= 3 ? "bad" : "warn"} height={3} />
                </div>
              </div>
            ))}
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              The same five wallets appear on three or more of this deployer&apos;s launches. Common
              participation is evidence of a relationship, not proof of one owner — the funding
              trace under Wallets is what closes that gap
            </p>
          </Panel>

          <Panel title="What separates the one that lived" note="RATS is still trading — why">
            <div className="space-y-1.5">
              <Split label="launch block buyers" tone="warn">
                22.4%
              </Split>
              <Split label="on the dead launches" tone="bad">
                41%+
              </Split>
              <Split label="sell synchrony here" tone="warn">
                71%
              </Split>
              <Split label="on the dead launches" tone="bad">
                93%
              </Split>
              <Split label="organic attention" tone="good">
                38/100
              </Split>
              <Split label="on the dead launches" tone="bad">
                under 20
              </Split>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg3">
              The launch that survived still has a quarter of its supply in one group and a 42-second
              exit window. It survived because it found a narrative, not because it was clean — which
              is the difference between a token that is safe and a token that is still alive
            </p>
          </Panel>
        </div>

        <ProReveal
          title="Every launch by this wallet"
          value={(() => {
            const d = deployerRecord(DEMO_RUGS[2].deployer);
            return d
              ? `${d.launchCount} launches on record, ${d.rugCount} collapsed, median drawdown ${d.medianDrawdown?.toFixed(0)}%`
              : "No launch record for this address";
          })()}
          clip={3}
          shown={2}
          rows={DEMO_RUGS.slice(2, 5).map((r) => (
            <div key={r.symbol} className="panel flex flex-wrap items-baseline gap-x-3 gap-y-1 px-2.5 py-1.5">
              <span className="font-mono text-[11px] text-fg">{r.symbol}</span>
              <RiskDot risk={r.drawdownPct > 95 ? "critical" : "high"} />
              <span className="font-mono text-[10.5px] tabular-nums text-bad">
                -{r.drawdownPct}%
              </span>
              <span className="t-xs tabular-nums text-fg4">peak ${(r.peakMc / 1000).toFixed(0)}k</span>
              <span className="ml-auto t-xs text-fg4">{r.signals[0]}</span>
            </div>
          ))}
          more={[
            "Which launches used the same configuration and funding source",
            "Wallets that received supply before the public launch on each one",
            "Whether any of those wallets also deploy tokens of their own",
            "The full funding tree: CEX hot wallet to intermediate to deployer",
            "Cross-chain: the same operator under a different address",
            "Every token this wallet deployed, including ones outside this database",
          ]}
          note="These are the real launch records for this deployer, worst first - the free view shows the two at the top"
        />
      </div>
    </div>
  );
}
