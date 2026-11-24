"use client";

import Link from "next/link";
import { Tag } from "@/components/ui";

/* ==================================================================== *
 * NEXT STEP — the one line that turns a read into an action
 *
 * Brief: "every page must have ... contextual next actions". Several pages
 * ended on a table and left the reader to find their own way forward, which is
 * how a research tool becomes a pile of tables.
 *
 * Each entry names the specific thing that was just seen and the page that
 * continues it. Never "explore more" — the label is the next question.
 * ==================================================================== */

export interface NextStep {
  /** What the reader just saw, in their own terms. */
  from: string;
  /** Where it leads, as a question. */
  to: string;
  href: string;
  tone?: "default" | "acid" | "bad" | "warn";
}

export function NextSteps({ steps, title = "Where this goes next" }: { steps: NextStep[]; title?: string }) {
  if (steps.length === 0) return null;

  return (
    <section className="border border-line">
      <header className="flex items-baseline gap-2 border-b border-line bg-surf2/40 px-2.5 py-1.5">
        <span aria-hidden className="h-[4px] w-[4px] self-center bg-acid/70" />
        <h3 className="t-eyebrow text-fg3">{title}</h3>
        <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.05em] text-fg4">
          {steps.length} paths
        </span>
      </header>

      <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:[grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        {steps.map((s) => (
          <Link
            key={s.href + s.to}
            href={s.href}
            className="group flex flex-col gap-1 px-2.5 py-2 transition-colors hover:bg-surf2/40"
          >
            <span className="t-xs leading-snug text-fg4">{s.from}</span>
            <span className="flex items-baseline gap-1.5">
              <span
                className={`t-xs font-semibold leading-snug ${
                  s.tone === "bad"
                    ? "text-bad"
                    : s.tone === "warn"
                      ? "text-warn"
                      : s.tone === "acid"
                        ? "text-acid"
                        : "text-fg2"
                } group-hover:underline`}
              >
                {s.to}
              </span>
              <span aria-hidden className="text-fg4 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* A compact inline variant for pages where a full strip is too much. */
export function NextStepInline({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-baseline gap-1 font-mono text-[9.5px] uppercase tracking-[0.05em] text-acid hover:underline"
    >
      <Tag tone="acid">next</Tag>
      {label}
      <span aria-hidden>→</span>
    </Link>
  );
}
