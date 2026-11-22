"use client";

import type { ReactNode } from "react";

/* ==================================================================== *
 * PRIMITIVES
 *
 * Every component exists because two or more screens needed it. Spacing comes
 * from a fixed set (4/6/8/10/12/16/20/24/32), radii from one value (4px), and
 * no component invents its own border colour.
 * ==================================================================== */

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
  id,
  flush = false,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  /** No body padding — for tables and lists that own their own rhythm. */
  flush?: boolean;
}) {
  return (
    <section id={id} className={`panel scroll-mt-[116px] ${className}`}>
      {(title || right) && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-750 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {title && <h2 className="t-label">{title}</h2>}
            {subtitle && (
              <p className="mt-1 t-meta leading-snug text-mute-500">{subtitle}</p>
            )}
          </div>
          {right && <div className="shrink-0 t-meta text-mute-400">{right}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Metric
 *
 * The most repeated element in the product. Label, value, and a support line
 * that carries the comparison the reader would otherwise make in their head.
 * Values are tabular so columns align across panels.
 * ------------------------------------------------------------------ */

export function Metric({
  label,
  value,
  sub,
  tone = "default",
  size = "md",
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "down" | "warn" | "muted";
  size?: "md" | "lg";
  hint?: string;
}) {
  const toneCls =
    tone === "up"
      ? "text-ok-400"
      : tone === "down"
        ? "text-bad-400"
        : tone === "warn"
          ? "text-warn-400"
          : tone === "muted"
            ? "text-mute-400"
            : "text-lit-100";

  return (
    <div className="min-w-0 px-4 py-3" title={hint}>
      <div className="truncate t-label">{label}</div>
      <div
        className={`mt-1.5 truncate ${size === "lg" ? "t-num-lg" : "t-num"} ${toneCls}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate t-meta text-mute-500">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tag — filled for state, outline for metadata. Never looks clickable.
 * ------------------------------------------------------------------ */

export function Tag({
  children,
  tone = "outline",
  className = "",
}: {
  children: ReactNode;
  tone?: "outline" | "ok" | "warn" | "bad" | "brand" | "solid";
  className?: string;
}) {
  const map = {
    outline: "border border-ink-650 text-mute-400",
    ok: "border border-ok-600/45 bg-ok-600/12 text-ok-400",
    warn: "border border-warn-600/45 bg-warn-600/12 text-warn-400",
    bad: "border border-bad-600/45 bg-bad-600/12 text-bad-400",
    brand: "border border-brand-600/45 bg-brand-600/12 text-brand-400",
    solid: "border border-transparent bg-ink-700 text-lit-200",
  } as const;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-[3px] px-1.5 py-[3px] text-[10.5px] font-medium leading-none ${map[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Quality marker — required by the honesty rules: a measured number, our
 * arithmetic, and a model's guess must be distinguishable at a glance.
 * ------------------------------------------------------------------ */

export function QualityDot({ quality }: { quality: "observed" | "derived" | "inferred" }) {
  const map = {
    observed: { cls: "bg-mute-500", label: "Observed", title: "Read directly from a data source" },
    derived: { cls: "bg-brand-500", label: "Derived", title: "Computed by us from observed values" },
    inferred: { cls: "bg-warn-500", label: "Inferred", title: "Produced by a model from text — not a measurement" },
  } as const;
  const m = map[quality];

  return (
    <span className="inline-flex items-center gap-1" title={m.title}>
      <span aria-hidden className={`h-1 w-1 rounded-full ${m.cls}`} />
      <span className="t-meta text-mute-600">{m.label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Empty distinct from unavailable: "we looked, nothing there" and "we could
 * not look" are different facts in a risk tool.
 * ------------------------------------------------------------------ */

export function Empty({
  title,
  body,
  kind = "empty",
  action,
}: {
  title: string;
  body?: string;
  kind?: "empty" | "unavailable" | "error";
  action?: ReactNode;
}) {
  const accent =
    kind === "error"
      ? "border-bad-600/40"
      : kind === "unavailable"
        ? "border-warn-600/35"
        : "border-ink-700";

  return (
    <div className={`rounded-[3px] border border-dashed ${accent} px-4 py-5`}>
      <p className="t-body-strong text-mute-300">{title}</p>
      {body && <p className="mt-1 t-small leading-relaxed text-mute-500">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * CSS-only tooltip. Works without JS and cannot trap focus.
 * ------------------------------------------------------------------ */

export function Tip({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: ReactNode;
  align?: "center" | "left" | "right";
}) {
  const pos =
    align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-40 mb-2 w-max max-w-[240px] rounded-[3px] border border-ink-600 bg-ink-800 px-2 py-1.5 text-[11px] leading-snug text-mute-300 opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-opacity duration-150 group-hover/tip:opacity-100 ${pos}`}
      >
        {label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */

export function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="t-label whitespace-nowrap">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-ink-750" />
    </div>
  );
}
