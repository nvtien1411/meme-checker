"use client";

import type { ReactNode } from "react";

/* ==================================================================== *
 * PRIMITIVES v5
 *
 * Nine components, and every page composes from them. The previous build had
 * four container types and eleven one-off card variants, which is why the
 * product never looked like one system.
 *
 *   Panel    a bounded region with a header
 *   Stat     one number with its label and the comparison worth making
 *   Row      a dense data row, optionally selectable
 *   Tag      a small bordered marker with a meaning
 *   Gauge    a horizontal bar with a scale
 *   Split    label left, value right, on a hairline
 *   Meta     secondary fact with a source
 *   Locked   a VIP boundary that names what it would show
 *   Demo     a marker for anything simulated
 * ==================================================================== */

/* ------------------------------------------------------------------ *
 * Panel
 * ------------------------------------------------------------------ */

export function Panel({
  title,
  note,
  right,
  children,
  className = "",
  flush = false,
  id,
}: {
  title?: string;
  note?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding — for panels that contain full-bleed rows. */
  flush?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`panel scroll-mt-16 ${className}`}>
      {(title || right) && (
        <header className="panel-head">
          {title && <h2 className="t-section text-fg">{title}</h2>}
          {note && <span className="min-w-0 truncate t-xs text-fg4">{note}</span>}
          {right && <div className="ml-auto shrink-0 t-xs text-fg4">{right}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-3"}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Stat — a number, its label, and the comparison the reader would have to
 * make in their head otherwise.
 * ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  size = "md",
  mono = true,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "warn" | "hot" | "bad" | "quiet";
  size?: "sm" | "md" | "lg";
  mono?: boolean;
}) {
  const color =
    tone === "good"
      ? "text-good"
      : tone === "warn"
        ? "text-warn"
        : tone === "hot"
          ? "text-hot"
          : tone === "bad"
            ? "text-bad"
            : tone === "quiet"
              ? "text-fg3"
              : "text-fg";

  const sizeCls = size === "lg" ? "text-[26px]" : size === "sm" ? "text-[13px]" : "text-[18px]";

  return (
    <div className="min-w-0">
      <div className="t-eyebrow">{label}</div>
      <div
        className={`mt-1 ${mono ? "t-mono tabular-nums" : ""} ${sizeCls} leading-none tracking-[-0.02em] ${color}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 t-xs leading-snug text-fg4">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Row — the atom of every table and list.
 * ------------------------------------------------------------------ */

export function Row({
  children,
  onClick,
  active = false,
  className = "",
  cols,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  /** Tailwind grid-template-columns, e.g. "minmax(0,1fr) auto". */
  cols?: string;
}) {
  const inner = (
    <div
      className={`${cols ? "grid" : "flex"} items-center gap-x-3 px-3 py-2 ${className}`}
      style={cols ? { gridTemplateColumns: cols } : undefined}
    >
      {children}
    </div>
  );

  if (!onClick) return <div className={`drow ${className.includes("border") ? "" : "border-b border-line last:border-b-0"}`} data-active={active}>{inner}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="drow block w-full border-b border-line text-left last:border-b-0"
    >
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Tag — bordered marker. Tone carries meaning; it is never the only signal.
 * ------------------------------------------------------------------ */

const TAG: Record<string, string> = {
  neutral: "border-line2 text-fg3",
  good: "border-good/40 text-good",
  warn: "border-warn/40 text-warn",
  hot: "border-hot/40 text-hot",
  bad: "border-bad/40 text-bad",
  acid: "border-acid/40 text-acid",
  info: "border-info/40 text-info",
  solid: "border-transparent bg-acid text-bg",
  demo: "border-line2 text-fg4 bg-surf2",
};

export function Tag({
  children,
  tone = "neutral",
  title,
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TAG | string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center border px-1.5 py-[1px] font-mono text-[9px] uppercase leading-[1.5] tracking-[0.07em] ${TAG[tone] ?? TAG.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Gauge — a bar with a real scale, label inside when it fits.
 * ------------------------------------------------------------------ */

export function Gauge({
  pct,
  tone = "acid",
  height = 4,
  label,
  track,
}: {
  /** 0–100. Null renders a hollow track, never a zero-length bar. */
  pct: number | null;
  tone?: "acid" | "good" | "warn" | "hot" | "bad" | "info" | "quiet";
  height?: number;
  label?: ReactNode;
  track?: boolean;
}) {
  const fill =
    tone === "good"
      ? "bg-good"
      : tone === "warn"
        ? "bg-warn"
        : tone === "hot"
          ? "bg-hot"
          : tone === "bad"
            ? "bg-bad"
            : tone === "info"
              ? "bg-info"
              : tone === "quiet"
                ? "bg-fg4"
                : "bg-acid";

  return (
    <div className="w-full">
      <div
        className={`w-full overflow-hidden ${track === false ? "" : "bg-surf3"}`}
        style={{ height }}
      >
        {pct !== null && (
          <div
            className={`grow-x h-full ${fill}`}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        )}
      </div>
      {label && <div className="mt-1 t-xs text-fg4">{label}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Split — a label/value pair on one hairline. The workhorse of dense panels:
 * reads as a spec sheet, not as a card grid.
 * ------------------------------------------------------------------ */

export function Split({
  label,
  children,
  tone = "default",
  mono = true,
  hint,
}: {
  label: string;
  children: ReactNode;
  tone?: "default" | "good" | "warn" | "hot" | "bad" | "quiet";
  mono?: boolean;
  hint?: string;
}) {
  const color =
    tone === "good"
      ? "text-good"
      : tone === "warn"
        ? "text-warn"
        : tone === "hot"
          ? "text-hot"
          : tone === "bad"
            ? "text-bad"
            : tone === "quiet"
              ? "text-fg3"
              : "text-fg";

  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-[5px] last:border-b-0">
      <span className="shrink-0 t-xs text-fg4" title={hint}>
        {label}
      </span>
      <span className={`min-w-0 text-right t-xs ${mono ? "t-mono tabular-nums" : ""} ${color}`}>
        {children}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Locked — a VIP boundary that names what it would show. Never a blur, never
 * a padlock over nothing: the reader has to know what they are being sold.
 * ------------------------------------------------------------------ */

export function Locked({
  title,
  points,
  cta = "Unlock with VIP",
  compact = false,
}: {
  title: string;
  points: string[];
  cta?: string;
  compact?: boolean;
}) {
  return (
    <div className={`border border-line bg-surf2/60 ${compact ? "p-2.5" : "p-4"}`}>
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-acid" aria-hidden fill="none">
          <rect x="2.5" y="5.5" width="7" height="5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M4 5.5V3.9a2 2 0 0 1 4 0V5.5" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="t-strong text-fg">{title}</span>
        <Tag tone="acid" className="ml-auto">
          VIP
        </Tag>
      </div>

      <ul className={`mt-2 space-y-1 ${compact ? "" : "sm:columns-2 sm:gap-4"}`}>
        {points.map((p) => (
          <li key={p} className="flex items-start gap-1.5 break-inside-avoid">
            <span aria-hidden className="mt-[5px] h-[3px] w-[3px] shrink-0 bg-fg4" />
            <span className="t-xs leading-snug text-fg3">{p}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-2.5 inline-flex h-7 items-center gap-1.5 border border-acid/40 bg-acid/10 px-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-acid transition-colors hover:bg-acid/20"
      >
        {cta}
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Demo — anything simulated says so, once, next to the thing itself.
 * ------------------------------------------------------------------ */

export function Demo({ what = "demo data" }: { what?: string }) {
  return (
    <Tag tone="demo" title="This value is generated for the interface, not read from chain">
      {what}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * Empty — a stated absence with a reason and a next step.
 * ------------------------------------------------------------------ */

export function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="t-strong text-fg2">{title}</div>
      {detail && <p className="mx-auto mt-1.5 max-w-[46ch] t-xs leading-relaxed text-fg4">{detail}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * MiniBar — an inline distribution, used inside table cells.
 * ------------------------------------------------------------------ */

export function MiniBar({
  segments,
  height = 5,
}: {
  segments: { pct: number; cls: string; label?: string }[];
  height?: number;
}) {
  return (
    <div className="flex w-full overflow-hidden bg-surf3" style={{ height }}>
      {segments.map((s, i) => (
        <div
          key={i}
          title={s.label}
          className={s.cls}
          style={{ width: `${Math.max(0, s.pct)}%` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ScoreBadge — a compact band label, no donut.
 * ------------------------------------------------------------------ */

export const RISK_LABEL: Record<string, { word: string; cls: string }> = {
  low: { word: "Low risk", cls: "text-good" },
  moderate: { word: "Moderate", cls: "text-warn" },
  high: { word: "High risk", cls: "text-hot" },
  critical: { word: "Critical", cls: "text-bad" },
};

export function RiskDot({ risk }: { risk: string }) {
  const cls =
    risk === "low"
      ? "bg-good"
      : risk === "moderate"
        ? "bg-warn"
        : risk === "high"
          ? "bg-hot"
          : "bg-bad";
  return <span aria-hidden className={`inline-block h-[6px] w-[6px] shrink-0 ${cls}`} />;
}
