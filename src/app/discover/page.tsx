import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, RiskDot, Tag } from "@/components/ui";
import { Gauge } from "@/components/ui";
import { DEMO_RUGS, DEMO_TOKENS } from "@/lib/demo";
import { fmtAge, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * DISCOVER — the token table
 *
 * A table, not a card grid. The user is comparing rows: 6 columns, right-
 * aligned numbers, tabular mono. Cards would force them to read one at a time,
 * which is the opposite of what this page is for.
 * ==================================================================== */

export const metadata = { title: "Discover" };

export default function DiscoverPage() {
  return <DiscoverInner />;
}

function DiscoverInner() {
  const rows = [...DEMO_TOKENS];

  return (
    <div>
      <PageHead
        title="Discover"
        note="everything the scanner has seen, sorted by what is moving"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{rows.length} tracked</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* filters, as a single row of chips rather than a form */}
        <div className="panel flex flex-wrap items-center gap-1.5 px-2.5 py-2">
          <span className="t-eyebrow mr-1">chain</span>
          {["all", "solana", "bsc", "ethereum", "base"].map((c) => (
            <button
              key={c}
              type="button"
              className={`border px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.05em] transition-colors ${
                c === "all"
                  ? "border-acid/40 bg-acid/10 text-acid"
                  : "border-line text-fg4 hover:border-line2 hover:text-fg2"
              }`}
            >
              {c}
            </button>
          ))}
          <span aria-hidden className="mx-1 h-3 w-px bg-line" />
          <span className="t-eyebrow mr-1">min liq</span>
          {["any", "$10k", "$100k", "$1m"].map((v, i) => (
            <button
              key={v}
              type="button"
              className={`border px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.05em] transition-colors ${
                i === 0
                  ? "border-acid/40 bg-acid/10 text-acid"
                  : "border-line text-fg4 hover:border-line2 hover:text-fg2"
              }`}
            >
              {v}
            </button>
          ))}
          <span className="t-xs text-fg4">· filters illustrative</span>
        </div>

        <Panel flush>
          {/* header */}
          <div className="grid grid-cols-[minmax(0,1fr)_60px_56px_54px_48px_40px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5">
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right">mcap</span>
            <span className="t-eyebrow text-right">liq</span>
            <span className="t-eyebrow text-right">vol/liq</span>
            <span className="t-eyebrow text-right">age</span>
            <span className="t-eyebrow text-right">risk</span>
          </div>

          {rows.map((t) => {
            const vp = t.vol24 / t.liq;
            return (
              <Link
                key={t.mint}
                href={`/token/${t.chain}/${t.mint}`}
                className="drow grid grid-cols-[minmax(0,1fr)_60px_56px_54px_48px_40px] items-center gap-x-2.5 border-b border-line px-3 py-[9px] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate t-xs font-semibold text-fg">{t.symbol}</span>
                    <span className="shrink-0 t-xs text-fg4">{t.chain}</span>
                  </div>
                  <div className="mt-[3px] flex items-center gap-1.5">
                    <span className="truncate t-xs text-fg3">{t.name}</span>
                    {t.bundlePct > 15 && <Tag tone="bad">bundle</Tag>}
                    {t.copyIndex > 5 && <Tag tone="warn">copy {t.copyIndex}</Tag>}
                  </div>
                </div>
                <span className="text-right t-mono text-[11px] text-fg2">{fmtUsd(t.mcap)}</span>
                <span className="text-right t-mono text-[10.5px] text-fg4">{fmtUsd(t.liq)}</span>
                <span
                  className={`text-right t-mono text-[10.5px] ${
                    vp > 8 ? "text-hot" : vp > 3 ? "text-warn" : "text-fg3"
                  }`}
                >
                  {vp.toFixed(1)}×
                </span>
                <span className="text-right t-mono text-[10px] text-fg4">{fmtAge(t.ageHours)}</span>
                <span className="flex items-center justify-end gap-1">
                  <span className="t-mono text-[10px] tabular-nums text-fg3">{t.score}</span>
                  <RiskDot risk={t.risk} />
                </span>
              </Link>
            );
          })}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Narrative heat" note="where attention is concentrating right now">
            {[
              { name: "Political animal", mindshare: 22.4, trend: "rising", tokens: 2 },
              { name: "Animal hat series", mindshare: 14.8, trend: "peaking", tokens: 11 },
              { name: "OG dog coin", mindshare: 9.1, trend: "stable", tokens: 1 },
              { name: "Rodent mascot revival", mindshare: 6.2, trend: "cooling", tokens: 4 },
            ].map((n) => (
              <div key={n.name} className="border-b border-line py-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="t-xs text-fg2">{n.name}</span>
                  <Tag
                    tone={n.trend === "rising" ? "good" : n.trend === "peaking" ? "warn" : n.trend === "cooling" ? "bad" : "neutral"}
                  >
                    {n.trend}
                  </Tag>
                  <span className="ml-auto t-mono text-[10.5px] text-fg3">{n.mindshare}%</span>
                </div>
                <div className="mt-1">
                  <Gauge pct={n.mindshare * 3} tone={n.trend === "rising" ? "good" : n.trend === "cooling" ? "bad" : "acid"} height={3} />
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Risk events" note="the last four things that broke" flush>
            {DEMO_RUGS.slice(0, 4).map((r) => (
              <div key={r.mint} className="flex items-baseline gap-2 border-b border-line px-0 py-1.5 last:border-b-0">
                <span className="t-xs font-semibold text-fg">{r.symbol}</span>
                <Tag tone={r.flag === "confirmed" ? "bad" : "warn"}>{r.flag}</Tag>
                <span className="t-mono text-[10px] text-fg4">{r.at}</span>
                <span className="ml-auto t-mono text-[10.5px] text-bad">−{r.drawdownPct.toFixed(1)}%</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
