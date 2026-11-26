import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, ProReveal, Split, Stat, Tag } from "@/components/ui";
import { RugCaseFile } from "@/components/Intelligence4";
import { DeployerProRows } from "@/components/ProRows";
import { PeekButton } from "@/components/report";
import { DEMO_RUGS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";
import { deployerRecord } from "@/lib/intel2";
import { NextSteps } from "@/components/NextSteps";

/* ==================================================================== *
 * RUG DATABASE
 *
 * An intelligence record, not a token list. Each row is a case: what was
 * flagged, what happened, and what the signal was before it happened. The
 * distinction between confirmed, reported and suspected is load-bearing —
 * collapsing them into "rug" would make the database untrustworthy.
 * ==================================================================== */

export const metadata = { title: "Rug Archive" };

const FLAG_TONE: Record<string, string> = {
  confirmed: "bad",
  reported: "hot",
  suspected: "warn",
};

export default function RugsPage() {
  const confirmed = DEMO_RUGS.filter((r) => r.flag === "confirmed").length;
  const reported = DEMO_RUGS.filter((r) => r.flag === "reported").length;
  const suspected = DEMO_RUGS.filter((r) => r.flag === "suspected").length;
  const deployers = new Set(DEMO_RUGS.map((r) => r.deployer)).size;
  const total = DEMO_RUGS.length;

  return (
    <div>
      <PageHead
        title="Rug Archive"
        note="Rugs happen. Check the receipts before you ape."
        right={
          <>
            <Demo />
            <Tag tone="neutral">{total} entries</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: "confirmed", value: `${confirmed}`, sub: "drawdown verified", tone: "bad" },
            { label: "reported", value: `${reported}`, sub: "community, unverified", tone: "hot" },
            { label: "suspected", value: `${suspected}`, sub: "pattern only", tone: "warn" },
            { label: "deployers", value: `${deployers}`, sub: "behind these entries", tone: "default" },
          ].map((s) => (
            <div key={s.label} className="panel p-2.5">
              <Stat
                label={s.label}
                value={s.value}
                sub={s.sub}
                size="md"
                tone={s.tone === "bad" ? "bad" : s.tone === "hot" ? "hot" : s.tone === "warn" ? "warn" : "default"}
              />
            </div>
          ))}
        </div>

                {DEMO_RUGS.map((r) => (
          <article key={r.mint} className="panel">
            <div className="flex flex-wrap items-baseline gap-x-2.5 border-b border-line px-3 py-2">
              <h2 className="t-section text-fg">{r.symbol}</h2>
              <Tag tone={FLAG_TONE[r.flag] as "bad" | "hot" | "warn"}>{r.flag}</Tag>
              <span className="t-mono text-[10px] text-fg4">{r.at}</span>
              <span className="t-mono text-[10px] text-fg4">{r.chain}</span>
              <div className="ml-auto flex items-baseline gap-3">
                <span className="t-xs text-fg4">peak {fmtUsd(r.peakMc)}</span>
                <span className="t-mono text-[12px] text-bad">−{r.drawdownPct.toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
              <div className="p-3">
                <span className="t-eyebrow">signals recorded before the collapse</span>
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {r.signals.map((s) => (
                    <li key={s}>
                      <Tag tone="bad">{s}</Tag>
                    </li>
                  ))}
                </ul>

                <div className="mt-2.5 border-t border-line pt-2">
                  <span className="t-eyebrow">token</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Link
                      href={`/token/${r.chain}/${r.mint}`}
                      className="truncate font-mono text-[10.5px] text-fg2 underline decoration-line2 underline-offset-2 hover:text-acid"
                    >
                      {r.mint.slice(0, 10)}…{r.mint.slice(-6)}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <span className="t-eyebrow">deployer</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <PeekButton addr={r.deployer} />
                  {(() => {
                    const rec = deployerRecord(r.deployer);
                    const others = (rec?.launchCount ?? 1) - 1;
                    return others > 0 ? <Tag tone="warn">also on {others} others</Tag> : null;
                  })()}
                </div>

                {(() => {
                  const rec = deployerRecord(r.deployer);
                  return (
                    <div className="mt-2">
                      <Split label="tokens by this deployer">{rec?.launchCount ?? 1}</Split>
                      <Split label="of those, collapsed" tone="bad">
                        {rec?.rugCount ?? 0}
                      </Split>
                      <Split label="median drawdown" tone="warn">
                        {rec?.medianDrawdown == null ? "not measured" : `${Math.round(rec.medianDrawdown)}%`}
                      </Split>
                    </div>
                  );
                })()}

                <div className="mt-1.5">
                  {(() => {
                    const rec = deployerRecord(r.deployer);
                    const pct = rec && rec.launchCount > 0 ? Math.round((rec.rugCount / rec.launchCount) * 100) : 0;
                    return (
                      <Gauge
                        pct={pct}
                        tone="bad"
                        height={3}
                        label={
                          <span className="t-xs text-fg4">
                            {rec ? `${rec.rugCount} of ${rec.launchCount} launches ended here` : "no launches on record"}
                          </span>
                        }
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </article>
        ))}

        <ProReveal
          title="The case file for the worst one"
          shown={2}
          rows={[<DeployerProRows key="d" />]}
          more={[
            "Every wallet that bought the launch, with its entry and exit",
            "Which wallet sold first, and how long the rest waited",
            "Whether the same funder backed wallets across multiple entries here",
            "That deployer's complete record, including tokens outside this database",
            "Which wallets in this case also appear in the other confirmed rugs above",
          ]}
          note="Free lists what broke. This is who did it, in the order they did it"
        >
          <RugCaseFile />
        </ProReveal>

        <NextSteps
          title="What to do with one of these"
          steps={[
            {
              from: "A deployer appears on more than one entry",
              to: "Its full launch record",
              href: "/deployers",
              tone: "bad",
            },
            {
              from: "You want to know if wallets repeated across these",
              to: "The relationship graph",
              href: "/investigation",
            },
            {
              from: "A caller promoted one of these before it fell",
              to: "Whether that caller sold into their own audience",
              href: "/callers",
              tone: "warn",
            },
            {
              from: "The idea is still running under a new ticker",
              to: "The narrative and its copy count",
              href: "/narratives",
            },
          ]}
        />
      </div>
    </div>
  );
}
