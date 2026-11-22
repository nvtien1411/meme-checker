"use client";

import type { AnalysisResult, Check, CheckState } from "@/lib/types";
import { fmtPct, fmtUsd } from "@/lib/http";

/* ------------------------------------------------------------------ *
 * Data visualisation
 *
 * Everything here is drawn from values the API already returns — no new
 * fetches, no invented series. The reference set (DefiLlama, Nansen, Birdeye)
 * is dense but visual: a column of numbers is scanned, a shape is understood.
 * The report had numbers only, so a reader had to do the comparison in their
 * head. These components do that comparison for them.
 *
 * Rules kept from the design system: one accent, no gradients, hairline
 * borders, tabular figures, and every mark carries its value as text so the
 * chart is never the only way to read the data.
 * ------------------------------------------------------------------ */

/* ---------------------- holder concentration ---------------------- */

const SEGMENT_TONES = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-amber-400/80",
  "bg-sky-500",
  "bg-sky-400/75",
  "bg-ink-500",
  "bg-ink-500/80",
  "bg-ink-500/60",
  "bg-ink-500/40",
];

/**
 * Top-10 supply as one stacked bar plus a per-wallet breakdown. The bar answers
 * "how concentrated" in one glance; the rows answer "which wallet". A table
 * alone cannot show the shape of the distribution, which is the whole question.
 */
export function ConcentrationBar({ data }: { data: AnalysisResult }) {
  const { holders } = data;
  if (holders.rows.length === 0) return null;

  const top10 = holders.rows.reduce((sum, h) => sum + (h.pct ?? 0), 0);
  const rest = Math.max(0, 100 - top10);

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="flex items-baseline justify-between">
        <span className="t-meta text-mute-500">
          Top 10 combined <span className="font-mono text-slate-200">{fmtPct(top10)}</span>
        </span>
        <span className="font-mono t-meta text-mute-500">
          everyone else {fmtPct(rest)}
        </span>
      </div>

      {/* Stacked bar. Each segment is proportional to its share; the remainder
          is drawn in the neutral track so the proportion is visible without a
          legend. */}
      <div
        className="mt-1.5 flex h-2 w-full overflow-hidden rounded-[2px] bg-ink-800"
        role="img"
        aria-label={`Top 10 holders own ${fmtPct(top10)} of supply`}
      >
        {holders.rows.map((h, i) =>
          h.pct === null ? null : (
            <div
              key={h.address}
              className={`${SEGMENT_TONES[i] ?? "bg-ink-500"} shrink-0`}
              style={{ width: `${Math.min(100, h.pct)}%` }}
              title={`#${h.rank} ${h.pct.toFixed(2)}%`}
            />
          ),
        )}
      </div>

      <div className="mt-1.5 t-meta text-mute-500">
        Segments run largest to smallest; the pale tail is the long tail of small
        holders. Hover a segment for its exact share.
      </div>
    </div>
  );
}

/* ---------------------------- risk matrix ---------------------------- */

const STATE_FILL: Record<CheckState, string> = {
  fail: "bg-rose-500",
  warn: "bg-amber-500",
  pass: "bg-emerald-500",
  unknown: "bg-ink-500",
};

/**
 * Eight checks as a fixed grid of small cells, ordered by state. It is the same
 * information the list already carries, but arranged so the balance of passes
 * and failures is legible before reading a single word — which is what a
 * matrix is for. The list below stays the source of truth.
 */
export function RiskMatrix({ checks, score }: { checks: Check[]; score: number }) {
  const rank: Record<CheckState, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };
  const ordered = [...checks].sort((a, b) => rank[a.state] - rank[b.state]);
  const counts = {
    fail: checks.filter((c) => c.state === "fail").length,
    warn: checks.filter((c) => c.state === "warn").length,
    unknown: checks.filter((c) => c.state === "unknown").length,
    pass: checks.filter((c) => c.state === "pass").length,
  };

  return (
    <div className="flex items-center gap-3">
      <div>
        <div
          className="flex gap-1"
          role="img"
          aria-label={`${counts.fail} failed, ${counts.warn} to watch, ${counts.unknown} unknown, ${counts.pass} passed`}
        >
          {ordered.map((c) => (
            <span
              key={c.id}
              title={`${c.label} — ${c.reading}`}
              className={`h-5 w-2.5 rounded-[1px] ${STATE_FILL[c.state]}`}
            />
          ))}
        </div>
        {/* The key sits with the marks, not in the page nav. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 t-meta text-mute-500">
          {counts.fail > 0 && <KeyDot cls="bg-rose-500" label={`${counts.fail} fail`} />}
          {counts.warn > 0 && <KeyDot cls="bg-amber-500" label={`${counts.warn} watch`} />}
          {counts.unknown > 0 && <KeyDot cls="bg-ink-500" label={`${counts.unknown} unknown`} />}
          {counts.pass > 0 && <KeyDot cls="bg-emerald-500" label={`${counts.pass} pass`} />}
        </div>
      </div>
      <div className="shrink-0 self-start border-l border-ink-700 pl-3">
        <div className="t-label">score</div>
        <div className="font-mono t-num leading-none text-slate-100">
          {score}
          <span className="t-meta text-mute-500">/100</span>
        </div>
      </div>
    </div>
  );
}

function KeyDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${cls}`} />
      {label}
    </span>
  );
}

/* ------------------------- exit liquidity ladder ------------------------- */

/**
 * The three slippage points drawn as a depth ladder. Reading "$67 / $352 /
 * $741" in a row does not convey that the usable exit is two orders of
 * magnitude smaller than the market cap; a proportional bar does.
 */
export function LiquidityLadder({ data }: { data: AnalysisResult }) {
  const e = data.exit;
  if (!e.available || e.maxSellUsd.slip10 === null) return null;

  const points = [
    { label: "1%", value: e.maxSellUsd.slip1, tone: "bg-rose-500", text: "text-rose-400" },
    { label: "5%", value: e.maxSellUsd.slip5, tone: "bg-amber-500", text: "text-amber-400" },
    { label: "10%", value: e.maxSellUsd.slip10, tone: "bg-sky-500", text: "text-sky-400" },
  ];
  const max = e.maxSellUsd.slip10;

  return (
    <div className="space-y-2">
      {points.map((p) => {
        const w = p.value === null ? 0 : Math.max(2, (p.value / max) * 100);
        return (
          <div key={p.label}>
            <div className="flex items-baseline justify-between t-meta">
              <span className="text-mute-500">{p.label} slippage</span>
              <span className={`font-mono tabular-nums ${p.text}`}>{fmtUsd(p.value)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-[2px] bg-ink-800">
              <div className={`h-full ${p.tone}`} style={{ width: `${w}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- flow balance ----------------------------- */

/**
 * Buy/sell split as a single diverging bar with the midpoint at 50%. A positive
 * imbalance leans right, negative leans left. The percentage label carries the
 * exact value, so the bar is a faster read of a number that is already present.
 */
export function FlowBalance({ data }: { data: AnalysisResult }) {
  const f = data.flow;
  if (!f.dataAvailable || f.buys === null || f.sells === null) return null;

  const total = f.buys + f.sells;
  if (total === 0) return null;
  const buyPct = (f.buys / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between t-meta">
        <span className="font-mono text-emerald-400">{f.buys.toLocaleString()} buys</span>
        <span className="font-mono text-rose-400">{f.sells.toLocaleString()} sells</span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-[2px] bg-rose-500/70"
        role="img"
        aria-label={`${buyPct.toFixed(0)}% buys by count`}
      >
        <div className="h-full bg-emerald-500" style={{ width: `${buyPct}%` }} />
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px bg-ink-950/80"
          style={{ transform: "translateX(-0.5px)" }}
        />
      </div>
      <div className="space-y-0.5 t-meta text-mute-500">
        <div className="flex justify-between">
          <span>bar = share of trades</span>
          <span className="text-mute-400">{buyPct.toFixed(0)}% buys</span>
        </div>
        {f.imbalance !== null && (
          <div className="flex justify-between">
            <span>net = share of volume</span>
            <span className={f.imbalance >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {(f.imbalance * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- liquidity coverage --------------------------- */

/**
 * Pool depth against valuation. When the pool is a rounding error next to the
 * reported market cap, the price is a claim rather than a market — and that is
 * far easier to see as a proportion than as a percentage.
 */
export function CoverageMeter({ data }: { data: AnalysisResult }) {
  const cov = data.exit.liquidityCoverage;
  if (cov === null) return null;

  const capped = Math.min(100, cov);
  const tone = cov < 2 ? "bg-rose-500" : cov < 8 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div>
      <div className="flex items-baseline justify-between t-meta">
        <span className="text-mute-500">Pool depth vs market cap</span>
        <span className="font-mono tabular-nums text-slate-200">{fmtPct(cov)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-[2px] bg-ink-800">
        <div className={`h-full ${tone}`} style={{ width: `${capped}%` }} />
      </div>
      <p className="mt-1 t-meta leading-relaxed text-mute-500">
        {cov < 2
          ? "The pool is a rounding error next to the value implied by the price."
          : cov < 8
            ? "Thin relative to valuation — the quoted price is fragile."
            : "Deep enough that the quoted price is roughly tradeable."}
      </p>
    </div>
  );
}
