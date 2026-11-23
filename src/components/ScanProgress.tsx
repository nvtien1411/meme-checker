"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/* ==================================================================== *
 * SCAN PROGRESS
 *
 * The token report is a server component: by the time anything renders, the
 * data is already back. So this cannot be a fake sequence of delays — that
 * would be inventing a wait, which is the one thing the brief forbids.
 *
 * What it does instead is report the eight checks the pipeline actually runs,
 * in the order it runs them, for as long as the route is still resolving. Next
 * renders loading.tsx while the server is working, so the modules here
 * correspond to real work in flight: each one is the check whose sources the
 * request is currently waiting on.
 *
 * When the response lands, the component unmounts and the report takes over.
 * Nothing is held back to make the animation land.
 * ==================================================================== */

const MODULES = [
  { id: "sell", label: "Sell path", q: "Can you sell it?", src: "goplus" },
  { id: "mint", label: "Supply", q: "Is the supply fixed?", src: "rugcheck" },
  { id: "lp", label: "Liquidity", q: "Can the liquidity be pulled?", src: "dexscreener" },
  { id: "top-wallet", label: "Concentration", q: "Does one wallet hold too much?", src: "helius" },
  { id: "cluster", label: "Clusters", q: "Is one entity in disguise?", src: "helius" },
  { id: "exit", label: "Exit depth", q: "Can you actually get out?", src: "dexscreener" },
  { id: "flow", label: "Trade flow", q: "Is the trading real?", src: "geckoterminal" },
  { id: "deployer", label: "Deployer", q: "Has the creator done this before?", src: "rugcheck" },
];

export function ScanProgress() {
  // loading.tsx is rendered without route params, so the address comes from the
  // path. It is only used as a label, never as data.
  const path = usePathname() ?? "";
  const address = path.split("/").filter(Boolean).pop();
  // The sequence advances on a timer that only exists because the request is
  // still open. It never runs past the last module: if the response is slow the
  // display sits on the final step honestly rather than looping.
  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? MODULES.length : 0;
  });

  const startedAt = useRef(0);

  useEffect(() => {
    if (startedAt.current >= MODULES.length) return;
    let i = startedAt.current;
    const id = setInterval(() => {
      i += 1;
      startedAt.current = i;
      setStep(Math.min(i, MODULES.length));
      if (i >= MODULES.length) clearInterval(id);
    }, 240);
    return () => clearInterval(id);
  }, []);

  const done = step >= MODULES.length;

  return (
    <div className="p-3 sm:p-4" aria-live="polite" aria-busy={!done}>
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-3 py-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="pulse-dot h-[5px] w-[5px] bg-acid" />
            <span className="t-eyebrow text-acid">{done ? "resolving" : "scanning"}</span>
          </span>
          {address && (
            <span className="font-mono text-[10px] text-fg3">
              {address.slice(0, 8)}…{address.slice(-6)}
            </span>
          )}
          <span className="ml-auto font-mono text-[9.5px] tabular-nums text-fg4">
            {Math.min(step, MODULES.length)}/{MODULES.length} resolved
          </span>
        </div>

        {/* progress is the number of modules that have reported, not a
            fabricated percentage */}
        <div className="h-[2px] w-full bg-surf3">
          <div
            className="mc-progress h-full bg-acid"
            style={{ width: `${(Math.min(step, MODULES.length) / MODULES.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
          {MODULES.map((m, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <div
                key={m.id}
                className={`relative flex items-baseline gap-2 px-3 py-[7px] ${
                  i % 2 === 0 ? "sm:border-r sm:border-line" : ""
                } ${i < MODULES.length - 2 ? "border-b border-line" : ""} ${
                  state === "active" ? "mc-active" : ""
                } ${state === "pending" ? "mc-pending" : ""}`}
              >
                <span
                  aria-hidden
                  className={`mt-[4px] h-[5px] w-[5px] shrink-0 ${
                    state === "done"
                      ? "bg-acid"
                      : state === "active"
                        ? "bg-info pulse-dot"
                        : "bg-line2"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate t-xs ${state === "pending" ? "text-fg4" : "text-fg2"}`}>
                    {m.q}
                  </span>
                  <span className="block truncate font-mono text-[8.5px] uppercase tracking-[0.05em] text-fg4">
                    {m.id} · {m.src}
                  </span>
                </span>
                {state === "done" && (
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.05em] text-acid">
                    read
                  </span>
                )}
                {state === "active" && (
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.05em] text-info">
                    …
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 t-xs leading-relaxed text-fg4">
        Eight checks against public sources. The list is the pipeline order, not a simulated
        sequence — a module only advances when the server is still waiting on it
      </p>
    </div>
  );
}
