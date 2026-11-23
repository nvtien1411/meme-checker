"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Panel, Tag } from "./ui";
import { useViewer } from "@/lib/viewer";

/* ==================================================================== *
 * PRO LAYER — the same component the product used before, inverted.
 *
 * The previous version hid the paid content completely and described it in
 * bullets. That made Pro invisible: a reader had to imagine what the rows
 * looked like, and the only way to find out was to click a button in the corner
 * of the screen. Nothing about the product communicated that a deeper layer
 * existed.
 *
 * The layer now renders the real thing. A free reader sees the actual wallet
 * table, the actual PnL, the actual network — clipped a few rows in, with the
 * boundary drawn where the data stops. The paid reader sees all of it. Same
 * markup, one boolean.
 *
 * Design rules, so this does not turn into an advert:
 *
 *   - No overlay, no blur, no dimmed rows. Blur is what a product uses when it
 *     has nothing to show; we have rows.
 *   - The visible rows are at full fidelity, because the point is to prove the
 *     data is real, not to tease it.
 *   - One boundary per section, not one per row. A page with nine upgrade
 *     strips is an advertising page.
 *   - The value sentence is computed by the caller and passed in, so it can
 *     name the actual finding ("these 9 wallets have 8 prior collapses between
 *     them") rather than the category ("wallet history").
 * ==================================================================== */

/** Marks the start of a paid section. Always visible; the content under it is
 *  what changes between tiers. */
export function ProSection({
  title,
  value,
  note,
  children,
}: {
  title: string;
  /** One measured sentence about this specific section. Never a category. */
  value?: string;
  note?: string;
  children: ReactNode;
}) {
  const { pro } = useViewer();

  return (
    <section className="border border-line">
      <header
        className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b px-3 py-2 ${
          pro ? "border-line bg-surf2/40" : "border-acid/25 bg-acid/[0.045]"
        }`}
      >
        <span
          aria-hidden
          className={`h-[5px] w-[5px] shrink-0 self-center ${pro ? "bg-acid" : "bg-acid/70"}`}
        />
        <h3 className="t-strong text-fg">{title}</h3>
        <Tag tone="acid">pro</Tag>
        {value && <span className="min-w-0 flex-1 t-xs text-fg3">{value}</span>}
        {!pro && (
          <Link
            href="/pricing"
            className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.06em] text-acid underline decoration-acid/30 underline-offset-2 hover:decoration-acid"
          >
            unlock
          </Link>
        )}
      </header>
      {children}
      {note && (
        <p className="border-t border-line px-3 py-1.5 t-xs leading-relaxed text-fg4">{note}</p>
      )}
    </section>
  );
}

/** Clips a block of real content after `rows` visible items and draws the
 *  boundary. The content is rendered either way — this is a viewport, not a
 *  permission check. */
export function ProClip({
  rows = 3,
  label,
  more,
  children,
}: {
  /** How many rows a free reader sees. Enough to judge the data, not to finish. */
  rows?: number;
  /** What is under the cut, counted. */
  label?: string;
  /** Specific items behind it. Only rendered when the list is long enough that a
   *  clipped table would not convey the shape on its own. */
  more?: string[];
  children: ReactNode;
}) {
  const { pro, setPro } = useViewer();
  if (pro) return <>{children}</>;

  return (
    <div>
      {/* the real content, at full fidelity, cut at a fixed height */}
      <div className="relative overflow-hidden" style={{ maxHeight: `${rows * 30}px` }}>
        {children}
        {/* a fade, not a blur — it marks the edge without hiding what is above it */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg) 88%)" }}
        />
      </div>

      <div className="border-t border-acid/25 bg-acid/[0.03] px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-fg4">
            {label ?? `first ${rows} shown`}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-fg4">·</span>
          <span className="min-w-0 flex-1 t-xs text-fg3">
            the rest is the same data, all of it
          </span>
          <Button onClick={() => setPro(true)} variant="ghost" aria-label="Open the paid layer">
            open
          </Button>
        </div>
        {more && more.length > 0 && (
          <ul className="mt-1.5 grid grid-cols-1 gap-x-5 sm:grid-cols-2">
            {more.map((m) => (
              <li key={m} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid/60" />
                <span className="t-xs leading-snug text-fg4">{m}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ==================================================================== *
 * Preview primitives — small, inline, and always visible.
 *
 * These are what make the paid layer legible before a click: a number with a
 * label, a bar, a row. They live inside ProSection so the reader learns the
 * pattern once and recognises it everywhere.
 * ==================================================================== */

/** A measured figure with its label and denominator. */
export function PreviewMetric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "bad" | "warn" | "good" | "acid";
}) {
  const colour =
    tone === "bad"
      ? "text-bad"
      : tone === "warn"
        ? "text-warn"
        : tone === "good"
          ? "text-good"
          : tone === "acid"
            ? "text-acid"
            : "text-fg";
  return (
    <div className="border border-line bg-surf/50 p-2.5">
      <div className="t-eyebrow">{label}</div>
      <div className={`mt-1 font-mono text-[16px] leading-none tabular-nums ${colour}`}>{value}</div>
      {sub && <div className="mt-1 t-xs leading-snug text-fg4">{sub}</div>}
    </div>
  );
}

/** A horizontal proportion with its own scale and label. */
export function PreviewBar({
  pct,
  tone = "acid",
  label,
  value,
}: {
  pct: number;
  tone?: "acid" | "bad" | "warn" | "good";
  label?: string;
  value?: string;
}) {
  const colour =
    tone === "bad" ? "bg-bad" : tone === "warn" ? "bg-warn" : tone === "good" ? "bg-good" : "bg-acid";
  return (
    <div>
      {(label || value) && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-xs text-fg4">{label}</span>
          <span className="font-mono text-[10px] tabular-nums text-fg3">{value}</span>
        </div>
      )}
      <div className="mt-1 h-[3px] w-full bg-surf3">
        <div className={`h-full ${colour}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

/** A single dense row: label left, value right, optional tone. The same shape
 *  as everywhere else in the product, so the paid layer does not look foreign. */
export function PreviewRow({
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "bad" | "warn" | "good";
  href?: string;
}) {
  const colour =
    tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : tone === "good" ? "text-good" : "text-fg2";
  const body = (
    <>
      <span className="min-w-0 flex-1 truncate t-xs text-fg3">{label}</span>
      {sub && <span className="shrink-0 t-xs text-fg4">{sub}</span>}
      <span className={`shrink-0 font-mono text-[10px] tabular-nums ${colour}`}>{value}</span>
    </>
  );
  return href ? (
    <Link href={href} className="flex items-baseline gap-2 border-b border-line px-3 py-[6px] last:border-b-0 hover:bg-surf2/50">
      {body}
    </Link>
  ) : (
    <div className="flex items-baseline gap-2 border-b border-line px-3 py-[6px] last:border-b-0">{body}</div>
  );
}

/** Compact panel that holds preview content with the standard header. */
export function PreviewPanel({
  title,
  note,
  right,
  flush = true,
  children,
}: {
  title: string;
  note?: string;
  right?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <Panel title={title} note={note} right={right} flush={flush}>
      {children}
    </Panel>
  );
}
