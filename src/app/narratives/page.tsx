import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, Split, Tag } from "@/components/ui";
import { NarrativeWalletGate } from "@/components/NarrativeGate";
import { NarrativeTable } from "@/components/Intelligence2";
import { NarrativeProRows } from "@/components/ProRows";
import { DEMO_NARRATIVES, DEMO_TOKENS } from "@/lib/demo";
import { allNarratives } from "@/lib/intel2";
import { fmtUsd } from "@/lib/http";
import { NextSteps } from "@/components/NextSteps";

export const metadata = { title: "Meta Radar" };

export default function NarrativesPage() {
  const analyses = allNarratives();
  const earlyCount = analyses.filter((n) => n.fit === "early").length;
  const trackedTokens = DEMO_TOKENS.filter((t) => DEMO_NARRATIVES.some((n) => n.name === t.narrative)).length;

  return (
    <div>
      <PageHead title="Narratives" note="See what’s already running—and how long it lasted." right={<Demo />} />
      <div className="space-y-4 p-3 sm:p-4">
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Narrative overview">
          {[
            { label: "Tracked ideas", value: DEMO_NARRATIVES.length, detail: "in this demo set" },
            { label: "Tokens on tracked ideas", value: trackedTokens, detail: "scanned examples" },
            { label: "Low-copy, rising", value: earlyCount, detail: "fit classified early" },
          ].map((stat) => <div key={stat.label} className="panel p-4"><div className="t-eyebrow">{stat.label}</div><div className="mt-1 font-mono text-3xl tabular-nums text-fg">{stat.value}</div><div className="mt-1 text-sm text-fg3">{stat.detail}</div></div>)}
        </section>
        <section aria-label="Tracked narratives" className="space-y-3">
          {analyses.map((analysis) => {
            const n = DEMO_NARRATIVES.find((item) => item.name === analysis.name)!;
            const tokens = DEMO_TOKENS.filter((t) => t.narrative === n.name);
            const closed = n.instances.filter((instance) => instance.hoursToMinus90 !== null);
            const fitTone = analysis.fit === "early" ? "good" : analysis.fit === "crowded" ? "bad" : analysis.fit === "dying" ? "warn" : "neutral";
            return <Panel key={n.name} flush className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3">
                <div className="min-w-0 flex-1"><div className="t-eyebrow">{n.trend} attention · {n.tokens} attempts</div><h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">{n.name}</h2></div>
                <Tag tone={fitTone}>{analysis.fit}</Tag>
                <div className="text-right"><div className="font-mono text-xl tabular-nums text-fg">{n.mindshare7d}%</div><div className="t-eyebrow">7d mindshare</div></div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
                <div>
                  <div className="flex items-baseline justify-between"><span className="t-eyebrow">Attention share</span><span className="t-mono text-xs text-fg3">7 days</span></div>
                  <div className="mt-2"><Gauge pct={n.mindshare7d * 3} tone={n.trend === "rising" ? "good" : n.trend === "cooling" ? "bad" : "acid"} height={7} /></div>
                  <p className="mt-3 text-sm leading-relaxed text-fg2">{analysis.reason}</p>
                  <div className="mt-4 space-y-1"><Split label="Prior runs that fell 90%">{closed.length} / {n.instances.length}</Split><Split label="Median time to −90%">{analysis.medianLifespanHours === null ? "Not measured" : `${analysis.medianLifespanHours}h`}</Split></div>
                  <div className="mt-2 text-xs text-fg4">{closed.length} of {n.instances.length} tracked attempts have a measured cycle.</div>
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="t-eyebrow">Tokens in the scan set</h3><span className="text-xs text-fg4">{tokens.length} tracked</span></div>
                  {tokens.length ? <div className="mt-2 divide-y divide-line border-y border-line">{tokens.map((t) => <Link key={t.mint} href={`/token/${t.chain}/${t.mint}`} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 py-2 hover:bg-surf2/50"><span className="font-semibold text-fg">{t.symbol}</span><Tag tone={t.copyIndex > 5 ? "bad" : t.copyIndex > 2 ? "warn" : "good"}>{t.copyIndex === 1 ? "original" : `copy #${t.copyIndex}`}</Tag><span className="t-mono text-xs text-fg3">{fmtUsd(t.mcap)}</span><span className="ml-auto text-xs text-fg4">{t.ageHours}h old <span aria-hidden>→</span></span></Link>)}</div> : <p className="mt-2 text-sm text-fg3">No scanned token is tagged with this narrative.</p>}
                  <div className="mt-3"><Split label="Copy count">{n.tokens === 1 ? "First attempt" : `${n.tokens} attempts`}</Split><Split label="Recorded prior tokens">{analysis.priorRuns}</Split></div>
                </div>
              </div>
              <NarrativeWalletGate narrative={n.name} />
            </Panel>;
          })}
        </section>
        <ProReveal title="Compare every narrative" value={`${analyses.filter((n) => n.fit === "crowded").length} crowded · ${earlyCount} classified early · ${analyses.length} tracked`} clip={5} shown={2} rows={[<NarrativeProRows key="n" />]} more={["Copy count against attention for all tracked narratives at once", "Which are early, crowded, recycled or dying, with the reason", "Median lifespan of prior attempts on each idea"]} note="Same read across all tracked ideas."><NarrativeTable /></ProReveal>
        <NextSteps title="Follow the evidence" steps={[
          { from: "An idea has a token in the scan set", to: "Check its current risk", href: "/check", tone: "acid" },
          { from: "The same wallet keeps launching", to: "Review the deployer’s record", href: "/deployers" },
          { from: "A caller is promoting the idea", to: "Check their call history", href: "/callers", tone: "warn" },
          { from: "See what is moving now", to: "Browse trending tokens", href: "/discover" },
        ]} />
      </div>
    </div>
  );
}
