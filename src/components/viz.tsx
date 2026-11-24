"use client";

import type { Holder } from "@/lib/types";

/* ==================================================================== *
 * VIZ v5
 *
 * Every graphic here answers a question the reader already asked. Nothing is
 * drawn because the page looked empty.
 * ==================================================================== */

const LABEL_WORD: Record<string, string> = {
  pool: "pool",
  burn: "burn",
  exchange: "cex",
  contract: "contract",
  creator: "creator",
  team: "team",
};

export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

/* ------------------------------------------------------------------ *
 * Distribution bar — three bands, each labelled with the number it
 * represents. No legend lookup, no arc, no gradient.
 * ------------------------------------------------------------------ */

export function DistributionBar({
  largest,
  top10,
  linked,
}: {
  largest: number | null;
  top10: number | null;
  linked: number | null;
}) {
  if (top10 === null) {
    return <p className="t-xs text-fg4">Holder shares could not be computed for this token</p>;
  }

  const l = largest ?? 0;
  const nextNine = Math.max(0, top10 - l);
  const rest = Math.max(0, 100 - top10);

  const bands = [
    { pct: l, cls: l >= 10 ? "bg-bad" : l >= 5 ? "bg-hot" : "bg-warn", name: "largest" },
    { pct: nextNine, cls: "bg-warn/55", name: "next nine" },
    { pct: rest, cls: "bg-line2", name: "everyone else" },
  ];

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden bg-surf3">
        {bands.map((b) => (
          <div
            key={b.name}
            className={`${b.cls} grow-x`}
            style={{ width: `${b.pct}%` }}
            title={`${b.name}: ${b.pct.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="t-xs text-fg3">
          largest <span className="t-mono text-bad">{l.toFixed(1)}%</span>
        </span>
        <span className="t-xs text-fg3">
          next nine <span className="t-mono text-warn">{nextNine.toFixed(1)}%</span>
        </span>
        <span className="t-xs text-fg4">
          everyone else <span className="t-mono">{rest.toFixed(1)}%</span>
        </span>
        {linked !== null && linked > 0 && (
          <span className="t-xs text-hot">
            linked by shared funding <span className="t-mono">{linked.toFixed(1)}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HolderMap — bubble per top holder, area proportional to share.
 *
 * Packing is deterministic: a golden-angle spiral placed by descending
 * radius. Server and client render identical markup, and no two bubbles
 * overlap because each is pushed out until it clears the ones before it.
 * ------------------------------------------------------------------ */

type Bubble = { id: string; r: number; x: number; y: number };

function packBubbles(items: { id: string; r: number }[]): Bubble[] {
  const sorted = [...items].sort((a, b) => b.r - a.r);
  const out: Bubble[] = [];
  const GA = Math.PI * (3 - Math.sqrt(5));

  for (const it of sorted) {
    let placed = false;
    for (let step = 0; step < 900 && !placed; step++) {
      const t = step * 0.55;
      const rad = it.r + 0.9 * Math.sqrt(t) * 3.2;
      const ang = t * GA;
      const x = 50 + Math.cos(ang) * rad;
      const y = 50 + Math.sin(ang) * rad;
      if (x - it.r < 1 || x + it.r > 99 || y - it.r < 1 || y + it.r > 99) continue;
      const clash = out.some((o) => {
        const d = Math.hypot(o.x - x, o.y - y);
        return d < o.r + it.r + 0.5;
      });
      if (!clash) {
        out.push({ id: it.id, r: it.r, x, y });
        placed = true;
      }
    }
  }
  return out;
}

export function HolderMap({
  rows,
  selected,
  onSelect,
}: {
  rows: Holder[];
  selected: string | null;
  onSelect: (a: string | null) => void;
}) {
  const usable = rows.filter((h) => h.pct !== null && (h.pct ?? 0) > 0);
  if (usable.length === 0) {
    return (
      <div className="grid h-[168px] place-items-center">
        <p className="t-xs text-fg4">No holder shares to draw</p>
      </div>
    );
  }

  const max = Math.max(...usable.map((h) => h.pct ?? 0));
  // Area proportional, no additive floor: r ∝ √pct. A floor would make a 1.7%
  // holder look 90% the size of a 2.5% one and understate concentration, which
  // is the one thing this graphic exists to show.
  const bubbles = packBubbles(
    usable.map((h) => ({ id: h.address, r: 12.5 * Math.sqrt((h.pct ?? 0) / max) })),
  );

  const byId = new Map(usable.map((h) => [h.address, h]));

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-[168px] w-full"
      role="img"
      aria-label={`Top ${usable.length} holders drawn to scale; the largest holds ${max.toFixed(2)} percent`}
    >
      {bubbles.map((b) => {
        const h = byId.get(b.id);
        if (!h) return null;
        const pct = h.pct ?? 0;
        const isSel = selected === b.id;
        const tone =
          pct >= 10 ? "#ff4d5e" : pct >= 5 ? "#ff8a3d" : pct >= 2 ? "#f7c14a" : "#4e5761";
        return (
          <g key={b.id}>
            <circle
              cx={b.x}
              cy={b.y}
              r={b.r}
              fill={tone}
              fillOpacity={isSel ? 0.95 : 0.72}
              stroke={isSel ? "#c6ff43" : tone}
              strokeWidth={isSel ? 0.9 : 0.35}
              strokeOpacity={isSel ? 1 : 0.55}
              className="cursor-pointer"
              onClick={() => onSelect(isSel ? null : b.id)}
            >
              <title>{`#${h.rank} — ${pct.toFixed(2)}% of supply`}</title>
            </circle>
            {b.r >= 7.5 && (
              <text
                x={b.x}
                y={b.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none font-mono"
                style={{ fontSize: 6.4, fill: "#08090b", fontWeight: 600 }}
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
 * HolderDetail — the node profile for a picked wallet.
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
  return (
    <div className="border-t border-line bg-surf2 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[10px] text-fg4">#{holder.rank}</span>
            {holder.label && (
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-warn">
                {LABEL_WORD[holder.label] ?? holder.label}
              </span>
            )}
          </div>
          <a
            href={explorer(holder.address)}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block break-all font-mono text-[10px] leading-snug text-fg2 underline decoration-line2 underline-offset-2 hover:text-acid"
          >
            {holder.address}
          </a>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 px-1 text-[11px] text-fg4 hover:text-fg"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3">
        <div>
          <div className="t-eyebrow">share of supply</div>
          <div className="t-mono text-[13px] text-fg">
            {holder.pct === null ? "—" : `${holder.pct.toFixed(2)}%`}
          </div>
        </div>
        <div>
          <div className="t-eyebrow">balance</div>
          <div className="t-mono text-[13px] text-fg">
            {holder.balance === null ? "—" : compact(holder.balance)}
          </div>
        </div>
      </div>

      {holder.labelBasis && <p className="mt-1.5 t-xs leading-snug text-fg4">{holder.labelBasis}</p>}
      {!holder.label && (
        <p className="mt-1.5 t-xs leading-snug text-fg4">
          No label from the provider. Unclassified is not the same as clean
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HolderRows — the table.
 * ------------------------------------------------------------------ */

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
    <div>
      {rows.map((h) => {
        const pct = h.pct ?? 0;
        const w = Math.max(0.7, (pct / max) * 100);
        const tone = pct >= 10 ? "bg-bad" : pct >= 5 ? "bg-hot" : pct >= 2 ? "bg-warn" : "bg-line2";
        const isSel = selected === h.address;

        return (
          <div
            key={h.address}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(isSel ? null : h.address)}
            onKeyDown={(e) => {
              if (onSelect && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(isSel ? null : h.address);
              }
            }}
            data-active={isSel}
            className={`drow grid grid-cols-[18px_minmax(0,1fr)_60px_58px] items-center gap-x-2.5 border-b border-line px-3 py-[7px] last:border-b-0 ${
              onSelect ? "cursor-pointer" : ""
            }`}
          >
            <span className="t-mono text-[9.5px] text-fg4">{h.rank}</span>

            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <a
                  href={explorer(h.address)}
                  target="_blank"
                  rel="noreferrer"
                  title={h.address}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate font-mono text-[11px] text-fg2 transition-colors hover:text-acid"
                >
                  {h.address.slice(0, 6)}…{h.address.slice(-4)}
                </a>
                {h.label && (
                  <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.05em] text-fg4">
                    {LABEL_WORD[h.label] ?? h.label}
                  </span>
                )}
              </div>
              <div className="mt-[4px] h-[2px] w-full overflow-hidden bg-surf3">
                <div className={`h-full ${tone}`} style={{ width: `${w}%` }} />
              </div>
            </div>

            <span
              className={`text-right t-mono text-[11.5px] tabular-nums ${
                pct >= 10 ? "text-bad" : pct >= 5 ? "text-hot" : "text-fg2"
              }`}
            >
              {h.pct === null ? "—" : `${pct.toFixed(2)}%`}
            </span>
            <span className="text-right t-mono text-[10px] tabular-nums text-fg4">
              {h.balance === null ? "" : compact(h.balance)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ExitCurve — what you can sell before the price moves against you.
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
      <p className="t-xs leading-relaxed text-fg4">
        Pool reserves could not be read, so exit depth cannot be estimated
      </p>
    );
  }

  const rows = [
    { label: "1% slippage", value: maxSell1pct, tone: "text-good", bar: "bg-good" },
    { label: "5% slippage", value: maxSell5pct, tone: "text-warn", bar: "bg-warn" },
  ];
  const scale = Math.max(maxSell5pct, maxSell1pct ?? 0) || 1;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between">
            <span className="t-xs text-fg4">{r.label}</span>
            <span className={`t-mono text-[12px] ${r.tone}`}>
              {r.value === null ? "—" : `$${Math.round(r.value).toLocaleString("en-US")}`}
            </span>
          </div>
          <div className="mt-1 h-[3px] w-full bg-surf3">
            <div
              className={`grow-x h-full ${r.bar}`}
              style={{ width: `${((r.value ?? 0) / scale) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {liquidityUsd !== null && (
        <p className="t-xs leading-relaxed text-fg4">
          Pool holds <span className="t-mono text-fg3">${liquidityUsd.toLocaleString("en-US")}</span> in
          total. These figures are an estimate from reserves, not a quote
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FlowBar — buy vs sell volume.
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
  const total = (buyVol ?? 0) + (sellVol ?? 0);
  if (total === 0) {
    return <p className="t-xs text-fg4">No trade volume in the window</p>;
  }
  const buyPct = ((buyVol ?? 0) / total) * 100;

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden bg-surf3">
        <div className="bg-good" style={{ width: `${buyPct}%` }} />
        <div className="bg-bad" style={{ width: `${100 - buyPct}%` }} />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="t-xs text-good">
          buy <span className="t-mono">{buys ?? "—"}</span>
        </span>
        <span className="t-mono text-[11px] text-fg3">
          {imbalance === null ? "" : `${imbalance > 0 ? "+" : ""}${(imbalance * 100).toFixed(0)}%`}
        </span>
        <span className="t-xs text-bad">
          sell <span className="t-mono">{sells ?? "—"}</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FollowerEntryChart — when followers bought, relative to the post.
 *
 * The whole coordination argument is in the shape: if the tall bars sit to
 * the left of the divider, those wallets were positioned before the post.
 * ------------------------------------------------------------------ */

export function FollowerEntryChart({
  buckets,
  postIndex,
  /** "time" splits the axis into before/after a post. "bucket" prints the bucket
   *  labels themselves, for distributions that are not a timeline. */
  mode = "time",
  unit = "of follower wallets",
}: {
  buckets: { label: string; pct: number }[];
  postIndex: number;
  mode?: "time" | "bucket";
  unit?: string;
}) {
  const max = Math.max(...buckets.map((b) => b.pct), 1);

  return (
    <div>
      <div className="flex h-[64px] items-end gap-[3px]">
        {buckets.map((b, i) => {
          const h = Math.max(3, (b.pct / max) * 100);
          const before = mode === "time" && i < postIndex;
          return (
            <div
              key={b.label}
              className={`w-full ${before ? "bg-info/70" : "bg-acid/70"}`}
              style={{ height: `${h}%` }}
              title={`${b.label}: ${b.pct}% ${unit}`}
            />
          );
        })}
      </div>
      {mode === "time" ? (
        <div className="mt-1 flex items-center justify-between border-t border-line pt-1">
          <span className="t-xs text-info">before the post</span>
          <span className="t-xs text-acid">after the post</span>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between gap-1 border-t border-line pt-1">
          {buckets.map((b) => (
            <span
              key={b.label}
              className="flex-1 text-center font-mono text-[8.5px] tabular-nums text-fg4"
              title={`${b.pct}% ${unit}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Timeline — the sequence, as timestamped events.
 * ------------------------------------------------------------------ */

export function Timeline({
  events,
}: {
  events: { t: number; kind: string; text: string; wallets?: string[] }[];
}) {
  return (
    <ol>
      {events.map((e, i) => {
        const tone =
          e.kind === "post"
            ? "bg-acid"
            : e.kind === "distribute"
              ? "bg-bad"
              : e.kind === "surge"
                ? "bg-hot"
                : e.kind === "accumulate"
                  ? "bg-info"
                  : "bg-line2";
        return (
          <li key={`${e.t}-${i}`} className="relative flex gap-2.5 pb-2.5 last:pb-0">
            <div className="relative flex w-3 shrink-0 justify-center">
              <span className={`mt-[5px] h-[5px] w-[5px] shrink-0 ${tone}`} aria-hidden />
              {i < events.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-[13px] h-full w-px -translate-x-1/2 bg-line"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 t-mono text-[9.5px] tabular-nums text-fg4">
                  {e.t === 0 ? "T+0" : e.t > 0 ? `T+${e.t}m` : `T−${Math.abs(e.t)}m`}
                </span>
                {e.kind === "post" && (
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.07em] text-acid">post</span>
                )}
              </div>
              <p className="mt-0.5 t-xs leading-snug text-fg3">{e.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ *
 * Sparkline — a small trend, no axes.
 * ------------------------------------------------------------------ */

export function Sparkline({
  values,
  tone = "acid",
}: {
  values: number[];
  tone?: "acid" | "bad" | "good";
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / range) * 92 - 4}`)
    .join(" ");
  const color = tone === "bad" ? "#ff4d5e" : tone === "good" ? "#34e0a1" : "#c6ff43";

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * TabBar — underline on the panel baseline.
 * ------------------------------------------------------------------ */

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; hint?: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className="no-bar flex gap-4 overflow-x-auto border-b border-line px-3"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          id={`tab-${t.id}`}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          title={t.hint}
          className="relative shrink-0 whitespace-nowrap py-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg4 transition-colors hover:text-fg2 aria-[selected=true]:text-fg"
        >
          {t.label}
          {active === t.id && (
            <span
              aria-hidden
              className="mc-edge-grow absolute inset-x-0 -bottom-px h-[2px] bg-acid"
              style={{ transformOrigin: "left center" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
