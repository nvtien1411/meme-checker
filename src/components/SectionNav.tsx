"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "checks", label: "Checks" },
  { id: "holders", label: "Holders" },
  { id: "exit", label: "Exit" },
  { id: "flow", label: "Flow" },
  { id: "narrative", label: "Narrative" },
  { id: "project", label: "Project" },
  { id: "creator", label: "Creator" },
];

/**
 * Sticky section index. The report is long and ordered by severity rather than
 * topic, so finding the holder table is otherwise a scroll hunt. The verdict
 * block above the nav has no tab of its own, so it is deliberately not
 * observed — including it left nothing highlighted at the top of the page.
 */
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
      { rootMargin: "-118px 0px -60% 0px", threshold: 0 },
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
      className="sticky top-[53px] z-30 -mx-4 overflow-x-auto border-y border-ink-750 bg-ink-950/94 px-4 backdrop-blur-md sm:-mx-6 sm:px-6"
    >
      <div className="flex gap-0.5">
        {SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={on ? "true" : undefined}
              className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 t-meta transition-colors ${
                on ? "font-medium text-brand-400" : "text-mute-500 hover:text-slate-200"
              }`}
            >
              {s.label}
              {on && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-brand-500"
                />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
