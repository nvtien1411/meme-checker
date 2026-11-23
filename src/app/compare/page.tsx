import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, RiskDot, Split, Tag } from "@/components/ui";
import { TokenOverlapPanel } from "@/components/Intelligence2";
import { DEMO_TOKENS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";
import { tokenOverlaps } from "@/lib/intel2";

/* ==================================================================== *
 * COMPARE
 *
 * Side-by-side, differences highlighted. No radar chart: five axes on a
 * pentagon says "these are similar" in a way nobody can verify, and the whole
 * job here is spotting the one column that differs.
 * ==================================================================== */

export const metadata = { title: "Compare" };

const COMPARE = [DEMO_TOKENS[0], DEMO_TOKENS[1], DEMO_TOKENS[3]];

const ROWS: { label: string; get: (t: (typeof DEMO_TOKENS)[number]) => string; better?: "low" | "high"; numeric?: (t: (typeof DEMO_TOKENS)[number]) => number }[] = [
  { label: "risk score", get: (t) => `${t.score}`, better: "low", numeric: (t) => t.score },
  { label: "market cap", get: (t) => fmtUsd(t.mcap), numeric: (t) => t.mcap },
  { label: "liquidity", get: (t) => fmtUsd(t.liq), better: "high", numeric: (t) => t.liq },
  { label: "vol / liq", get: (t) => `${(t.vol24 / t.liq).toFixed(1)}×`, better: "low", numeric: (t) => t.vol24 / t.liq },
  { label: "age", get: (t) => `${t.ageHours}h`, numeric: (t) => t.ageHours },
  { label: "holders", get: (t) => t.holders.toLocaleString("en-US"), better: "high", numeric: (t) => t.holders },
  { label: "top 10 merged", get: (t) => `${t.bundlePct.toFixed(1)}%`, better: "low", numeric: (t) => t.bundlePct },
  { label: "bundle wallets", get: (t) => `${t.bundleCount}`, better: "low", numeric: (t) => t.bundleCount },
  { label: "sniper wallets", get: (t) => `${t.sniperCount}`, better: "low", numeric: (t) => t.sniperCount },
  { label: "insider supply", get: (t) => `${t.insiderPct.toFixed(1)}%`, better: "low", numeric: (t) => t.insiderPct },
  { label: "exit window", get: (t) => `${t.exitWindowSec}s`, better: "high", numeric: (t) => t.exitWindowSec },
  { label: "sell synchrony", get: (t) => `${(t.sellSynchrony * 100).toFixed(0)}%`, better: "low", numeric: (t) => t.sellSynchrony },
  { label: "narrative copy", get: (t) => (t.copyIndex === 1 ? "original" : `#${t.copyIndex}`), better: "low", numeric: (t) => t.copyIndex },
  { label: "organic attention", get: (t) => `${t.organicScore}/100`, better: "high", numeric: (t) => t.organicScore },
];

export default function ComparePage() {
  return (
    <div>
      <PageHead
        title="Compare"
        note="three tokens, every number that differs"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{COMPARE.length} selected</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <ProReveal
          title="Whether the same wallets are buying all three"
          value={(() => {
            const o = tokenOverlaps();
            if (o.length === 0) return "None of these tokens share a holder";
            const top = o[0];
            return `${top.a} and ${top.b} share ${top.shared.length} holders${top.sharedRugRate !== null ? `, whose prior launches collapsed ${Math.round(top.sharedRugRate * 100)}% of the time` : ""}`;
          })()}
          clip={4}
          shown={0}
          rows={[]}
          more={[
            "Shared holders between every pair of compared tokens",
            "What those shared wallets did on prior launches — the pooled rug rate",
            "Whether the shared wallets entered at launch or after the crowd",
            "Which of the compared tokens the group has already exited",
          ]}
          note="Comparing tokens on price is what every screener does. Comparing who holds both is the question that changes the decision"
        >
          <TokenOverlapPanel />
        </ProReveal>

        <Panel title="Why a table and not a radar" note="the honest reason">
          <p className="t-xs leading-relaxed text-fg3">
            A radar chart normalises unrelated quantities onto one shape, which makes two different
            tokens look similar and two similar ones look different. The job here is finding the
            one row where a column differs, so the rows are numbers, the best value in each row is
            marked, and nothing is normalised
          </p>
        </Panel>

        <Panel flush>
          {/* token headers */}
          <div
            className="grid items-baseline gap-x-3 border-b border-line bg-surf2/40 px-3 py-2"
            style={{ gridTemplateColumns: `minmax(0,120px) repeat(${COMPARE.length}, minmax(0,1fr))` }}
          >
            <span className="t-eyebrow">metric</span>
            {COMPARE.map((t) => (
              <Link key={t.mint} href={`/token/${t.chain}/${t.mint}`} className="group min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <RiskDot risk={t.risk} />
                  <span className="truncate t-xs font-semibold text-fg group-hover:text-acid">{t.symbol}</span>
                </div>
                <span className="mt-0.5 block truncate t-xs text-fg4">{t.name}</span>
              </Link>
            ))}
          </div>

          {ROWS.map((row) => {
            const values = COMPARE.map((t) => row.numeric?.(t) ?? 0);
            const best =
              row.better === "low"
                ? Math.min(...values)
                : row.better === "high"
                  ? Math.max(...values)
                  : null;

            return (
              <div
                key={row.label}
                className="grid items-baseline gap-x-3 border-b border-line px-3 py-[5px] last:border-b-0"
                style={{ gridTemplateColumns: `minmax(0,120px) repeat(${COMPARE.length}, minmax(0,1fr))` }}
              >
                <span className="t-xs text-fg4">{row.label}</span>
                {COMPARE.map((t, i) => {
                  const isBest = best !== null && values[i] === best && values.filter((v) => v === best).length < values.length;
                  return (
                    <span
                      key={t.mint}
                      className={`t-mono text-[11px] tabular-nums ${isBest ? "text-good" : "text-fg2"}`}
                    >
                      {row.get(t)}
                      {isBest && <span className="ml-1 text-[8px] text-good">◆</span>}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {COMPARE.map((t) => (
            <Panel key={t.mint} title={t.symbol} note={t.narrative}>
              <div className="space-y-1">
                <Split
                  label="the case for"
                  mono={false}
                  tone="good"
                >
                  {t.bundlePct < 5
                    ? "no launch bundle"
                    : t.exitWindowSec > 180
                      ? "wide exit window"
                      : t.organicScore > 60
                        ? "organic attention"
                        : "nothing strong"}
                </Split>
                <Split label="the case against" mono={false} tone="bad">
                  {t.bundlePct > 20
                    ? `${t.bundlePct.toFixed(0)}% in launch wallets`
                    : t.exitWindowSec < 30
                      ? `${t.exitWindowSec}s exit window`
                      : t.copyIndex > 5
                        ? `copy #${t.copyIndex} of the narrative`
                        : `${t.insiderPct.toFixed(1)}% insider supply`}
                </Split>
                <Split label="unknown" mono={false} tone="warn">
                  {t.freshCount > 5 ? "who funded the fresh wallets" : "dev history depth"}
                </Split>
              </div>

              <div className="mt-2 border-t border-line pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="t-eyebrow">risk</span>
                  <span className="t-mono text-[11px] text-fg3">{t.score}/100</span>
                </div>
                <div className="mt-1">
                  <Gauge pct={t.score} tone={t.score > 70 ? "bad" : t.score > 45 ? "hot" : "warn"} height={4} />
                </div>
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="Reading the result" note="what the comparison actually says">
          <p className="t-xs leading-relaxed text-fg3">
            BONK wins on almost every row, and that is the least useful fact on the page — it is four
            years old with a real holder base. The comparison that matters is RATS against PNUT: RATS
            has a 42-second exit window and a bundle holding a fifth of supply, while PNUT has no
            bundle worth naming and a 210-second window. Everything else between them is close enough
            that the decision comes down to those two rows
          </p>
        </Panel>
      </div>
    </div>
  );
}
