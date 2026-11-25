"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useViewer } from "@/lib/viewer";

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
    <section
      id={id}
      className={`panel scroll-mt-16 ${flush ? "panel-tight" : ""} ${className}`}
    >
      {(title || right) && (
        <header className="panel-head">
          {title && (
            /* Uppercase micro-caps for the panel name, at the same weight as the
               column headers inside it. Panels and their own columns now read as
               one instrument instead of a heading with a table dropped into it. */
            <h2 className="t-head">{title}</h2>
          )}
          {note && (
            <span className="hidden min-w-0 truncate t-xs text-fg4 sm:inline" title={note}>
              {note}
            </span>
          )}
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
 * Gated — a real VIP boundary.
 *
 * Renders its children when the viewer has the paid layer, and a named
 * preview when they do not. The preview always states what is behind it, so
 * the boundary is evaluable: flip the switch in the rail and the same page
 * fills in. A padlock over a blur teaches nobody anything.
 * ------------------------------------------------------------------ */

export function Gated({
  title,
  points,
  children,
  compact = false,
  cta,
}: {
  title: string;
  /** What the reader gets. Written as outcomes, never as feature nouns. */
  points: string[];
  /** The paid content. Omitted only where the module has no data source yet. */
  children?: ReactNode;
  compact?: boolean;
  cta?: string;
}) {
  const { pro, setPro } = useViewer();

  if (pro && children) return <>{children}</>;

  return (
    <div className={`border border-line bg-surf2/60 ${compact ? "p-2.5" : "p-3.5"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-acid" aria-hidden fill="none">
          <rect x="2.5" y="5.5" width="7" height="5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M4 5.5V3.9a2 2 0 0 1 4 0V5.5" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="t-strong text-fg">{title}</span>
        <Tag tone="acid">VIP</Tag>
        <Button
          onClick={() => setPro(true)}
          variant="ghost"
          className="ml-auto"
          aria-label="Preview the paid layer"
        >
          {cta ?? "Preview"}
        </Button>
      </div>

      <ul className={`mt-2 space-y-1 ${compact ? "" : "sm:columns-2 sm:gap-5"}`}>
        {points.map((p) => (
          <li key={p} className="flex items-start gap-1.5 break-inside-avoid">
            <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid/70" />
            <span className="t-xs leading-snug text-fg3">{p}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 border-t border-line pt-1.5 t-xs text-fg4">
        Nothing here is invented — previewing shows the layout the engine fills when the data
        lands, and every figure is labelled while it is sample data
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ProReveal - the paid layer, visible before anyone clicks anything.
 *
 * Two earlier versions of this were both wrong in the same way.
 *
 * The first listed what Pro would show, in bullets. A reader cannot judge
 * whether a table of wallets is worth paying for if they have never seen one.
 *
 * The second rendered the real rows but hid them entirely from free readers
 * until they clicked "open" in the corner. That is worse: the product looked
 * like it had one layer, and the only way to discover the second was to go
 * looking for a button.
 *
 * This version renders the real content for everyone, clipped after a few rows,
 * with the boundary drawn where the data stops. A free reader sees actual
 * wallets, actual numbers, actual history — and can see precisely what continues
 * below. Nothing is blurred and nothing is dimmed, because the rows above the
 * cut exist to prove the data is real.
 *
 * The `value` line is the important part: it is a measured sentence about this
 * specific section, supplied by the caller. "These 9 wallets have 4 prior
 * collapses between them" sells the layer. "Wallet history" does not.
 * ------------------------------------------------------------------ */

export function ProReveal({
  title,
  value,
  rows = [],
  shown = 3,
  tail,
  more,
  note,
  children,
  clip = 3,
}: {
  title: string;
  /** One measured sentence about this section's own data. Never a category. */
  value?: string;
  /** The real rows, in their final form. Nothing here is written for the gate. */
  rows?: ReactNode[];
  /** Full paid content, when it is more than a list of rows. */
  children?: ReactNode;
  /** How many rows a free reader sees. Enough to judge the shape, not to finish. */
  shown?: number;
  /** Content that only means anything once every row is visible. */
  tail?: ReactNode;
  /** What the remaining rows contain — specific, counted, no adjectives. */
  more?: string[];
  note?: string;
  /** Height budget for clipped children, in rows. */
  clip?: number;
}) {
  const { pro, setPro } = useViewer();
  const total = rows.length;
  const hidden = Math.max(0, total - shown);
  const hasChildren = children !== undefined && children !== null;
  const rowsFirst = total > 0;
  const canClip = hasChildren || total > 0;

  // Paid: everything, no chrome.
  if (pro) {
    if (hasChildren) {
      return (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span aria-hidden className="h-[5px] w-[5px] self-center bg-acid" />
            <h3 className="t-strong text-fg">{title}</h3>
            {value && <span className="min-w-0 flex-1 t-xs text-fg3">{value}</span>}
          </div>
          {children}
        </div>
      );
    }
    return (
      <div className="space-y-2.5">
        {rows}
        {tail}
      </div>
    );
  }

  // Free: the same content, clipped, with the boundary named.
  const visible = rowsFirst ? rows.slice(0, shown) : null;

  return (
    <section className="border border-line">
      <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-acid/25 bg-acid/[0.045] px-3 py-2">
        <span aria-hidden className="h-[5px] w-[5px] shrink-0 self-center bg-acid/80" />
        <h3 className="t-strong text-fg">{title}</h3>
        <Tag tone="acid">pro</Tag>
        {value && <span className="min-w-0 flex-1 t-xs text-fg3">{value}</span>}
        <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.06em] text-acid/70">
          pro layer
        </span>
      </header>

      {canClip && (
        <>
          <div className="relative overflow-hidden" style={{ maxHeight: `${clip * 34 + 2}px` }}>
            {rowsFirst ? visible : children}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-7"
              style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg) 92%)" }}
            />
          </div>

          <div className="border-t border-acid/25 bg-acid/[0.03] px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {/* "open" said nothing about what was being bought. The label is
                  now the count of what is behind the line plus the price, so the
                  decision is priced at the point of the decision. */}
              <Button onClick={() => setPro(true)} variant="ghost" aria-label="Open the paid layer">
                {hidden > 0 ? `open ${hidden} more rows` : "open the full layer"}
              </Button>
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-fg4">
                pro · $39/mo
              </span>
              <a
                href="/pricing"
                className="ml-auto font-mono text-[9px] uppercase tracking-[0.05em] text-fg4 underline decoration-line2 underline-offset-2 hover:text-acid hover:decoration-acid"
              >
                every pro module →
              </a>
            </div>

            {/* What the verdict words mean. Without this the strongest thing on
                the page — "exit liquidity" — was an unexplained label. */}
            <p className="mt-1.5 border-t border-acid/15 pt-1.5 t-xs leading-relaxed text-fg4">
              <span className="text-bad">exit liquidity</span> their exit landed above the price
              their own post produced, and most of the position went after followers arrived ·{" "}
              <span className="text-warn">mixed</span> one of those two, not both ·{" "}
              <span className="text-good">worth following</span> neither
            </p>
            {note && (
              <p className="mt-1.5 border-t border-acid/15 pt-1.5 t-xs leading-relaxed text-fg4">
                {note}
              </p>
            )}
          </div>
        </>
      )}

      {tail}

      {more && more.length > 0 && !canClip && (
        <ul className="grid grid-cols-1 gap-x-5 border-t border-line px-3 py-2 sm:grid-cols-2">
          {more.map((m) => (
            <li key={m} className="flex items-start gap-1.5">
              <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid/60" />
              <span className="t-xs leading-snug text-fg4">{m}</span>
            </li>
          ))}
        </ul>
      )}

      {note && !canClip && (
        <p className="border-t border-line px-3 py-1.5 t-xs leading-relaxed text-fg4">{note}</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * UpgradeStrip — a one-line contextual CTA.
 *
 * Sits above content the reader is already looking at, and names the specific
 * thing they cannot see rather than saying "upgrade for more". Disappears
 * entirely once the paid layer is on, because a sales bar on a page you have
 * already paid for is noise.
 * ------------------------------------------------------------------ */

export function UpgradeStrip({ what }: { what: string }) {
  const { pro, toggle } = useViewer();
  if (pro) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border border-acid/25 bg-acid/[0.05] px-2.5 py-2">
      <svg viewBox="0 0 10 10" className="h-[9px] w-[9px] shrink-0 text-acid" aria-hidden fill="none">
        <rect x="2" y="4.5" width="6" height="4.5" stroke="currentColor" strokeWidth="1" />
        <path d="M3.2 4.5V3.2a1.8 1.8 0 0 1 3.6 0v1.3" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="min-w-0 flex-1 t-xs text-fg2">{what}</span>
      <Button onClick={toggle} variant="ghost">
        preview
      </Button>
      <Button href="/pricing">see plans</Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Button — three variants, one height. A terminal needs one button, not six.
 * ------------------------------------------------------------------ */

export function Button({
  children,
  onClick,
  variant = "solid",
  size = "sm",
  disabled,
  href,
  className = "",
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost" | "quiet" | "bad";
  size?: "sm" | "md";
  disabled?: boolean;
  href?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-mono uppercase tracking-[0.06em] transition-colors disabled:opacity-40 disabled:pointer-events-none";
  const h = size === "md" ? "h-8 px-3 text-[10.5px]" : "h-6 px-2 text-[9.5px]";
  const skin =
    variant === "solid"
      ? "bg-acid text-bg font-semibold hover:bg-acid2"
      : variant === "bad"
        ? "border border-bad/40 text-bad hover:bg-bad/10"
        : variant === "ghost"
          ? "border border-acid/40 text-acid hover:bg-acid/10"
          : "border border-line text-fg3 hover:border-line2 hover:text-fg";

  if (href) {
    return (
      <Link href={href} className={`${base} ${h} ${skin} ${className}`} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${h} ${skin} ${className}`} {...rest}>
      {children}
    </button>
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
