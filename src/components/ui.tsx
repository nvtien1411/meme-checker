"use client";

import type { ReactNode } from "react";

/* ==================================================================== *
 * PRIMITIVES v2
 *
 * Two container types instead of one. `.slab` is a discrete object; a
 * "section" is a region of a document, separated by a rule and an ordinal.
 *
 * The previous build had Panel and nothing else, so every region looked
 * equally important. That is the visual reason the redesign read as
 * unchanged.
 * ==================================================================== */

/* ------------------------------------------------------------------ *
 * Section — a region of the document. No border, no fill. A rule above,
 * an ordinal, a title, optional trailing context.
 * ------------------------------------------------------------------ */

export function Section({
  id,
  index,
  title,
  note,
  right,
  children,
  className = "",
  first = false,
}: {
  id?: string;
  index: string;
  title: string;
  note?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  first?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-[76px] ${first ? "" : "rule"} ${className}`}
    >
      <header className="pb-4 pt-5">
        <div className="flex items-baseline gap-3.5">
          <span className="font-mono text-[10px] tabular-nums tracking-[0.08em] text-brand-500">
            {index}
          </span>
          <h2 className="min-w-0 t-section text-lit-100">{title}</h2>
          {right && (
            <div className="ml-auto hidden shrink-0 font-mono text-[10px] tabular-nums text-mute-600 sm:block">
              {right}
            </div>
          )}
        </div>
        {note && <p className="mt-1 t-meta text-mute-600">{note}</p>}
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Slab — a discrete object with an edge. Used sparingly: a holder list,
 * a provenance table. If everything is a slab, nothing is.
 * ------------------------------------------------------------------ */

export function Slab({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`slab scroll-mt-[76px] ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Metric — a figure with its label and the comparison the reader would
 * otherwise make in their head.
 * ------------------------------------------------------------------ */

export function Metric({
  label,
  value,
  sub,
  tone = "default",
  mono = true,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "down" | "mute";
  mono?: boolean;
}) {
  const toneCls =
    tone === "up"
      ? "text-ok-400"
      : tone === "down"
        ? "text-bad-400"
        : tone === "mute"
          ? "text-mute-600"
          : "text-lit-100";

  return (
    <div className="min-w-0 px-4 py-3">
      <div className="t-label truncate">{label}</div>
      <div
        className={`mt-1.5 truncate text-[17px] leading-none tracking-[-0.02em] ${toneCls} ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 truncate t-meta text-mute-600">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tag — a bordered marker. Tones map to meaning, never to interaction.
 * ------------------------------------------------------------------ */

const TAG_TONE = {
  neutral: "border-ink-650 text-mute-400",
  outline: "border-ink-600 text-mute-300",
  ok: "border-ok-600/60 text-ok-400",
  warn: "border-warn-600/60 text-warn-400",
  risk: "border-risk-600/60 text-risk-400",
  bad: "border-bad-600/60 text-bad-400",
  brand: "border-brand-700/70 text-brand-400",
  solid: "border-transparent bg-brand-500 text-ink-950",
} as const;

export function Tag({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TAG_TONE;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center border px-1.5 py-[2px] font-mono text-[9px] uppercase leading-[1.4] tracking-[0.08em] ${TAG_TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * QualityDot — observed / derived / inferred, as a glyph plus a word.
 * Colour alone never carries this distinction.
 * ------------------------------------------------------------------ */

const QUALITY_META = {
  observed: { glyph: "●", word: "observed", cls: "text-ok-500" },
  derived: { glyph: "◐", word: "derived", cls: "text-brand-500" },
  inferred: { glyph: "○", word: "inferred", cls: "text-mute-500" },
} as const;

export function QualityDot({
  quality,
  withWord = true,
}: {
  quality: keyof typeof QUALITY_META;
  withWord?: boolean;
}) {
  const q = QUALITY_META[quality];
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className={`text-[8px] leading-none ${q.cls}`}>
        {q.glyph}
      </span>
      {withWord && (
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-mute-600">
          {q.word}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Empty — a stated absence. Never a blank area, never a zero.
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
    <div className="px-4 py-7">
      <div className="flex items-start gap-2.5">
        <span aria-hidden className="mt-[7px] h-[1px] w-4 shrink-0 bg-ink-600" />
        <div className="min-w-0">
          <p className="t-small font-medium text-mute-300">{title}</p>
          {detail && (
            <p className="mt-1 t-meta leading-relaxed text-mute-600">{detail}</p>
          )}
          {action && <div className="mt-2.5">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Note — a footnote, set off by a hairline. Used for caveats that must be
 * readable but not compete with the reading above.
 * ------------------------------------------------------------------ */

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="rule mt-3 pt-2.5 t-meta leading-relaxed text-mute-600">{children}</p>
  );
}
