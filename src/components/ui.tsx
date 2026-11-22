"use client";

import type { ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Primitives
 *
 * One border weight, one radius, no shadows. In a data surface, decoration
 * competes with numbers — so the only visual devices here are hairlines,
 * spacing and type weight.
 * ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
  id,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-[112px] border border-ink-700 bg-ink-900 ${className}`}>
      {(title || right) && (
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-ink-700 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {title && <h2 className="t-section">{title}</h2>}
            {subtitle && (
              <p className="mt-1 t-meta leading-snug text-mute-500">{subtitle}</p>
            )}
          </div>
          {right && <div className="shrink-0 t-meta text-mute-500">{right}</div>}
        </header>
      )}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  mono = true,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "down" | "warn";
  mono?: boolean;
}) {
  const toneCls =
    tone === "up"
      ? "text-ok-500"
      : tone === "down"
        ? "text-bad-500"
        : tone === "warn"
          ? "text-warn-500"
          : "text-slate-100";
  return (
    <div className="min-w-0 px-3 py-2.5">
      <div className="truncate t-label font-medium  text-mute-500">
        {label}
      </div>
      <div
        className={`mt-1 truncate t-num font-medium leading-none ${mono ? "tnum font-mono" : ""} ${toneCls}`}
        title={value}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate t-meta text-mute-500">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad" | "brand" | "mute";
  className?: string;
}) {
  const map = {
    neutral: "border-ink-600 text-mute-300",
    ok: "border-ok-600/50 bg-ok-600/10 text-ok-500",
    warn: "border-warn-600/50 bg-warn-600/10 text-warn-500",
    bad: "border-bad-600/50 bg-bad-600/10 text-bad-500",
    brand: "border-brand-600/50 bg-brand-600/10 text-brand-400",
    mute: "border-ink-700 text-mute-500",
  } as const;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 t-meta font-medium leading-none ${map[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export { CopyButton as Copyable } from "./feedback";

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-ink-700 px-4 py-5">
      <p className="t-body font-medium text-mute-300">{title}</p>
      {body && <p className="mt-1 t-small leading-relaxed text-mute-500">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-sm ${className}`} />;
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-56 -translate-x-1/2 rounded border border-ink-600 bg-ink-850 px-2 py-1.5 t-meta leading-snug text-mute-300 opacity-0 shadow-lg transition group-hover/tt:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

export function QualityTag({ quality }: { quality: "observed" | "derived" | "inferred" }) {
  const map = {
    observed: { text: "observed", cls: "text-mute-400" },
    derived: { text: "derived", cls: "text-brand-400/80" },
    inferred: { text: "inferred", cls: "text-warn-500/80" },
  } as const;
  const m = map[quality];
  return (
    <span className={`font-mono t-label ${m.cls}`} title={
      quality === "observed"
        ? "Read directly from a source"
        : quality === "derived"
          ? "Computed by us from observed values"
          : "Produced by a model from text — not a measurement"
    }>
      {m.text}
    </span>
  );
}
