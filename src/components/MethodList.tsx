"use client";

import { useState } from "react";
import { Panel } from "./ui";

/* ==================================================================== *
 * METHOD LIST — the accordion.
 *
 * Split out of the page so the page itself stays a server component and can
 * still export metadata, which Next forbids from a "use client" module.
 * ==================================================================== */

export type Band = { state: "pass" | "warn" | "fail" | "unknown"; label: string; note: string };

export type MethodCheck = {
  id: string;
  q: string;
  reads: string;
  weight: number;
  gate: boolean;
  bands: Band[];
  blind: string;
};

const STATE_TONE: Record<string, string> = {
  pass: "text-good border-good/35",
  warn: "text-warn border-warn/35",
  fail: "text-bad border-bad/35",
  unknown: "text-fg4 border-line2",
};

const GLYPH: Record<string, string> = { pass: "✓", warn: "!", fail: "✕", unknown: "?" };

export function MethodList({ checks }: { checks: MethodCheck[] }) {
  const [open, setOpen] = useState<string | null>(checks[0]?.id ?? null);

  return (
    <div className="space-y-2.5">
      {checks.map((c, idx) => {
        const isOpen = open === c.id;
        return (
          <Panel key={c.id} flush>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
              className="drow flex w-full items-start gap-2 px-3 py-2 text-left"
            >
              <span className="mt-[3px] t-mono text-[9px] text-acid">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <span className="t-xs font-semibold text-fg">{c.q}</span>
                <p className="mt-0.5 t-xs leading-snug text-fg4">{c.reads}</p>
              </div>
              <span
                aria-hidden
                className={`shrink-0 t-mono text-[10px] text-fg4 transition-transform ${isOpen ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </button>

            {isOpen && (
              <div className="fade-up border-t border-line">
                <div className="divide-y divide-line">
                  {c.bands.map((b) => (
                    <div key={b.state} className="flex items-start gap-2 px-3 py-1.5">
                      <span
                        className={`mt-[1px] grid h-[14px] w-[14px] shrink-0 place-items-center border font-mono text-[8px] leading-none ${STATE_TONE[b.state]}`}
                      >
                        {GLYPH[b.state]}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-fg3">
                          {b.label}
                        </span>
                        <span className="ml-1.5 t-xs text-fg4">{b.note}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line bg-surf2/60 px-3 py-1.5">
                  <span className="t-eyebrow">cannot see</span>
                  <p className="mt-0.5 t-xs leading-relaxed text-fg3">{c.blind}</p>
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
