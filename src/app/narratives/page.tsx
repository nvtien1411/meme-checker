import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, Split, Tag, UpgradeStrip } from "@/components/ui";
import { DEMO_NARRATIVES, DEMO_TOKENS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * NARRATIVES
 *
 * The question is never "what is the story". It is "how many times has this
 * story already been tried, and how did the last ones end" — which is a
 * countable answer, so this page counts.
 * ==================================================================== */

export const metadata = { title: "Narratives" };

export default function NarrativesPage() {
  return (
    <div>
      <PageHead
        title="Narratives"
        note="every idea currently running, and what the last attempt did"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{DEMO_NARRATIVES.length} tracked</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <UpgradeStrip what="Copy index, prior instances and usual lifespan are Pro — free gives the category and the pitch" />

        <Panel title="How to read a narrative" note="three numbers decide it">
          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-3">
            {[
              ["copies", "How many tokens already ran this idea in seven days. Copy #1 is the original; copy #12 is a photocopy of a photocopy"],
              ["organic", "Share of mentions that carry no contract address. People talking about the idea rather than the chart — the only version that survives a price drop"],
              ["lifespan", "The median time prior tokens in this narrative held their peak before losing 90%. This is what the idea usually does, not a forecast"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2 last:border-b-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 sm:last:border-r-0">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-acid">{k}</div>
                <p className="mt-1 t-xs leading-relaxed text-fg3">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        {DEMO_NARRATIVES.map((n) => (
          <Panel key={n.name} flush>
            <div className="flex flex-wrap items-baseline gap-x-2.5 border-b border-line px-3 py-2">
              <h2 className="t-section text-fg">{n.name}</h2>
              <Tag
                tone={
                  n.trend === "rising" ? "good" : n.trend === "peaking" ? "warn" : n.trend === "cooling" ? "bad" : "neutral"
                }
              >
                {n.trend}
              </Tag>
              <span className="t-mono text-[10px] text-fg4">{n.tokens} tokens</span>
              <div className="ml-auto flex items-center gap-3">
                <span className="t-mono text-[10.5px] text-fg3">{n.mindshare7d}% mindshare</span>
                <span className="t-mono text-[10.5px] text-fg4">usual life {n.survivalHours}h</span>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:divide-x lg:divide-y-0">
              <div className="p-3">
                <div className="flex items-baseline justify-between">
                  <span className="t-eyebrow">mindshare, 7d</span>
                  <span className="t-mono text-[10px] text-fg4">{n.mindshare7d}%</span>
                </div>
                <div className="mt-1.5">
                  <Gauge
                    pct={n.mindshare7d * 3}
                    tone={n.trend === "rising" ? "good" : n.trend === "cooling" ? "bad" : "acid"}
                    height={5}
                  />
                </div>

                <div className="mt-3">
                  <span className="t-eyebrow">survival, prior tokens</span>
                  <div className="mt-1.5 space-y-0.5">
                    {n.instances.map((i) => (
                      <div key={i.symbol} className="flex items-baseline gap-2 border-b border-line py-1 last:border-b-0">
                        <span className="t-xs font-semibold text-fg2">{i.symbol}</span>
                        <span className="t-xs text-fg4">peak {fmtUsd(i.peakMc)}</span>
                        <span className="t-xs text-fg4">after {i.hoursToPeak}h</span>
                        <span className="ml-auto t-mono text-[10px] text-bad">
                          {i.hoursToMinus90 !== null ? `−90% in ${i.hoursToMinus90}h` : "running"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3">
                <span className="t-eyebrow">tokens on this narrative right now</span>
                <div className="mt-1.5 space-y-0.5">
                  {DEMO_TOKENS.filter((t) => t.narrative === n.name).map((t) => (
                    <Link
                      key={t.mint}
                      href={`/token/${t.chain}/${t.mint}`}
                      className="drow flex items-baseline gap-2 px-0 py-1"
                    >
                      <span className="t-xs font-semibold text-fg">{t.symbol}</span>
                      <Tag tone={t.copyIndex > 5 ? "bad" : t.copyIndex > 2 ? "warn" : "good"}>
                        {t.copyIndex === 1 ? "original" : `copy ${t.copyIndex}`}
                      </Tag>
                      <span className="t-xs text-fg4">{fmtUsd(t.mcap)}</span>
                      <span className="ml-auto t-mono text-[10px] text-fg4">{t.ageHours}h old</span>
                    </Link>
                  ))}
                  {DEMO_TOKENS.filter((t) => t.narrative === n.name).length === 0 && (
                    <p className="t-xs text-fg4">No scanned token currently sits on this narrative</p>
                  )}
                </div>

                <div className="mt-3 border-t border-line pt-2">
                  <Split label="copy index of the newest">{n.tokens === 1 ? "original" : `#${n.tokens}`}</Split>
                  <Split
                    label="verdict on originality"
                    tone={n.tokens > 5 ? "bad" : n.tokens > 2 ? "warn" : "good"}
                  >
                    {n.tokens > 5 ? "saturated — late copy" : n.tokens > 2 ? "crowded" : "early"}
                  </Split>
                </div>
              </div>
            </div>
          </Panel>
        ))}

        <Panel title="What this does not tell you" note="read before acting on a narrative call">
          <p className="t-xs leading-relaxed text-fg3">
            A narrative can be early and still fail, and a twelfth copy can still run if the crowd
            has not noticed the first eleven yet. Copy index and lifespan describe what happened
            before — they do not predict what happens next, and the tokens listed are only the ones
            this scanner has seen
          </p>
        </Panel>
      </div>
    </div>
  );
}
