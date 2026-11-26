"use client";

import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, Tag } from "@/components/ui";
import { useViewer } from "@/lib/viewer";
import { FREE_VALUE, PLAN, PRO_VALUE, SCAN_LIMIT } from "@/lib/plan";
import { DEMO_CALLERS, DEMO_RUGS } from "@/lib/demo";
import { DEMO_LAUNCHES } from "@/lib/launches";

const caller = [...DEMO_CALLERS].sort((a, b) => b.exitVsCall - a.exitVsCall)[0];
const rug = DEMO_RUGS[0];
const launch = DEMO_LAUNCHES.find((record) => record.mint === rug.mint);
const link = "inline-flex min-h-11 items-center text-sm font-semibold text-fg2 hover:text-acid";
const action = "flex min-h-11 w-full items-center justify-center rounded border px-3 text-sm font-semibold transition-colors";
const planned = new Set(["Alerts when this deployer launches again", "Behavioural alert rules: cluster moves, deployer launches, insider transfers"]);

export default function PricingPage() {
  const { pro, toggle } = useViewer();

  return (
    <div>
      <PageHead title="Plans" note="Scan for red flags. Dig into who’s behind them." right={<Tag tone="neutral">No billing</Tag>} />
      <div className="mx-auto max-w-5xl space-y-4 p-3 sm:p-4">
        <section aria-label="Compare plans" className="grid gap-3 md:grid-cols-2">
          <div className="panel flex flex-col p-4 sm:p-5">
            <h2 className="t-section text-fg">Free</h2>
            <p className="mt-3 t-mono text-3xl text-fg">${PLAN.free.price}</p>
            <p className="mt-2 text-sm text-fg2">Check the contract before you ape.</p>
            <ul className="mt-4 flex-1 list-disc space-y-2 pl-4 text-sm text-fg3">
              <li>Sellability, mint, freeze and liquidity checks</li>
              <li>Holder concentration, bundle counts and market depth</li>
              <li>Risk verdict with evidence and links to calls</li>
            </ul>
            <Link href="/check" className={`${action} mt-5 border-line text-fg hover:bg-surf2`}>Scan a token →</Link>
          </div>
          <div className="panel flex flex-col border-acid/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="t-section text-fg">Pro</h2><Tag tone="acid">Free preview</Tag></div>
            <p className="mt-3 t-mono text-3xl text-acid">${PLAN.pro.price}<span className="ml-1 text-sm text-fg3">/mo planned</span></p>
            <p className="mt-2 text-sm text-fg2">See who bought early and who got out first.</p>
            <ul className="mt-4 flex-1 list-disc space-y-2 pl-4 text-sm text-fg3">
              <li>Everything in Free, plus wallet and funding history</li>
              <li>Caller buy timing, exit behavior and follower quality</li>
              <li>Deployer track records and recycled narratives</li>
            </ul>
            <button type="button" onClick={toggle} aria-pressed={pro} className={`${action} mt-5 ${pro ? "border-acid/40 text-acid hover:bg-acid/10" : "border-acid bg-acid text-bg hover:bg-acid2"}`}>{pro ? "Turn off Pro preview" : "Try Pro preview →"}</button>
          </div>
        </section>
        <p role="status" className="t-xs text-fg3">{pro ? "Pro preview is on. " : ""}No card or account. Pro data is demo. Free scan limit: {SCAN_LIMIT}/day in this browser.</p>

        <Panel title="What the extra context shows" right={<Demo />} flush>
          <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-fg">Who had supply at launch?</h3>
              <p className="mt-1 text-sm text-fg3">{rug.symbol}{launch ? ` had ${launch.bundlePct}% bundled at launch and` : ""} fell <strong className="text-bad">{rug.drawdownPct}%</strong> from its peak.</p>
              <div className="flex flex-wrap gap-x-4">
                <Link href={`/token/${rug.chain}/${rug.mint}`} className={link}>Token report →</Link>
                <Link href={`/deployers/${rug.deployer}`} className={link}>Deployer →</Link>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-fg">Did the caller buy before posting?</h3>
              <p className="mt-1 text-sm text-fg3">@{caller.handle} bought {caller.lead === 0 ? "at the time of the post" : `${Math.abs(caller.lead)}s ${caller.lead > 0 ? "before" : "after"} posting`} and exited at <strong className="text-warn">{caller.exitVsCall.toFixed(2)}×</strong> the price at the post on average.</p>
              <Link href={`/callers/${caller.handle}`} className={link}>Caller profile →</Link>
            </div>
          </div>
        </Panel>

        <Panel title="Feature details" flush>
          <details className="border-b border-line">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-fg hover:bg-surf2">Free scan coverage</summary>
            <div className="grid gap-4 border-t border-line px-4 py-3 md:grid-cols-3">
              {FREE_VALUE.map((g) => <div key={g.group}><h3 className="t-eyebrow">{g.group}</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-fg3">{g.items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}
            </div>
          </details>
          {PRO_VALUE.map((g) => <details key={g.group} className="border-b border-line last:border-b-0">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-fg hover:bg-surf2">Pro · {g.group}</summary>
            <ul className="list-disc space-y-1 border-t border-line py-3 pr-4 pl-8 text-sm text-fg3">{g.items.map((item) => <li key={item}>{item}{planned.has(item) && <span className="ml-1 text-fg4">(planned)</span>}</li>)}</ul>
          </details>)}
        </Panel>
      </div>
    </div>
  );
}
