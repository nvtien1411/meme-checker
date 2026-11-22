"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Section nav
 *
 * A report this tall has no way to jump around, and the panels are ordered by
 * severity rather than by topic, so "where is the holder list" is a scroll
 * hunt. This pins a compact index under the header and tracks which section is
 * in view. The observed list deliberately excludes the verdict block, which
 * sits above the nav and has no tab of its own — including it left nothing
 * highlighted at the top of the page.
 * ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "checks", label: "Checks" },
  { id: "holders", label: "Holders" },
  { id: "exit", label: "Exit" },
  { id: "flow", label: "Flow" },
  { id: "narrative", label: "Narrative" },
  { id: "creator", label: "Creator" },
];

export function SectionNav() {
  const [active, setActive] = useState<string>("checks");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-108px 0px -55% 0px", threshold: 0 },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      aria-label="Report sections"
      className="sticky top-[52px] z-30 -mx-4 mb-4 flex gap-0.5 overflow-x-auto border-b border-ink-800 bg-ink-950/95 px-4 backdrop-blur-sm scroll-thin sm:-mx-6 sm:px-6"
    >
      {SECTIONS.map((s) => {
        const on = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={on ? "true" : undefined}
            className={`shrink-0 border-b-2 px-2.5 py-2 t-meta transition ${
              on
                ? "border-brand-500 font-medium text-brand-400"
                : "border-transparent text-mute-500 hover:border-ink-600 hover:text-slate-200"
            }`}
          >
            {s.label}
          </a>
        );
      })}
      <span className="ml-auto hidden shrink-0 items-center gap-2 py-2 pl-3 t-meta text-mute-500 sm:flex">
        <LegendDot cls="bg-ok-600" label="pass" />
        <LegendDot cls="bg-warn-600" label="watch" />
        <LegendDot cls="bg-bad-600" label="fail" />
        <LegendDot cls="bg-ink-500" label="unknown" />
      </span>
    </nav>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${cls}`} />
      {label}
    </span>
  );
}
