"use client";

import type { Check, Holder } from "@/lib/types";
import { countStates, sortBySeverity, STATE_META } from "@/lib/check-order";

export { sortBySeverity, countStates };

/* ==================================================================== *
 * VISUALISATION v2
 *
 * Each graphic here answers a question the numbers alone cannot. The
 * previous set was small and marginal; the risk gauge in particular read as
 * a donut chart with a number in it rather than as a measurement of danger.
 *
 * Changes of substance:
 *  - RiskArc: a 270° gauge with graduated ticks and the score at 76px. It
 *    reads as an instrument. Fills toward danger, and the word "risk" sits
 *    inside it so it cannot be read inverted.
 *  - Concentration: three labelled bands with the numbers printed on the
 *    bar itself — you no longer have to look at a legend and map colours.
 *  - ExitLadder: a price-impact curve with marked positions, not a bar.
 * ==================================================================== */

/* ------------------------------------------------------------------ *
 * RiskArc
 *
 * A 270° instrument, not a donut. 12 ticks mark the scale; the arc strokes
 * from the 7-o'clock position clockwise toward the 5-o'clock position, so
 * more arc means more risk. Sized to dominate the masthead.
 * ------------------------------------------------------------------ */

const BAND_COLOR: Record<string, string> = {
  avoid: "#ff2d55",
  risky: "#ff6a1f",
  watch: "#ffb020",
  clean: "#1fd1a0",
};

export function RiskArc({
  score,
  band,
  size = 188,
  neutralNumber = false,
}: {
  score: number;
  band: keyof typeof BAND_COLOR;
  size?: number;
  /** Render the figure in plain text colour, letting the arc carry the state. */
  neutralNumber?: boolean;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;

  // 270° sweep starting at 135° (lower-left) going clockwise
  const START = 135;
  const SWEEP = 270;
  const arcLen = (SWEEP / 360) * 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * arcLen;

  function pt(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }

  const [sx, sy] = pt(START, r);
  const [ex, ey] = pt(START + SWEEP, r);
  const color = BAND_COLOR[band];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {/* graduations */}
        {Array.from({ length: 13 }).map((_, i) => {
          const deg = START + (SWEEP / 12) * i;
          const major = i % 3 === 0;
          const [x1, y1] = pt(deg, r + (major ? 9 : 12));
          const [x2, y2] = pt(deg, r + 15);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={deg <= START + (filled / arcLen) * SWEEP ? color : "#2e2e38"}
              strokeWidth={major ? 1.5 : 1}
            />
          );
        })}

        {/* track */}
        <path
          d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`}
          fill="none"
          stroke="#1c1c23"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* value */}
        <path
          d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLen}`}
          className="arc-draw"
          style={{ ["--arc-len" as string]: `${arcLen}` }}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`t-verdict ${neutralNumber ? "text-lit-50" : ""}`}
          style={neutralNumber ? undefined : { color }}
        >
          {Math.round(score)}
        </span>
        <span className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.18em] text-mute-600">
          risk / 100
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * CheckRibbon
 *
 * Eight segments, one per check, in the order shown below. Reading left to
 * right tells you how many things went wrong before you parse a single
 * word.
 * ------------------------------------------------------------------ */

export function CheckRibbon({
  checks,
  showLegend = true,
}: {
  checks: Check[];
  showLegend?: boolean;
}) {
  const ordered = sortBySeverity(checks);
  const c = countStates(checks);

  return (
    <div>
      <div className="flex gap-[3px]" role="img" aria-label={`${c.fail} failed, ${c.warn} to watch, ${c.unknown} unknown, ${c.pass} passed`}>
        {ordered.map((x, i) => (
          <span
            key={x.id}
            title={`${x.label} — ${x.reading}`}
            className="bar-grow h-[6px] flex-1"
            style={{
              backgroundColor: STATE_META[x.state].color,
              opacity: x.state === "unknown" ? 0.55 : 1,
              animationDelay: `${i * 45}ms`,
            }}
          />
        ))}
      </div>
      <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.09em] ${showLegend ? "" : "hidden"}`}>
        {c.fail > 0 && <span className="text-bad-400">{c.fail} failed</span>}
        {c.warn > 0 && <span className="text-warn-400">{c.warn} to watch</span>}
        {c.unknown > 0 && <span className="text-mute-500">{c.unknown} unknown</span>}
        {c.pass > 0 && <span className="text-ok-400">{c.pass} passed</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ConcentrationBar
 *
 * Three bands, labelled on the bar. The largest-wallet share is printed at
 * the band it describes, so no legend lookup is required.
 * ------------------------------------------------------------------ */

export function ConcentrationBar({
  top10,
  largest,
  linkedPct,
}: {
  top10: number | null;
  largest: number | null;
  linkedPct?: number | null;
}) {
  if (top10 === null || largest === null) {
    return (
      <p className="t-small text-mute-600">
        Concentration unavailable — no holder list was returned for this chain
      </p>
    );
  }

  const largestR = Math.round(largest * 10) / 10;
  const top10R = Math.round(top10 * 10) / 10;
  const restOfTen = Math.max(0, Math.round((top10R - largestR) * 10) / 10);
  const rest = Math.max(0, Math.round((100 - top10R) * 10) / 10);

  const tone = largestR >= 10 ? "#ff2d55" : largestR >= 5 ? "#ffb020" : "#52525f";

  return (
    <div>
      <div className="flex h-[34px] w-full overflow-hidden rounded-[1px]">
        <div
          className="relative flex items-center overflow-hidden pl-2"
          style={{ width: `${largestR}%`, backgroundColor: tone, minWidth: largestR > 0 ? 26 : 0 }}
          title={`largest single wallet ${largestR}%`}
        >
        </div>
        <div
          className="relative flex items-center justify-center overflow-hidden bg-warn-500/35"
          style={{ width: `${restOfTen}%` }}
          title={`other nine of the top 10 ${restOfTen}%`}
        >
        </div>
        <div
          className="relative flex items-center justify-end overflow-hidden bg-ink-650 pr-2"
          style={{ width: `${rest}%` }}
          title={`everyone else ${rest}%`}
        >
          <span className="truncate font-mono text-[10px] tabular-nums text-mute-500">
            {rest}% everyone else
          </span>
        </div>
      </div>

      <dl className="mt-2.5 grid grid-cols-3 gap-3">
        <div>
          <dt className="flex items-center gap-1.5 t-meta text-mute-600">
            <span aria-hidden className="h-[3px] w-3 rounded-[1px]" style={{ backgroundColor: tone }} />
            largest wallet
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-lit-200">{largestR}%</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 t-meta text-mute-600">
            <span aria-hidden className="h-[3px] w-3 rounded-[1px] bg-warn-500/60" />
            next nine
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-lit-200">{restOfTen}%</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 t-meta text-mute-600">
            <span aria-hidden className="h-[3px] w-3 rounded-[1px] bg-ink-600" />
            everyone else
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-lit-200">{rest}%</dd>
        </div>
      </dl>

      <p className="mt-2 t-meta text-mute-500">
        top 10 combined{" "}
        <span className="font-mono tabular-nums text-lit-100">{top10R}%</span>
      </p>

      {linkedPct !== null && linkedPct !== undefined && (
        <p className="mt-2.5 t-meta text-mute-500">
          Wallets sharing a funding source hold{" "}
          <span className="font-mono tabular-nums text-lit-200">{linkedPct.toFixed(1)}%</span> between
          them
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HolderMap
 *
 * The idea worth taking from Bubblemaps: concentration is spatial, not a
 * percentage in a column. Bubbles are sized by real share of supply and
 * packed deterministically, so the shape of the distribution is legible
 * before any number is read — one enormous bubble and a scattering of specks
 * says "one wallet owns this" faster than 19.8% does.
 *
 * Deliberately not a cluster graph: shared-funding tracing is not run on this
 * build (it is Solana-only and skipped past seven days), so drawing links
 * between wallets would be inventing the single most consequential thing on
 * the page. These are holders, drawn to scale, nothing more.
 *
 * Packing is deterministic — no random, no seeded jitter — so the server and
 * client render identical markup.
 * ------------------------------------------------------------------ */

function packBubbles(
  items: { id: string; r: number }[],
  box = 100,
): { id: string; r: number; x: number; y: number }[] {
  const placed: { id: string; r: number; x: number; y: number }[] = [];
  for (const it of items) {
    let spot: { x: number; y: number } | null = null;
    for (let ring = 0; ring < 46 && !spot; ring++) {
      const dist = ring * 2.1;
      const steps = ring === 0 ? 1 : Math.max(6, ring * 8);
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * Math.PI * 2 + ring * 0.7;
        const x = box / 2 + Math.cos(a) * dist;
        const y = box / 2 + Math.sin(a) * dist;
        if (x - it.r < 1 || x + it.r > box - 1) continue;
        if (y - it.r < 1 || y + it.r > box - 1) continue;
        if (placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + it.r + 0.9)) {
          spot = { x, y };
          break;
        }
      }
    }
    if (spot) placed.push({ ...it, ...spot });
  }
  return placed;
}

export function HolderMap({
  rows,
  selected,
  onSelect,
}: {
  rows: Holder[];
  selected: string | null;
  onSelect: (address: string | null) => void;
}) {
  const usable = rows.filter((h) => (h.pct ?? 0) > 0);
  if (usable.length === 0) {
    return (
      <div className="grid h-[196px] place-items-center">
        <p className="t-small text-mute-500">No holder shares to plot</p>
      </div>
    );
  }

  const max = Math.max(...usable.map((h) => h.pct ?? 0));
  // Area proportional to share, with no additive floor: r ∝ √pct. A floor makes
  // small holders look similar to each other and quietly understates how much
  // the top wallet dominates, which is the one thing this graphic exists to show.
  const bubbles = packBubbles(
    usable.map((h) => ({
      id: h.address,
      r: 13 * Math.sqrt((h.pct ?? 0) / max),
    })),
  );

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-[196px] w-full"
      role="img"
      aria-label={`Top ${usable.length} holders drawn to scale; the largest holds ${max.toFixed(2)} percent`}
    >
      {bubbles.map((b) => {
        const h = usable.find((r) => r.address === b.id);
        if (!h) return null;
        const pct = h.pct ?? 0;
        const tone = pct >= 10 ? "#ff2d55" : pct >= 5 ? "#ffb020" : "#52525f";
        const isSel = selected === b.id;
        return (
          <g key={b.id}>
            <circle
              cx={b.x}
              cy={b.y}
              r={b.r}
              fill={tone}
              fillOpacity={isSel ? 0.42 : 0.16}
              stroke={isSel ? "#c6f24e" : tone}
              strokeWidth={isSel ? 0.9 : 0.5}
              strokeOpacity={isSel ? 1 : 0.85}
              className="cursor-pointer transition-[fill-opacity] duration-150 hover:fill-opacity-30"
              onClick={() => onSelect(isSel ? null : b.id)}
            >
              <title>{`#${h.rank} — ${pct.toFixed(2)}% of supply`}</title>
            </circle>
            {b.r >= 8 && (
              <text
                x={b.x}
                y={b.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none font-mono"
                style={{ fontSize: 6.6, fill: "#f4f4f8", fontWeight: 600 }}
              >
                {pct.toFixed(1)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * HolderDetail
 *
 * The node profile, reduced to what is actually known about a holder here:
 * share, balance, and the provider's label if it gave one. No inferred role.
 * ------------------------------------------------------------------ */

export function HolderDetail({
  holder,
  explorer,
  onClose,
}: {
  holder: Holder;
  explorer: (a: string) => string;
  onClose: () => void;
}) {
  const pct = holder.pct ?? 0;
  const tone = pct >= 10 ? "text-bad-400" : pct >= 5 ? "text-warn-400" : "text-mute-300";

  return (
    <div className="rise border-t border-ink-800 bg-ink-900 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] tabular-nums text-mute-600">
              #{holder.rank}
            </span>
            <a
              href={explorer(holder.address)}
              target="_blank"
              rel="noreferrer"
              title={holder.address}
              className="break-all font-mono text-[11px] leading-snug text-lit-100 underline decoration-ink-600 underline-offset-2 hover:text-brand-400"
            >
              {holder.address}
            </a>
          </div>
          {holder.label ? (
            <p className="mt-1 t-meta text-mute-500">
              Labelled <span className="text-mute-300">{holder.label}</span>
              {holder.labelBasis ? ` — ${holder.labelBasis}` : ""}
            </p>
          ) : (
            <p className="mt-1 t-meta text-mute-600">
              No provider label. Unclassified is not the same as suspicious
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close holder detail"
          className="shrink-0 font-mono text-[13px] leading-none text-mute-600 transition hover:text-lit-100"
        >
          ×
        </button>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-3 border-t border-ink-800 pt-2.5">
        <div>
          <dt className="t-meta text-mute-600">share of supply</dt>
          <dd className={`mt-0.5 font-mono text-[14px] tabular-nums ${tone}`}>
            {holder.pct === null ? "—" : `${pct.toFixed(2)}%`}
          </dd>
        </div>
        <div>
          <dt className="t-meta text-mute-600">balance</dt>
          <dd className="mt-0.5 font-mono text-[14px] tabular-nums text-lit-200">
            {holder.balance === null ? "—" : compact(holder.balance)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HolderRows
 *
 * Static bars scaled to the largest holder, so the shape of the
 * distribution is legible at a glance. Balance and share share a baseline.
 * ------------------------------------------------------------------ */

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const LABEL_WORD: Record<string, string> = {
  pool: "pool",
  burn: "burn",
  exchange: "cex",
  contract: "contract",
  creator: "creator",
  team: "team",
};

export function HolderRows({
  rows,
  explorer,
  selected = null,
  onSelect,
}: {
  rows: Holder[];
  explorer: (a: string) => string;
  selected?: string | null;
  onSelect?: (address: string | null) => void;
}) {
  const max = rows.reduce((m, h) => Math.max(m, h.pct ?? 0), 0) || 1;

  return (
    <ul className="divide-y divide-ink-850">
      {rows.map((h) => {
        const pct = h.pct ?? 0;
        const w = Math.max(0.6, (pct / max) * 100);
        const tone = pct >= 10 ? "#ff2d55" : pct >= 5 ? "#ffb020" : "#52525f";
        const isSel = selected === h.address;

        return (
          <li
            key={h.address}
            className={`row-acid grid grid-cols-[20px_minmax(0,1fr)_auto_auto] items-center gap-x-3 py-[7px] pl-4 pr-4 transition-colors ${
              isSel ? "bg-ink-850" : "hover:bg-ink-850/70"
            } ${onSelect ? "cursor-pointer" : ""}`}
            onClick={() => onSelect?.(isSel ? null : h.address)}
          >
            <span className="font-mono text-[10px] tabular-nums text-mute-600">{h.rank}</span>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <a
                  href={explorer(h.address)}
                  target="_blank"
                  rel="noreferrer"
                  title={h.address}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate font-mono text-[11.5px] text-mute-300 transition-colors hover:text-lit-100"
                >
                  {h.address.slice(0, 8)}…{h.address.slice(-6)}
                </a>
                {h.label && (
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.06em] text-mute-600">
                    {LABEL_WORD[h.label] ?? h.label}
                  </span>
                )}
              </div>
              <div className="mt-[5px] h-[2px] w-full overflow-hidden bg-ink-800">
                <div className="bar-grow h-full" style={{ width: `${w}%`, backgroundColor: tone }} />
              </div>
            </div>

            <span
              className={`text-right font-mono text-[12px] tabular-nums ${
                pct >= 10 ? "text-bad-400" : pct >= 5 ? "text-warn-400" : "text-mute-300"
              }`}
            >
              {h.pct === null ? "—" : `${pct.toFixed(2)}%`}
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-mute-600">
              {h.balance === null ? "" : compact(h.balance)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * ExitCurve
 *
 * Price impact against position size, plotted from the constant-product
 * estimate. Three marks: what you can sell before 1%, before 5%, and the
 * depth ceiling. A bar chart of the same numbers says less.
 * ------------------------------------------------------------------ */

export function ExitCurve({
  maxSell5pct,
  maxSell1pct,
  liquidityUsd,
}: {
  maxSell5pct: number | null;
  maxSell1pct: number | null;
  liquidityUsd: number | null;
}) {
  if (maxSell5pct === null) {
    return (
      <p className="t-small leading-relaxed text-mute-500">
        Pool reserves could not be read, so exit depth cannot be estimated
      </p>
    );
  }

  const ceiling = maxSell5pct;
  const fmt = (n: number) =>
    n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;

  // impact curve: x = size, y = slippage, constant product approximation
  const W = 100;
  const H = 44;
  const points: string[] = [];
  const samples = 48;
  for (let i = 0; i <= samples; i++) {
    const frac = (i / samples) * 1.6; // up to 160% of the 5% ceiling
    const x = frac / 1.6;
    // s = x / (1 - x) for a linear-invariant pool
    const slip = frac >= 0.98 ? 1 : frac / (1 - frac);
    const y = Math.min(1, slip / 0.4);
    points.push(`${(x * W).toFixed(2)},${(H - y * H).toFixed(2)}`);
  }

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[74px] w-full"
          role="img"
          aria-label={`Selling ${fmt(ceiling)} moves the price 5 percent; a position under ${fmt(maxSell1pct ?? ceiling / 5)} moves it about 1 percent.`}
        >
          <defs>
            <linearGradient id="exitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a1f" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff6a1f" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={`0,${H} ${points.join(" ")} ${W},${H}`} fill="url(#exitFill)" />
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#ff6a1f"
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />
          {/* the 5% line */}
          <line
            x1="0"
            y1={H * 0.5}
            x2={W}
            y2={H * 0.5}
            stroke="#2e2e38"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span className="absolute left-0 top-[6px] font-mono text-[9px] uppercase tracking-[0.08em] text-mute-600">
          price impact
        </span>
        <span className="absolute bottom-0 right-0 font-mono text-[9px] uppercase tracking-[0.08em] text-mute-600">
          position size →
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-800 pt-3">
        <div>
          <dt className="t-meta text-mute-600">before 1% impact</dt>
          <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-lit-100">
            {maxSell1pct === null ? "—" : fmt(maxSell1pct)}
          </dd>
        </div>
        <div>
          <dt className="t-meta text-mute-600">before 5% impact</dt>
          <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-risk-400">
            {fmt(ceiling)}
          </dd>
        </div>
      </dl>

      {liquidityUsd !== null && (
        <p className="mt-2 t-meta text-mute-600">
          Constant-product estimate on {fmt(liquidityUsd)} of pooled liquidity. Single pool,
          no routing or MEV
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FlowBar
 *
 * Buy/sell split as a single continuous bar with the two figures anchored
 * to their own side, so the comparison is positional rather than numeric.
 * ------------------------------------------------------------------ */

export function FlowBar({
  buyVol,
  sellVol,
  imbalance,
  buys,
  sells,
}: {
  buyVol: number | null;
  sellVol: number | null;
  imbalance: number | null;
  buys: number | null;
  sells: number | null;
}) {
  if (buyVol === null || sellVol === null || buyVol + sellVol === 0) {
    return (
      <div>
        <p className="t-small leading-relaxed text-mute-500">
          The trade tape did not return a volume split, so pressure cannot be measured
        </p>
        {(buys !== null || sells !== null) && (
          <p className="mt-1.5 t-meta text-mute-600">
            {buys ?? 0} buys and {sells ?? 0} sells were counted; their sizes were not reported
          </p>
        )}
      </div>
    );
  }

  const total = buyVol + sellVol;
  const buyPct = (buyVol / total) * 100;
  const tone = imbalance === null ? "#52525f" : imbalance > 0.15 ? "#1fd1a0" : imbalance < -0.2 ? "#ff2d55" : "#ffb020";

  const fmt = (n: number) =>
    n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="t-meta text-mute-600">bought</div>
          <div className="mt-0.5 font-mono text-[15px] tabular-nums text-ok-400">{fmt(buyVol)}</div>
        </div>
        <div className="text-right">
          <div className="t-meta text-mute-600">sold</div>
          <div className="mt-0.5 font-mono text-[15px] tabular-nums text-bad-400">{fmt(sellVol)}</div>
        </div>
      </div>

      <div className="mt-2.5 flex h-[6px] w-full overflow-hidden">
        <div className="bar-grow bg-ok-500/80" style={{ width: `${buyPct}%` }} />
        <div className="bar-grow flex-1 bg-bad-500/70" />
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tabular-nums text-mute-500">
          {buyPct.toFixed(1)}% / {(100 - buyPct).toFixed(1)}%
        </span>
        {imbalance !== null && (
          <span className="font-mono text-[10px] tabular-nums" style={{ color: tone }}>
            net {imbalance > 0 ? "+" : ""}
            {(imbalance * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {(buys !== null || sells !== null) && (
        <p className="mt-2 t-meta text-mute-600">
          {buys ?? 0} buys · {sells ?? 0} sells in the sampled tape
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * CoverageDial — how much of the expected evidence actually arrived.
 * ------------------------------------------------------------------ */

export function Meter({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  if (value === null) {
    return <p className="t-meta text-mute-600">{label} not measured</p>;
  }

  const pct = Math.max(0, Math.min(100, value));
  // Text tones are the lighter ramp step: the 500-level red on ink-950 falls
  // just under AA, so the 400-level carries the number.
  const tone = pct >= 80 ? "#4ee8bd" : pct >= 50 ? "#ffc857" : "#ff6383";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-meta text-mute-600">{label}</span>
        <span className="font-mono text-[12px] tabular-nums" style={{ color: tone }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1.5 flex h-[3px] w-full gap-[2px] overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="flex-1"
            style={{ backgroundColor: i < Math.round(pct / 5) ? tone : "#24242c" }}
          />
        ))}
      </div>
      {hint && <p className="mt-1.5 t-meta text-mute-600">{hint}</p>}
    </div>
  );
}
