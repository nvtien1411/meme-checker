"use client";

import type { Check, CheckState, Holder } from "@/lib/types";
import { fmtPct, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * VISUALISATION
 *
 * Every mark is drawn from values the API already returns. No invented
 * series, no smoothed trend lines, no decorative shapes. The test each
 * component had to pass: does it show something a table of the same numbers
 * cannot? If not, it is a table instead.
 * ==================================================================== */

/* ---------------------------- risk ring ---------------------------- */

const BAND_STROKE = {
  avoid: "#f43f5e",
  risky: "#f97316",
  watch: "#f59e0b",
  clean: "#10b981",
} as const;

/**
 * Score ring. 100 is worst, so the arc fills *toward* danger — the opposite of
 * a health gauge. Reading it the wrong way would invert the meaning of the
 * whole page, so the label says "risk" explicitly and the ticks mark the band
 * boundaries.
 */
export function RiskRing({
  score,
  band,
  size = 132,
}: {
  score: number;
  band: keyof typeof BAND_STROKE;
  size?: number;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2 - 6;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const filled = pct * c;
  const color = BAND_STROKE[band];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none"
          stroke="#1f2530"
          strokeWidth={stroke}
        />
        {/* band boundaries at 25 / 50 / 75 */}
        {[0.25, 0.5, 0.75].map((t) => {
          const a = t * 2 * Math.PI;
          const x1 = size / 2 + (r - stroke / 2 - 1) * Math.cos(a);
          const y1 = size / 2 + (r - stroke / 2 - 1) * Math.sin(a);
          const x2 = size / 2 + (r + stroke / 2 + 1) * Math.cos(a);
          const y2 = size / 2 + (r + stroke / 2 + 1) * Math.sin(a);
          return (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#0b0d11"
              strokeWidth={1.5}
            />
          );
        })}
        {/* value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="t-num-lg leading-none" style={{ color, fontSize: size * 0.26 }}>
            {Math.round(score)}
          </div>
          <div className="mt-0.5 t-label" style={{ fontSize: 9 }}>
            risk
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- check strip ---------------------------- */

const STATE_BG: Record<CheckState, string> = {
  fail: "bg-bad-500",
  warn: "bg-warn-500",
  pass: "bg-ok-500",
  unknown: "bg-ink-600",
};

const STATE_TEXT: Record<CheckState, string> = {
  fail: "text-bad-400",
  warn: "text-warn-400",
  pass: "text-ok-400",
  unknown: "text-mute-500",
};

const STATE_ORDER: Record<CheckState, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };

export function sortBySeverity(checks: Check[]): Check[] {
  return [...checks].sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]);
}

/**
 * Eight marks in severity order with counts spelled out underneath. The strip
 * is the fastest possible read of "how bad" — one glance, no arithmetic. The
 * counts are always visible because colour alone excludes anyone who cannot
 * distinguish rose from amber.
 */
export function CheckStrip({ checks, compact = false }: { checks: Check[]; compact?: boolean }) {
  const ordered = sortBySeverity(checks);
  const counts = {
    fail: checks.filter((c) => c.state === "fail").length,
    warn: checks.filter((c) => c.state === "warn").length,
    unknown: checks.filter((c) => c.state === "unknown").length,
    pass: checks.filter((c) => c.state === "pass").length,
  };

  return (
    <div className="min-w-0">
      <div className="flex gap-[3px]" role="img" aria-label={`${ariaFor(counts)} — status of each check, not score weight`}>
        {ordered.map((c) => (
          <span
            key={c.id}
            title={`${c.label} — ${c.reading}`}
            className={`${compact ? "h-1.5" : "h-2.5"} flex-1 rounded-[1px] ${STATE_BG[c.state]}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {(
          [
            ["fail", counts.fail, "failed"],
            ["warn", counts.warn, "watch"],
            ["unknown", counts.unknown, "unknown"],
            ["pass", counts.pass, "passed"],
          ] as const
        ).map(([state, n, word]) => (
          <span
            key={state}
            className={`inline-flex items-center gap-1.5 t-meta ${n === 0 ? "text-mute-600" : STATE_TEXT[state]}`}
          >
            <span aria-hidden className={`h-1 w-1 rounded-full ${STATE_BG[state]}`} />
            <span className="tnum">{n}</span>
            <span className={n === 0 ? "" : "text-mute-500"}>{word}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function holders_largest(segments: { pct: number }[]): number {
  return segments.reduce((m, x) => Math.max(m, x.pct), 0);
}

function ariaFor(c: { fail: number; warn: number; unknown: number; pass: number }) {
  return `${c.fail} failed, ${c.warn} to watch, ${c.unknown} unknown, ${c.pass} passed`;
}

/* --------------------- holder concentration ----------------------- */

/**
 * Stacked supply bar. Answers "how concentrated" before the row list answers
 * "which wallet". Segments below 0.4% are merged into a single tail segment,
 * otherwise twenty slivers of 0.2% render as noise.
 */
export function ConcentrationBar({
  rows,
  linkedPct,
}: {
  rows: Holder[];
  linkedPct: number | null;
}) {
  const top10 = rows.reduce((s, h) => s + (h.pct ?? 0), 0);
  const rest = Math.max(0, 100 - top10);

  const segments = rows
    .filter((h) => h.pct !== null)
    .map((h, i) => ({
      key: h.address,
      pct: h.pct as number,
      idx: i,
    }));

  const largest = holders_largest(segments);
  // Round at one decimal, then derive the remainder from the rounded values so
  // the three figures a reader adds up always equal the total shown.
  const largestR = Math.round(largest * 10) / 10;
  const top10R = Math.round(top10 * 10) / 10;
  const restOfTop10 = Math.max(0, Math.round((top10R - largestR) * 10) / 10);
  const toneLargest = largestR >= 10 ? "bg-bad-500" : largest >= 5 ? "bg-warn-500" : "bg-ink-500";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="t-meta text-mute-500">
          Top 10 combined{" "}
          <span className="font-mono tnum text-slate-100">{fmtPct(top10R)}</span>
        </div>
        <div className="t-meta text-mute-600">
          everyone else{" "}
          <span className="font-mono tnum">{fmtPct(rest)}</span>
        </div>
      </div>

      <div
        className="mt-2 flex h-2.5 w-full overflow-hidden rounded-[2px] bg-ink-800"
        role="img"
        aria-label={`Largest holder ${fmtPct(largestR)}, rest of top 10 ${fmtPct(restOfTop10)}, everyone else ${fmtPct(rest)}`}
      >
        <div
          className={`${toneLargest} shrink-0`}
          style={{ width: `${Math.min(100, largestR)}%` }}
          title={`largest single wallet ${largest.toFixed(2)}%`}
        />
        <div
          className="shrink-0 bg-warn-500/45"
          style={{ width: `${Math.min(100, restOfTop10)}%` }}
          title={`the other nine top holders combined ${restOfTop10.toFixed(2)}%`}
        />
        <div
          className="shrink-0 bg-ink-600"
          style={{ width: `${Math.min(100, rest)}%` }}
          title={`everyone else ${rest.toFixed(2)}%`}
        />
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 t-meta text-mute-600">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className={`h-1 w-1.5 rounded-[1px] ${toneLargest}`} />
          largest wallet{" "}
          <span className="font-mono tnum text-mute-400">{fmtPct(largestR)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="h-1 w-1.5 rounded-[1px] bg-warn-500/45" />
          other nine{" "}
          <span className="font-mono tnum text-mute-400">{fmtPct(restOfTop10)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="h-1 w-1.5 rounded-[1px] bg-ink-600" />
          everyone else
        </span>
        {linkedPct !== null && (
          <span className="ml-auto text-mute-400">
            linked wallets <span className="font-mono tnum">{fmtPct(linkedPct)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------ holder rows ----------------------------- */

/**
 * Holder rows as proportional bars rather than a table. On a token with one
 * dominant wallet, a table makes the reader compare nine numbers to notice
 * that; bars make it immediate. The number is still present for anyone who
 * wants it.
 */
export function HolderBars({ rows, explorer }: { rows: Holder[]; explorer: (a: string) => string }) {
  const max = Math.max(...rows.map((r) => r.pct ?? 0), 0.01);

  return (
    <ul className="divide-y divide-ink-800">
      {rows.map((h) => {
        const pct = h.pct ?? 0;
        const w = Math.max(1.5, (pct / max) * 100);
        const tone =
          pct >= 10 ? "bg-bad-500" : pct >= 5 ? "bg-warn-500" : "bg-ink-500";

        return (
          <li key={h.address} className="group/h row-hover px-4 py-2 hover:bg-ink-850/60">
            <div className="flex items-center gap-2.5">
              <span className="w-4 shrink-0 font-mono t-meta tabular-nums text-mute-600">
                {h.rank}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <a
                    href={explorer(h.address)}
                    target="_blank"
                    rel="noreferrer"
                    title={h.address}
                    className="truncate font-mono text-[11.5px] text-mute-300 underline decoration-ink-700 decoration-dotted underline-offset-[3px] transition hover:text-brand-400"
                  >
                    {h.address.slice(0, 6)}…{h.address.slice(-5)}
                  </a>

                  {h.label && (
                    <span className="shrink-0 t-meta text-mute-600" title={h.labelBasis ?? ""}>
                      {LABEL_WORD[h.label] ?? h.label}
                    </span>
                  )}
                </div>

                {/* the bar sits under the address so label and mark share a column */}
                <div className="mt-1 h-[3px] w-full overflow-hidden rounded-[1px] bg-ink-800">
                  <div className={`h-full ${tone}`} style={{ width: `${w}%` }} />
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div
                  className={`font-mono text-[12px] tabular-nums ${
                    pct >= 10 ? "text-bad-400" : pct >= 5 ? "text-warn-400" : "text-mute-300"
                  }`}
                >
                  {h.pct === null ? "—" : `${pct.toFixed(2)}%`}
                </div>
                <div className="mt-0.5 t-meta text-mute-600">
                  {h.balance === null ? "" : compactNum(h.balance)}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const LABEL_WORD: Record<string, string> = {
  "liquidity-pool": "liquidity pool",
  burn: "burn",
  "bonding-curve": "launch curve",
  "launchpad-vault": "launch vault",
  exchange: "exchange",
  contract: "contract",
  locked: "locked",
};

/* -------------------- exit depth ladder -------------------------- */

/**
 * Three slippage points on a shared scale. The reason this is not a table:
 * $67 / $352 / $735 in a row does not convey that the usable exit is two
 * orders of magnitude below what the market cap implies. A proportional bar
 * does that in one glance.
 */
export function ExitLadder({
  slip1,
  slip5,
  slip10,
}: {
  slip1: number | null;
  slip5: number | null;
  slip10: number | null;
}) {
  const rows = [
    { label: "1%", value: slip1, tone: "bg-bad-500", text: "text-bad-400", hint: "Tight exit" },
    { label: "5%", value: slip5, tone: "bg-warn-500", text: "text-warn-400", hint: "Workable exit" },
    { label: "10%", value: slip10, tone: "bg-brand-500", text: "text-brand-400", hint: "Heavy slippage" },
  ];
  const max = Math.max(slip10 ?? 0, slip5 ?? 0, slip1 ?? 0, 1);

  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const w = r.value === null ? 0 : Math.max(2, (r.value / max) * 100);
        return (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="t-meta text-mute-500">
                sell at <span className="text-mute-300">{r.label}</span> slippage
              </span>
              <span className={`font-mono text-[12px] tabular-nums ${r.text}`}>
                {r.value === null ? "—" : fmtUsd(r.value)}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-[1px] bg-ink-800">
              <div className={`h-full ${r.tone} transition-all duration-500`} style={{ width: `${w}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------- flow balance ----------------------------- */

/**
 * Buy/sell as a single 100% bar split at the true proportion. Two labels,
 * because the bar counts trades and the net figure measures volume — showing
 * "62% buys" next to "net −29% by volume" without saying which is which reads
 * as a contradiction.
 */
export function FlowBalance({
  buys,
  sells,
  imbalance,
  buyVol,
  sellVol,
}: {
  buys: number;
  sells: number;
  imbalance: number | null;
  buyVol: number | null;
  sellVol: number | null;
}) {
  const total = buys + sells;
  if (total === 0) return null;
  const buyPct = (buys / total) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between t-meta">
        <span className="font-mono tabular-nums text-ok-400">
          {buys.toLocaleString()} <span className="text-mute-600">buys</span>
        </span>
        <span className="font-mono tabular-nums text-bad-400">
          {sells.toLocaleString()} <span className="text-mute-600">sells</span>
        </span>
      </div>

      <div
        className="relative mt-1.5 flex h-2.5 w-full overflow-hidden rounded-[2px] bg-bad-600/55"
        role="img"
        aria-label={`${buyPct.toFixed(0)}% of trades are buys`}
      >
        <div className="h-full bg-ok-600/80 transition-all duration-500" style={{ width: `${buyPct}%` }} />
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-ink-950/70" />
      </div>

      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 t-meta text-mute-600">
        <span>
          {buyPct.toFixed(0)}% of trades are buys
        </span>
        {imbalance !== null && (
          <span>
            net{" "}
            <span className={`font-mono tnum ${imbalance >= 0 ? "text-ok-400" : "text-bad-400"}`}>
              {(imbalance * 100).toFixed(0)}%
            </span>{" "}
            by volume
          </span>
        )}
      </div>

      {buyVol !== null && sellVol !== null && (
        <div className="mt-1 font-mono t-meta text-mute-600">
          {fmtUsd(buyVol)} in / {fmtUsd(sellVol)} out
        </div>
      )}
    </div>
  );
}

/* --------------------- liquidity coverage ------------------------ */

/**
 * Pool depth against the valuation implied by the quoted price. Under 2% the
 * pool is a rounding error next to market cap, which means the price is a
 * claim rather than a market. That comparison is invisible in a table.
 */
export function CoverageMeter({ coverage }: { coverage: number | null }) {
  if (coverage === null) return null;

  const capped = Math.min(100, coverage);
  const tone =
    coverage < 2 ? "bg-bad-500" : coverage < 8 ? "bg-warn-500" : "bg-ok-500";
  const reading =
    coverage < 2
      ? "A rounding error next to the implied valuation. The quoted price is not a tradeable market."
      : coverage < 8
        ? "Thin against valuation. Selling will move the price more than the chart suggests."
        : "Deep enough that the quoted price is roughly tradeable at small size.";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="t-meta text-mute-500">Pool depth vs market cap</span>
        <span className="font-mono text-[12px] tabular-nums text-slate-200">
          {fmtPct(coverage)}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-[1px] bg-ink-800">
        <div className={`h-full ${tone} transition-all duration-500`} style={{ width: `${capped}%` }} />
      </div>
      <p className="mt-1.5 t-meta leading-relaxed text-mute-500">{reading}</p>
    </div>
  );
}

/* ---------------------------- helpers ---------------------------- */

function compactNum(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(1);
}

export { STATE_BG, STATE_TEXT };
