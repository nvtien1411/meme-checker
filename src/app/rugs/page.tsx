import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Gated, Panel, Split, Stat, Tag } from "@/components/ui";
import { DEMO_RUGS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * RUG DATABASE
 *
 * An intelligence record, not a token list. Each row is a case: what was
 * flagged, what happened, and what the signal was before it happened. The
 * distinction between confirmed, reported and suspected is load-bearing —
 * collapsing them into "rug" would make the database untrustworthy.
 * ==================================================================== */

export const metadata = { title: "Rug database" };

const FLAG_TONE: Record<string, string> = {
  confirmed: "bad",
  reported: "hot",
  suspected: "warn",
};

export default function RugsPage() {
  const confirmed = DEMO_RUGS.filter((r) => r.flag === "confirmed").length;
  const total = DEMO_RUGS.length;

  return (
    <div>
      <PageHead
        title="Rug database"
        note="collapses on record, with the signal that fired before it"
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
            { label: "reported", value: "1", sub: "community, unverified", tone: "hot" },
            { label: "suspected", value: "1", sub: "pattern only", tone: "warn" },
            { label: "deployers", value: "3", sub: "behind these entries", tone: "default" },
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

        <Panel title="Why the three labels matter" note="a database that calls everything a rug is worth nothing">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            {[
              ["confirmed", "The collapse is verifiable on chain — the pool emptied, or the price lost 90% and never returned"],
              ["reported", "A credible report exists but this scanner did not observe the collapse directly. Treated as a lead, not a fact"],
              ["suspected", "One or more signals fired and the token is dead, but no single cause is established. This is the weakest class and is labelled as such"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2 last:border-b-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 sm:last:border-r-0">
                <Tag tone={FLAG_TONE[k] ?? "neutral"}>{k}</Tag>
                <p className="mt-1 t-xs leading-relaxed text-fg3">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

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
                  <span className="font-mono text-[10.5px] text-fg2">
                    {r.deployer.slice(0, 8)}…{r.deployer.slice(-6)}
                  </span>
                  <Tag tone="warn">also on 3 others</Tag>
                </div>

                <div className="mt-2">
                  <Split label="tokens by this deployer">4</Split>
                  <Split label="of those, collapsed" tone="bad">
                    3
                  </Split>
                  <Split label="first flagged at" tone="warn">
                    peak {fmtUsd(r.peakMc * 0.7)}
                  </Split>
                </div>

                <div className="mt-1.5">
                  <Gauge pct={75} tone="bad" height={3} label={<span className="t-xs text-fg4">3 of 4 launches ended here</span>} />
                </div>
              </div>
            </div>
          </article>
        ))}

        <Gated
          title="Full forensic case file"
          points={[
            "Every wallet that bought the launch, with its entry and exit",
            "The exact block the collapse began, and who sold first",
            "Whether the same funder backed the wallets on multiple entries here",
            "Deployer's complete launch record, including tokens not in this database",
            "Pre-collapse alerts that fired, and how long before the collapse they fired",
            "Cross-reference: which wallets in this case also appear in other confirmed rugs",
          ]}
        />
      </div>
    </div>
  );
}
