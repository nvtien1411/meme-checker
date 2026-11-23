import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, RiskDot, Split, Stat, Tag } from "@/components/ui";
import { DeployerRecordPanel } from "@/components/Intelligence2";
import { DEMO_RUGS, DEMO_TOKENS, DEMO_WALLETS, shortAddr } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * DEPLOYER PROFILE — "same dev, different token"
 *
 * The single most useful thing about a deployer is not its address, it is
 * its earlier launches. A wallet with four tokens and three collapses tells
 * you more than any risk score, because you can read exactly what it did.
 *
 * The page is ordered by that: the record first, then the pattern across
 * launches, then the wallets that show up repeatedly behind them.
 * ==================================================================== */

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = await params;
  return { title: `Deployer ${shortAddr(addr, 6, 4)}` };
}

/** Launches this deployer is credited with, assembled from the dataset. */
function launchesFor(addr: string) {
  const rugs = DEMO_RUGS.filter((r) => r.deployer === addr).map((r) => ({
    symbol: r.symbol,
    mint: r.mint,
    chain: r.chain,
    at: r.at,
    peak: r.peakMc,
    drawdown: r.drawdownPct,
    status: "rugged" as const,
    flag: r.flag,
    signals: r.signals,
  }));

  const live = DEMO_TOKENS.filter((t) => t.mint === DEMO_TOKENS[0].mint && addr === DEMO_WALLETS.dev).map((t) => ({
    symbol: t.symbol,
    mint: t.mint,
    chain: t.chain,
    at: "2026-11-18",
    peak: 612900,
    drawdown: null,
    status: "live" as const,
    flag: "live" as const,
    signals: [] as string[],
  }));

  return [...live, ...rugs];
}

export default async function DeployerPage({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = await params;
  const decoded = decodeURIComponent(addr);
  const launches = launchesFor(decoded);

  if (launches.length === 0) notFound();

  const rugged = launches.filter((l) => l.status === "rugged").length;
  const rate = (rugged / launches.length) * 100;

  // Wallets that appear on more than one of this deployer's launches.
  const shared = [DEMO_WALLETS.funder, DEMO_WALLETS.bundle1, DEMO_WALLETS.bundle2, DEMO_WALLETS.bundle3, DEMO_WALLETS.insider1];

  return (
    <div>
      <PageHead
        title={shortAddr(decoded, 8, 6)}
        note="deployer record"
        right={
          <>
            <Demo />
            <Tag tone={rugged >= 3 ? "bad" : rugged > 0 ? "warn" : "good"}>
              {rugged}/{launches.length} collapsed
            </Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <DeployerRecordPanel addr={decoded} />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: "launches", value: `${launches.length}`, sub: "on this chain" },
            { label: "collapsed", value: `${rugged}`, sub: `${rate.toFixed(0)}% of launches`, tone: "bad" },
            { label: "best result", value: fmtUsd(Math.max(...launches.map((l) => l.peak))), sub: "peak market cap" },
            {
              label: "shared wallets",
              value: `${shared.length}`,
              sub: "appear on 3+ launches",
              tone: "hot",
            },
          ].map((s) => (
            <div key={s.label} className="panel p-2.5">
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

        <Panel title="Same dev, different token" note="every launch on record, worst outcome first" flush>
          {[...launches]
            .sort((a, b) => (a.status === "rugged" ? -1 : 1) - (b.status === "rugged" ? -1 : 1))
            .map((l) => (
              <Link
                key={l.mint}
                href={`/token/${l.chain}/${l.mint}`}
                className="drow block border-b border-line px-3 py-2 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <RiskDot risk={l.status === "rugged" ? "critical" : "high"} />
                  <span className="t-xs font-semibold text-fg">{l.symbol}</span>
                  <Tag tone={l.status === "rugged" ? "bad" : "neutral"}>{l.status}</Tag>
                  <span className="t-mono text-[9.5px] text-fg4">{l.at}</span>
                  <span className="t-xs text-fg4">peak {fmtUsd(l.peak)}</span>
                  <span className={`ml-auto t-mono text-[11px] ${l.drawdown !== null ? "text-bad" : "text-fg3"}`}>
                    {l.drawdown !== null ? `−${l.drawdown.toFixed(1)}%` : "still trading"}
                  </span>
                </div>
                {l.signals.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 pl-4">
                    {l.signals.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="border border-line px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.04em] text-fg4"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="The pattern" note="what separates the launch that lived from the ones that did not">
            <div className="space-y-0">
              <Split label="launch-block supply, dead tokens" tone="bad">
                41%+
              </Split>
              <Split label="launch-block supply, survivor" tone="warn">
                22.4%
              </Split>
              <Split label="sell synchrony, dead tokens" tone="bad">
                93%
              </Split>
              <Split label="sell synchrony, survivor" tone="warn">
                71%
              </Split>
              <Split label="organic attention, dead tokens" tone="bad">
                under 20
              </Split>
              <Split label="organic attention, survivor" tone="good">
                38
              </Split>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg3">
              The one that survived still has a quarter of supply in one group and a 42-second exit
              window. It lived because it found an audience, not because it was clean — which is the
              difference between a token that is safe and one that is temporarily alive
            </p>
          </Panel>

          <Panel title="Wallets behind the launches" note="the same addresses, every time" flush>
            {shared.map((a) => (
              <Link
                key={a}
                href={`/wallets/${a}`}
                className="drow flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0"
              >
                <span className="font-mono text-[10.5px] text-fg2">{shortAddr(a, 6, 4)}</span>
                <Tag tone={a === DEMO_WALLETS.funder ? "bad" : "warn"}>
                  {a === DEMO_WALLETS.funder ? "funder" : a === DEMO_WALLETS.insider1 ? "insider" : "bundler"}
                </Tag>
                <span className="ml-auto t-xs text-fg4">
                  {a === DEMO_WALLETS.funder ? "seeded every launch" : "bought the creation block"}
                </span>
              </Link>
            ))}
            <div className="px-3 py-2">
              <div className="flex items-baseline justify-between">
                <span className="t-xs text-fg4">appearances across launches</span>
                <span className="t-mono text-[10px] text-bad">3–4 of 4</span>
              </div>
              <div className="mt-1">
                <Gauge pct={87} tone="bad" height={3} />
              </div>
              <p className="mt-1.5 t-xs leading-relaxed text-fg4">
                Common participation is evidence of a relationship, not proof of one owner. The
                funding trail is what closes that gap
              </p>
            </div>
          </Panel>
        </div>

        <ProReveal
          title="The record, and the tree behind it"
          shown={0}
          rows={[]}
          more={[
            "Every token this wallet deployed, including ones outside this dataset",
            "Which of them used the same launch configuration and funding source",
            "Supply recipients before each public launch",
            "Whether any recipient is itself a deployer of other tokens",
            "The funding tree from exchange hot wallet to deployer, hop by hop",
            "The same operator on other chains under a different address",
            "Alerts when this deployer launches again",
          ]}
          note="The free view counts the launches. This is what each one did and where the money came from"
        >
          <Panel title="Funding tree" note="from source to deployer, with each hop timed">
            <ol className="space-y-1">
              {[
                { hop: 0, addr: "CEX hot wallet", at: "2026-10-29 11:02", amount: "4.2 SOL" },
                { hop: 1, addr: DEMO_WALLETS.funder, at: "2026-10-29 11:09", amount: "4.0 SOL" },
                { hop: 2, addr: DEMO_WALLETS.dev, at: "2026-10-30 08:14", amount: "1.8 SOL" },
                { hop: 3, addr: DEMO_WALLETS.bundle1, at: "2026-11-06 19:41", amount: "0.9 SOL" },
                { hop: 3, addr: DEMO_WALLETS.bundle2, at: "2026-11-06 19:48", amount: "0.9 SOL" },
                { hop: 3, addr: DEMO_WALLETS.bundle3, at: "2026-11-06 19:52", amount: "0.8 SOL" },
              ].map((h, i) => (
                <li key={`${h.addr}-${i}`} className="flex items-baseline gap-2 border-b border-line py-1 last:border-b-0">
                  <span className="w-3 shrink-0 t-mono text-[9px] text-fg4">{"·".repeat(h.hop) || "•"}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-fg2">
                    {h.addr.length > 24 ? shortAddr(h.addr, 8, 6) : h.addr}
                  </span>
                  <span className="t-mono text-[9.5px] text-fg4">{h.at}</span>
                  <span className="w-14 text-right t-mono text-[10px] text-fg3">{h.amount}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 t-xs leading-relaxed text-fg3">
              One exchange withdrawal split into a deployer wallet and three buyer wallets inside
              eleven minutes. The trail ends at the exchange, which is the normal limit — but the
              split itself is the finding
            </p>
          </Panel>
        </ProReveal>
      </div>
    </div>
  );
}
