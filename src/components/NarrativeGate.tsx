"use client";

import Link from "next/link";
import { useMemo } from "react";
import { shortAddr } from "@/lib/demo";
import { classifyWallet, firstOutCount, walletProfile } from "@/lib/intel";
import { narrativeWallets } from "@/lib/intel2";
import { useViewer } from "@/lib/viewer";
import { DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * INLINE GATE — the one that sits where the reader already is.
 *
 * A gate at the top of a page is a banner: it asks for a decision before the
 * reader has a reason to make one, and nobody clicks it. This sits at the
 * bottom of a single narrative card, after that narrative's numbers, and its
 * headline is computed from that narrative's own tokens — not a generic list
 * of what Pro includes.
 *
 * The free reader has just learned "4 attempts, mindshare falling". The next
 * question is who ran those attempts. That question is what this states, with
 * the count already filled in.
 * ==================================================================== */

export function NarrativeWalletGate({ narrative }: { narrative: string }) {
  const { pro } = useViewer();

  const read = useMemo(
    () =>
      narrativeWallets(
        narrative,
        classifyWallet,
        walletProfile,
        firstOutCount,
        DEMO_TOKENS.filter((t) => t.narrative === narrative),
      ),
    [narrative],
  );

  // Nothing to sell if no wallets are on record for this narrative — saying so
  // is more useful than a gate over an empty set.
  if (read.rows.length === 0) {
    return (
      <div className="border-t border-line px-3 py-2">
        <p className="t-xs leading-relaxed text-fg4">
          No wallet on record holds a token on this narrative yet, so there is no holder history to
          show
        </p>
      </div>
    );
  }

  if (pro) {
    return (
      <div className="border-t border-line">
        <div className="flex flex-wrap items-baseline gap-2 bg-surf2/40 px-3 py-1.5">
          <span className="t-eyebrow">who is on this narrative</span>
          <span className="font-mono text-[9.5px] tabular-nums text-fg4">
            {read.rows.length} wallets
          </span>
          {read.repeat > 0 && (
            <span className="font-mono text-[9.5px] text-warn">{read.repeat} in 2+ tokens</span>
          )}
          {read.blockZeroCount > 0 && (
            <span className="font-mono text-[9.5px] text-bad">{read.blockZeroCount} block-0</span>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_78px_44px_44px] items-baseline gap-x-2 border-b border-line px-3 py-1 sm:grid-cols-[minmax(0,1fr)_96px_48px_48px_48px]">
          <span className="t-eyebrow">wallet</span>
          <span className="hidden t-eyebrow sm:block">behaviour</span>
          <span className="t-eyebrow text-right">here</span>
          <span className="t-eyebrow text-right">launch</span>
          <span className="t-eyebrow text-right">first</span>
        </div>
        {read.rows.slice(0, 8).map((r) => (
          <div
            key={r.addr}
            className="grid grid-cols-[minmax(0,1fr)_78px_44px_44px] items-baseline gap-x-2 border-b border-line px-3 py-[5px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_96px_48px_48px_48px]"
          >
            <span className="flex min-w-0 items-baseline gap-1.5">
              <Link
                href={`/wallets/${r.addr}`}
                className="font-mono text-[10px] text-fg2 hover:text-acid"
              >
                {shortAddr(r.addr, 5, 3)}
              </Link>
              <span className="truncate t-xs text-fg4">{r.tokensHere.join(" · ")}</span>
            </span>
            <span
              className={`hidden truncate font-mono text-[8.5px] uppercase tracking-[0.04em] sm:block ${
                r.behaviour === "block-0 bundler"
                  ? "text-bad"
                  : r.behaviour === "insider supply"
                    ? "text-hot"
                    : r.behaviour === "patient holder"
                      ? "text-good"
                      : "text-fg4"
              }`}
            >
              {r.behaviour}
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
              {r.tokensHere.length}
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
              {r.launches}
            </span>
            <span
              className={`text-right font-mono text-[10px] tabular-nums ${
                r.firstOut > 0 ? "text-bad" : "text-fg4"
              }`}
            >
              {r.firstOut > 0 ? `${r.firstOut}×` : "—"}
            </span>
          </div>
        ))}
        {read.medianRugRate !== null && (
          <div className="border-t border-line px-3 py-1.5">
            <p className="t-xs leading-relaxed text-fg4">
              Median prior-collapse share across these wallets:{" "}
              <span className="text-fg3">{Math.round(read.medianRugRate * 100)}%</span>. &ldquo;here&rdquo;
              is how many tokens on this narrative the address holds; &ldquo;first&rdquo; is how often it
              led the exit on another launch
            </p>
          </div>
        )}
      </div>
    );
  }

  // ---- free: state the finding, name the next question, one action --------
  const tokensHeld = [...new Set(read.rows.flatMap((r) => r.tokensHere))];
  const veteran = read.rows.filter((r) => r.launches >= 3).length;
  const repeatLine =
    read.repeat > 0
      ? `${read.repeat} of these ${read.rows.length} addresses already hold more than one token on this narrative`
      : `${read.rows.length} addresses on record here, all in ${tokensHeld.join(" and ")}. ${veteran} of them have three or more prior launches — which is where their behaviour is measured, not on this token`;

  return (
    <div className="border-t border-acid/25 bg-acid/[0.03]">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2">
        <svg
          viewBox="0 0 10 10"
          className="h-[9px] w-[9px] shrink-0 self-center text-acid"
          aria-hidden
          fill="none"
        >
          <rect x="2" y="4.5" width="6" height="4.5" stroke="currentColor" strokeWidth="1" />
          <path d="M3.2 4.5V3.2a1.8 1.8 0 0 1 3.6 0v1.3" stroke="currentColor" strokeWidth="1" />
        </svg>
        <span className="t-strong text-fg">You have the idea. The next question is who ran it</span>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-fg4">
          pro
        </span>
      </div>

      <div className="px-3 pb-2">
        <p className="t-xs leading-relaxed text-fg2">{repeatLine}.</p>

        {/* the specific rows this narrative would open, stated as facts ---- */}
        <ul className="mt-1.5 space-y-0.5">
          <li className="flex items-start gap-1.5">
            <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid/70" />
            <span className="t-xs leading-snug text-fg3">
              Which of them bought inside the creation block, and which arrived after the crowd
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid/70" />
            <span className="t-xs leading-snug text-fg3">
              Their prior launches and how many collapsed
              {read.medianRugRate !== null && (
                <span className="text-fg2">
                  {" "}
                  — median share of those launches that ended in a collapse:{" "}
                  {Math.round(read.medianRugRate * 100)}%
                </span>
              )}
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid/70" />
            <span className="t-xs leading-snug text-fg3">
              Which address sells first when a launch turns — the exit everyone else prices against
            </span>
          </li>
        </ul>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Link
            href="/pricing"
            className="flex h-7 items-center bg-acid px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-bg transition-colors hover:bg-acid2"
          >
            See who they are
          </Link>
          <span className="t-xs text-fg4">
            {read.rows.length} addresses with a launch record in these tokens — not the full holder list
          </span>
        </div>
      </div>
    </div>
  );
}
