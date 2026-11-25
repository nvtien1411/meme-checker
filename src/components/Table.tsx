"use client";

import type { ReactNode } from "react";

/* ==================================================================== *
 * TABLE — one implementation for every data table in the product
 *
 * Before this, each page hand-rolled its own grid: a header div with
 * `t-eyebrow` spans, then rows with a matching `grid-cols-[...]` string
 * repeated in the body. Four consequences, all visible:
 *
 *   - header and body could drift apart, and on two pages they had
 *   - column widths were duplicated literals, so a longer value wrapped one
 *     row and not the next
 *   - no shared hover, zebra, density or empty state
 *   - the rightmost column meant risk here, multiplier there, age elsewhere,
 *     all landing on the same x-position, which reads as a false alignment
 *
 * One column definition, defined once, used by the head and the rows. Widths
 * are explicit and the last column is right-aligned by default because in this
 * product the last column is almost always a number.
 * ==================================================================== */

export interface Col<T> {
  /** Header text. Kept short — these are 10px micro-caps. */
  head: string;
  /** Tailwind width class, e.g. "w-16" or "minmax(0,1fr)". */
  width: string;
  align?: "left" | "right";
  /** Full sentence for the header, shown on hover. */
  hint?: string;
  /** Sort key. When present the header becomes a real button. */
  sortKey?: string;
  render: (row: T) => ReactNode;
}

export function Table<T>({
  cols,
  rows,
  rowKey,
  href,
  empty,
  dense = false,
  zebra = false,
  max,
  sort,
  onSort,
}: {
  cols: Col<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  /** When supplied the row is an <a>; anchor semantics are preserved. */
  href?: (row: T) => string;
  empty?: string;
  dense?: boolean;
  zebra?: boolean;
  max?: number;
  /** Current sort key, when the table is sortable. */
  sort?: string;
  onSort?: (key: string) => void;
}) {
  const template = cols.map((c) => c.width).join(" ");
  const shown = max ? rows.slice(0, max) : rows;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 0 }}>
        {/* head */}
        <div
          className="grid items-center gap-x-3 border-b border-line bg-surf2/50 px-3 py-1.5"
          style={{ gridTemplateColumns: template }}
        >
          {cols.map((c) => {
            const sortable = Boolean(c.sortKey && onSort);
            const active = sortable && sort === c.sortKey;
            const label = (
              <span className="inline-flex items-center gap-1">
                {c.head}
                {/* The caret only exists once a sort is chosen. A permanent
                    double arrow on every column is noise on a table whose
                    default order is meaningful. */}
                {active && (
                  <svg viewBox="0 0 6 8" className="h-[7px] w-[5px]" fill="currentColor" aria-hidden>
                    <path d="M3 0 6 4H0z" />
                  </svg>
                )}
              </span>
            );
            return sortable ? (
              <button
                key={c.head}
                type="button"
                onClick={() => onSort?.(c.sortKey as string)}
                title={c.hint ? `${c.hint} — click to sort` : "Sort by this column"}
                aria-pressed={active}
                className={`t-eyebrow truncate text-left transition-colors hover:text-fg ${
                  c.align === "right" ? "text-right" : ""
                } ${active ? "text-acid" : ""}`}
              >
                {label}
              </button>
            ) : (
              <span
                key={c.head}
                title={c.hint}
                className={`t-eyebrow truncate ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.head}
              </span>
            );
          })}
        </div>

        {shown.length === 0 && (
          <p className="px-3 py-5 t-xs text-fg4">{empty ?? "Nothing to show"}</p>
        )}

        {shown.map((row, i) => {
          const cells = cols.map((c) => (
            <span
              key={c.head}
              className={`min-w-0 truncate ${c.align === "right" ? "text-right" : ""}`}
            >
              {c.render(row)}
            </span>
          ));

          const cls = `drow grid items-center gap-x-3 border-b border-line px-3 last:border-b-0 ${
            dense ? "py-[4px]" : "py-[7px]"
          } ${zebra && i % 2 === 1 ? "bg-surf2/25" : ""}`;
          const style = { gridTemplateColumns: template };

          return href ? (
            <a key={rowKey(row, i)} href={href(row)} className={cls} style={style}>
              {cells}
            </a>
          ) : (
            <div key={rowKey(row, i)} className={cls} style={style}>
              {cells}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================================================================== *
 * Spark — a tiny inline price line.
 *
 * Every serious terminal on the reference list puts a 24h shape next to the
 * ticker, because direction is read faster than any number. Twelve samples,
 * no axes, no tooltip, 26×14. It is a glance, not a chart.
 * ==================================================================== */

export function Spark({
  values,
  up,
  width = 26,
  height = 14,
}: {
  values: number[];
  up?: boolean;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return <span className="inline-block" style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 1) + 0.5;
      const y = height - 1 - ((v - min) / span) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const rising = up ?? values[values.length - 1] >= values[0];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className={rising ? "text-good" : "text-bad"}
    >
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

/* ==================================================================== *
 * Flag — a one-word structural warning attached to a row.
 *
 * Deliberately not a badge component with twelve variants. In this product a
 * flag means "the launch has a shape you should look at": bundle, insider,
 * sniper. Two colours, one weight, always lowercase so it cannot be mistaken
 * for a button.
 * ==================================================================== */

export function Flag({
  children,
  tone = "bad",
}: {
  children: ReactNode;
  tone?: "bad" | "hot" | "warn";
}) {
  const cls = tone === "hot" ? "text-hot" : tone === "warn" ? "text-warn" : "text-bad";
  return (
    <span className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.05em] ${cls}`}>
      {children}
    </span>
  );
}

/* ==================================================================== *
 * Delta — a signed number with its own colour and a fixed sign position.
 *
 * Alignment problem this solves: "+13.3×" and "−0.4×" have different widths,
 * so in a right-aligned column the digits do not line up and the column cannot
 * be scanned vertically. A fixed-width sign slot fixes it.
 * ==================================================================== */

export function Delta({
  value,
  kind = "x",
  invert = false,
}: {
  value: number | null;
  kind?: "x" | "pct" | "usd";
  /** For values where "up" is bad — risk, drawdown. */
  invert?: boolean;
}) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="t-mono text-[11px] text-fg4">—</span>;
  }
  const good = invert ? value < 0 : value > 0;
  const flat = value === 0;
  const cls = flat ? "text-fg3" : good ? "text-good" : "text-bad";
  const body =
    kind === "pct"
      ? `${Math.abs(value).toFixed(1)}%`
      : kind === "usd"
        ? Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 })
        : `${Math.abs(value).toFixed(2)}×`;
  return (
    <span className={`t-mono text-[11px] tabular-nums ${cls}`}>
      <span className="inline-block w-[8px] text-left opacity-70">
        {flat ? "" : value > 0 ? "+" : "−"}
      </span>
      {body}
    </span>
  );
}
