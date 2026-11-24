"use client";

import { useEffect, useState } from "react";
import { WATCH_EVENT, isWatched, toggleWatched, type WatchKind } from "@/lib/watchlist";

/* ==================================================================== *
 * WATCH TOGGLE
 *
 * One button, on every entity a degen might want to come back to. It reads
 * after mount rather than during render, because localStorage does not exist
 * on the server and reading it during render is how these toggles end up
 * flipped in the static HTML and flip back on hydration.
 * ==================================================================== */

export function WatchToggle({
  kind,
  id,
  label,
  href,
  compact = false,
}: {
  kind: WatchKind;
  id: string;
  label: string;
  href: string;
  compact?: boolean;
}) {
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setOn(isWatched(kind, id));
    sync();
    window.addEventListener(WATCH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [kind, id]);

  // Before mount the real state is unknown; render the neutral label rather
  // than guessing "not saved" and then flipping.
  const active = on === true;

  return (
    <button
      type="button"
      onClick={() => setOn(toggleWatched(kind, id, label, href))}
      aria-pressed={active}
      title={active ? "Remove from watchlist" : "Save to watchlist — stored in this browser"}
      className={`inline-flex shrink-0 items-center gap-1 border px-1.5 py-[2px] font-mono uppercase tracking-[0.04em] transition-colors ${
        compact ? "text-[8px]" : "text-[9px]"
      } ${
        active
          ? "border-acid/50 bg-acid/10 text-acid hover:bg-acid/15"
          : "border-line text-fg4 hover:border-fg4 hover:text-fg2"
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        className={compact ? "h-[9px] w-[9px]" : "h-[10px] w-[10px]"}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M8 2.2 9.7 6 13.8 6.6 10.9 9.4 11.6 13.5 8 11.6 4.4 13.5 5.1 9.4 2.2 6.6 6.3 6" />
      </svg>
      {active ? "saved" : "watch"}
    </button>
  );
}
