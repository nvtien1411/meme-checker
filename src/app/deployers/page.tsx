import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, ProReveal, Tag } from "@/components/ui";
import { DEMO_RUGS, DEMO_TOKENS, DEMO_WALLETS, shortAddr } from "@/lib/demo";
import { deployerRecord } from "@/lib/intel2";
import { DeployerProRows } from "@/components/ProRows";
import { PeekButton } from "@/components/report";
import { NextSteps } from "@/components/NextSteps";

export const metadata = { title: "Deployers" };
type Launch = { symbol: string; mint: string; chain: string; at: string; drawdown: number | null; live: boolean };
const liveDeployer = DEMO_WALLETS.dev;
function launchesFor(addr: string): Launch[] {
  const rugs = DEMO_RUGS.filter((r) => r.deployer === addr).map((r) => ({ symbol: r.symbol, mint: r.mint, chain: r.chain, at: r.at, drawdown: r.drawdownPct, live: false }));
  const live = addr === liveDeployer ? [{ symbol: DEMO_TOKENS[0].symbol, mint: DEMO_TOKENS[0].mint, chain: DEMO_TOKENS[0].chain, at: "Tracked live", drawdown: null, live: true }] : [];
  return [...live, ...rugs];
}
export default function DeployersPage() {
  const addresses = [...new Set([...DEMO_RUGS.map((r) => r.deployer), liveDeployer])];
  const records = addresses.map((addr) => ({ addr, launches: launchesFor(addr), record: deployerRecord(addr) })).filter((row) => row.launches.length > 0).sort((a, b) => (b.record?.rugCount ?? 0) - (a.record?.rugCount ?? 0) || b.launches.length - a.launches.length);
  const launches = records.flatMap((row) => row.launches);
  const collapsed = launches.filter((launch) => launch.drawdown !== null && launch.drawdown >= 90).length;
  return <div><PageHead title="Deployers" note="One wallet. Every launch on record." right={<Demo />} /><div className="space-y-4 p-3 sm:p-4">
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Deployer overview">{[{ label: "Wallets tracked", value: records.length }, { label: "Launches on record", value: launches.length }, { label: "Fell 90%+", value: collapsed }].map((item) => <div key={item.label} className="panel p-4"><div className="t-eyebrow">{item.label}</div><div className="mt-1 font-mono text-3xl tabular-nums text-fg">{item.value}</div><div className="mt-1 text-xs text-fg4">Demo dataset</div></div>)}</section>
    <section aria-label="Tracked deployers" className="space-y-3">{records.map(({ addr, launches: history, record }) => <Panel key={addr} flush className="overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3"><div className="min-w-0 flex-1"><div className="t-eyebrow">{record?.verdict ?? "launch history"} · {history.length} launches</div><h2 className="mt-1 font-mono text-lg text-fg">{shortAddr(addr, 8, 6)}</h2></div><PeekButton addr={addr} /><Link href={`/deployers/${addr}`} className="inline-flex min-h-11 items-center rounded border border-line px-3 text-sm font-semibold text-fg hover:border-acid hover:text-acid">Full record →</Link></header>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"><div><div className="t-eyebrow">Launch outcomes</div><div className="mt-2 grid grid-cols-2 gap-3">{[{ label: "Launches", value: history.length }, { label: "Collapsed ≥90%", value: record?.rugCount ?? 0 }, { label: "Worst drawdown", value: record?.worstDrawdown == null ? "Not measured" : `${record.worstDrawdown.toFixed(1)}%` }, { label: "Median drawdown", value: record?.medianDrawdown == null ? "Not measured" : `${record.medianDrawdown.toFixed(1)}%` }].map((item) => <div key={item.label} className="border-b border-line py-2"><div className="t-eyebrow">{item.label}</div><div className="mt-1 font-mono text-lg tabular-nums text-fg">{item.value}</div></div>)}</div>{record?.evidence[0] && <p className="mt-3 text-sm leading-relaxed text-fg3">{record.evidence[0]}</p>}<p className="mt-2 text-xs text-fg4">Drawdown describes recorded launch outcomes; wallet attribution is not proof of common ownership.</p></div>
        <div><div className="flex items-baseline justify-between"><h3 className="t-eyebrow">Every launch on record</h3><span className="text-xs text-fg4">worst drawdown first</span></div><div className="mt-2 divide-y divide-line border-y border-line">{[...history].sort((a, b) => (b.drawdown ?? -1) - (a.drawdown ?? -1)).map((launch) => <Link key={launch.mint} href={`/token/${launch.chain}/${launch.mint}`} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 py-2 hover:bg-surf2/50"><span className="font-semibold text-fg">{launch.symbol}</span><Tag tone={launch.live ? "neutral" : launch.drawdown !== null && launch.drawdown >= 90 ? "bad" : "warn"}>{launch.live ? "tracked" : launch.drawdown !== null && launch.drawdown >= 90 ? "collapsed" : "drawdown"}</Tag><span className="text-xs text-fg4">{launch.at}</span><span className="ml-auto t-mono text-sm text-fg3">{launch.drawdown === null ? "No completed drawdown" : `−${launch.drawdown.toFixed(1)}%`}</span></Link>)}</div></div>
      </div>
    </Panel>)}</section>
    <ProReveal title="Deployer links & funding context" shown={3} rows={[<DeployerProRows key="dp" />]} more={["Which launches used the same configuration and funding source", "Wallets that received supply before the public launch on each one", "Whether any of those wallets also deploy tokens of their own", "The full funding tree: CEX hot wallet to intermediate to deployer", "Cross-chain: the same operator under a different address", "Every token this wallet deployed, including ones outside this database"]} note="Explore relationships as evidence, not proof of common ownership."><p className="text-sm text-fg3">Deployer relationships and funding paths are recorded demo evidence; connections alone don’t establish who controls a wallet.</p></ProReveal>
    <NextSteps title="From a deployer record" steps={[{ from: "This wallet launched again recently", to: "Check the newest token", href: "/check", tone: "acid" }, { from: "Its launches share wallets", to: "Inspect who bought together", href: "/investigation" }, { from: "A caller promoted one", to: "Review their own exits", href: "/callers", tone: "warn" }, { from: "Find other collapsed launches", to: "Open the rug archive", href: "/rugs", tone: "bad" }]} />
  </div></div>;
}
